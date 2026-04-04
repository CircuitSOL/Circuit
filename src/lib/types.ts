export type ProtocolName = "kamino" | "marginfi" | "drift" | "mango";
export type RiskLevel = "safe" | "watch" | "warning" | "critical";
export type TriggerAction = "reduce_position" | "close_position" | "add_collateral" | "alert_only";

export interface DeFiPosition {
  id: string;
  protocol: ProtocolName;
  walletAddress: string;
  collateralToken: string;
  debtToken: string;
  collateralUsd: number;
  debtUsd: number;
  healthFactor: number;
  liquidationThreshold: number;
  netApy: number;
  openedAt: number;
  updatedAt: number;
}

export interface RiskAssessment {
  positionId: string;
  riskLevel: RiskLevel;
  healthFactor: number;
  distanceToLiquidation: number;
  estimatedTimeToLiquidation?: number;
  recommendations: string[];
  generatedAt: number;
}

export interface CircuitBreakerRule {
  id: string;
  name: string;
  triggerCondition: string;
  action: TriggerAction;
  threshold: number;
  enabled: boolean;
}
