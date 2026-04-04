import { describe, it, expect } from "vitest";
import { assessPosition, assessAll } from "../src/risk/assessor.js";
import type { DeFiPosition } from "../src/lib/types.js";

function makePosition(overrides: Partial<DeFiPosition> = {}): DeFiPosition {
  return {
    id: "pos-test-1",
    protocol: "kamino",
    walletAddress: "testWallet",
    collateralToken: "SOL",
    debtToken: "USDC",
    collateralUsd: 10_000,
    debtUsd: 6_000,
    healthFactor: 1.45,
    liquidationThreshold: 1.0,
    netApy: 4.2,
    openedAt: Date.now() - 86_400_000,
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("assessPosition", () => {
  it("classifies safe position correctly", () => {
    const pos = makePosition({ healthFactor: 1.6 });
    const a = assessPosition(pos);
    expect(a.riskLevel).toBe("safe");
    expect(a.distanceToLiquidation).toBeCloseTo(0.6);
  });

  it("classifies watch position", () => {
    const pos = makePosition({ healthFactor: 1.15 });
    const a = assessPosition(pos);
    expect(a.riskLevel).toBe("watch");
  });

  it("classifies warning position", () => {
    const pos = makePosition({ healthFactor: 1.08 });
    const a = assessPosition(pos);
    expect(a.riskLevel).toBe("warning");
  });

  it("classifies critical position", () => {
    const pos = makePosition({ healthFactor: 1.02 });
    const a = assessPosition(pos);
    expect(a.riskLevel).toBe("critical");
    expect(a.recommendations.length).toBeGreaterThan(0);
    expect(a.recommendations[0]).toContain("URGENT");
  });

  it("sorts assessAll by distance to liquidation ascending", () => {
    const positions = [
      makePosition({ id: "pos-1", healthFactor: 1.6 }),
      makePosition({ id: "pos-2", healthFactor: 1.02 }),
      makePosition({ id: "pos-3", healthFactor: 1.12 }),
    ];
    const result = assessAll(positions);
    expect(result[0].healthFactor).toBeLessThan(result[1].healthFactor);
    expect(result[1].healthFactor).toBeLessThan(result[2].healthFactor);
  });
});
