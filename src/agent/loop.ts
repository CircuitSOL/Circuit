import Anthropic from "@anthropic-ai/sdk";
import type { DeFiPosition, CircuitBreakerRule } from "../lib/types.js";
import type { Config } from "../lib/config.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";
import { fetchKaminoPositions, fetchMarginFiPositions } from "../positions/fetcher.js";
import { assessAll } from "../risk/assessor.js";
import { printRiskBoard } from "../output/printer.js";
import { logger } from "../lib/logger.js";

function getDefaultRules(config: Config): CircuitBreakerRule[] {
  return [
    { id: "hf-critical", name: "Health Factor Critical", triggerCondition: "health_factor < threshold", action: "alert_only", threshold: config.CRITICAL_HEALTH_FACTOR_THRESHOLD, enabled: true },
    { id: "hf-warning", name: "Health Factor Warning", triggerCondition: "health_factor < threshold", action: "reduce_position", threshold: config.WARNING_HEALTH_FACTOR_THRESHOLD, enabled: true },
    { id: "drawdown-large", name: "Large Drawdown", triggerCondition: "pnl_pct < -threshold", action: "close_position", threshold: 20, enabled: false },
    { id: "add-collateral", name: "Auto Add Collateral", triggerCondition: "health_factor < threshold", action: "add_collateral", threshold: config.WATCH_HEALTH_FACTOR_THRESHOLD, enabled: false },
  ];
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "fetch_positions",
    description: "Fetch all open lending/borrowing positions for the configured wallet.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "assess_risk",
    description: "Run risk assessment on all loaded positions and return health factor analysis.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_circuit_rules",
    description: "List all configured circuit-breaker rules and their status.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "recommend_action",
    description: "Generate a specific action plan for a position given current risk level.",
    input_schema: {
      type: "object" as const,
      properties: {
        position_id: { type: "string" },
        risk_level: { type: "string", enum: ["safe", "watch", "warning", "critical"] },
      },
      required: ["position_id", "risk_level"],
    },
  },
];

export async function runAgentLoop(config: Config): Promise<void> {
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  const defaultRules = getDefaultRules(config);

  logger.info("Fetching DeFi positions...");
  const [kaminoPositions, marginFiPositions] = await Promise.all([
    fetchKaminoPositions(config.WALLET_ADDRESS),
    fetchMarginFiPositions(config.WALLET_ADDRESS),
  ]);

  const positions: DeFiPosition[] = [...kaminoPositions, ...marginFiPositions];
  const assessments = assessAll(positions);

  printRiskBoard(positions, assessments);

  const atRisk = assessments.filter((a) => a.riskLevel === "warning" || a.riskLevel === "critical");
  if (atRisk.length === 0 && positions.length > 0) {
    logger.info("All positions healthy — skipping agent analysis");
    return;
  }

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserPrompt(positions, assessments) },
  ];

  let iterations = 0;
  while (iterations < 8) {
    iterations++;
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: buildSystemPrompt(),
      tools: TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      if (text) console.log("\n" + text);
      break;
    }

    if (response.stop_reason !== "tool_use") break;
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      let result: string;

      if (block.name === "fetch_positions") {
        const fresh = await Promise.all([
          fetchKaminoPositions(config.WALLET_ADDRESS),
          fetchMarginFiPositions(config.WALLET_ADDRESS),
        ]);
        positions.length = 0; positions.push(...fresh.flat());
        result = JSON.stringify(positions);
      } else if (block.name === "assess_risk") {
        const fresh = assessAll(positions);
        assessments.length = 0; assessments.push(...fresh);
        result = JSON.stringify(assessments);
      } else if (block.name === "get_circuit_rules") {
        result = JSON.stringify(defaultRules);
      } else if (block.name === "recommend_action") {
        const input = block.input as { position_id: string; risk_level: string };
        const pos = positions.find((p) => p.id.startsWith(input.position_id));
        const assessment = assessments.find((a) => a.positionId.startsWith(input.position_id));
        result = JSON.stringify({
          position_id: input.position_id,
          risk_level: input.risk_level,
          auto_exit_enabled: config.AUTO_EXIT,
          recommendations: assessment?.recommendations ?? ["Position not found"],
          collateral_usd: pos?.collateralUsd ?? 0,
          debt_usd: pos?.debtUsd ?? 0,
        });
      } else {
        result = JSON.stringify({ error: `Unknown tool: ${block.name}` });
      }

      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }

    messages.push({ role: "user", content: toolResults });
  }
}
