<div align="center">

# Circuit

**Liquidation-defense circuit breaker for Solana credit positions.**
Circuit watches health factors, scores risk in real time, and turns a drifting position into a concrete action plan before liquidation becomes a race.

[![Build](https://img.shields.io/github/actions/workflow/status/CircuitSOL/Circuit/ci.yml?branch=master&style=flat-square&label=Build)](https://github.com/CircuitSOL/Circuit/actions)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
[![Built with Claude Agent SDK](https://img.shields.io/badge/Built%20with-Claude%20Agent%20SDK-2dd4bf?style=flat-square)](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk)

</div>

---

Most Solana liquidations do not arrive out of nowhere. The position was deteriorating, the health factor kept narrowing, and nobody had a system translating that drift into a practical response. Circuit is built for that exact gap.

It monitors credit positions on supported protocols, classifies them into operational risk states, and escalates with the action that best matches the level of danger. That can mean alert-only mode, a reduce-position recommendation, or automatic exit behavior when the threshold is too dangerous to leave unattended.

`FETCH -> ASSESS -> MATCH RULES -> ANALYZE -> ACT`

---

Risk Dashboard - Circuit Breaker Rules - At a Glance - Operating Surfaces - Escalation Ladder - How It Works - Example Output - Risk Controls - Quick Start

## At a Glance

- `Use case`: liquidation defense for leveraged or borrowed Solana positions
- `Primary input`: collateral, debt, health factor, liquidation threshold, and protocol-specific position state
- `Primary failure mode`: watching health drift too late and reacting after liquidation risk is already urgent
- `Best for`: operators managing lending exposure on Kamino and MarginFi who want structured escalation

## Position Risk Dashboard

![Circuit Dashboard](assets/preview-dashboard.svg)

## Circuit Breaker Rules

![Circuit Rules](assets/preview-rules.svg)

## Operating Surfaces

- `Risk Dashboard`: shows which positions are safe, degrading, or already near the edge
- `Rule Engine`: maps health thresholds to actions such as alert-only, reduce, close, or add collateral
- `Assessment Loop`: converts raw position data into a readable risk narrative
- `Action Layer`: either prints the recommended action or executes it when auto-exit is enabled

## Why Circuit Exists

Solana lending positions degrade in a predictable way before they fail. The difficulty is not understanding liquidation math in theory. The difficulty is monitoring enough positions often enough to act before a manageable problem becomes a forced unwind.

Circuit exists to turn that monitoring burden into an always-on defensive process. It is not a yield optimizer. It is not trying to squeeze more leverage out of a position. It is a control system for people who want to protect capital when credit conditions change quickly.

## The Escalation Ladder

Circuit is built around a simple idea: every health state should map to a different operational posture.

| Level | Health Factor | Operational meaning |
|-------|---------------|---------------------|
| `SAFE` | above watch threshold | position is healthy, monitor only |
| `WATCH` | drifting toward risk | alert with context, no immediate intervention |
| `WARNING` | materially weaker | prepare to reduce debt or add collateral |
| `CRITICAL` | close to liquidation | immediate action or automated exit path |

This ladder matters because a liquidation system should not treat every drift the same way. Early warnings and emergency states need different behavior.

## How It Works

Circuit runs a defense loop every cycle:

1. pull the latest supported lending positions for the monitored wallet
2. compute health, liquidation distance, and risk state
3. compare each position against the configured breaker rules
4. ask the agent to summarize what changed and what should be done next
5. print or execute the highest-priority actions

That sequence is intentionally operational. The output is not just "health factor 1.08." It is "reduce this debt now," "add collateral on this venue," or "keep watching because the position is still recoverable."

## What A Strong Circuit Deployment Looks Like

- positions are checked frequently enough that drift is caught before panic mode
- the watch, warning, and critical thresholds reflect actual operator tolerance
- auto-exit is reserved for the states where hesitation is more dangerous than action
- the printed recommendation uses amounts and steps the operator can immediately follow

If those pieces are missing, the system becomes another dashboard instead of a real breaker.

## Example Output

```text
CIRCUIT // POSITION ALERT

protocol           kamino
position           SOL borrow against JTO collateral
health factor      1.07
risk level         warning
distance to liq    6.1%

recommended action:
- repay part of the debt leg
- or add fresh collateral within the next cycle
```

## What Circuit Refuses To Pretend

Circuit is useful because it is narrow about what it can defend.

- it does not claim to cover protocols it is not actually scanning
- it does not call a position safe just because it is not critical yet
- it does not confuse passive monitoring with real liquidation defense

The goal is defensive clarity, not a broad but shallow credit abstraction.

## Risk Controls

- `threshold-based escalation`: each risk class is tied to explicit health cutoffs
- `auto-exit off by default`: operators can start in alert-only mode before enabling execution
- `position-level recommendations`: recommendations are attached to the actual position instead of a generic market warning
- `continuous polling`: the system is biased toward early detection rather than after-the-fact reporting

Circuit is best used as a standing control layer. If a position is already deep in the danger zone when monitoring begins, the system can still help, but it is no longer solving the easy part.

## Quick Start

```bash
git clone https://github.com/CircuitSOL/Circuit
cd Circuit
bun install
cp .env.example .env
bun run dev
```

## Configuration

```bash
ANTHROPIC_API_KEY=sk-ant-...
WALLET_ADDRESS=your-wallet
CHECK_INTERVAL_MS=15000
WATCH_HEALTH_FACTOR_THRESHOLD=1.2
WARNING_HEALTH_FACTOR_THRESHOLD=1.1
CRITICAL_HEALTH_FACTOR_THRESHOLD=1.05
AUTO_EXIT=false
LOG_LEVEL=info
```

## License

MIT

---

*the best liquidation defense starts before the position looks dramatic.*
