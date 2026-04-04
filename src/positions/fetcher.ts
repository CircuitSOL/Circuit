import type { DeFiPosition } from "../lib/types.js";
import { logger } from "../lib/logger.js";

interface KaminoObligation {
  pubkey: string;
  deposits: Array<{ mintAddress: string; amount: number; marketValue: number }>;
  borrows: Array<{ mintAddress: string; amount: number; marketValue: number }>;
  netAccountValue: number;
  loanToValue: number;
  unhealthyLoanToValue: number;
}

export async function fetchKaminoPositions(walletAddress: string): Promise<DeFiPosition[]> {
  try {
    const res = await fetch(
      `https://api.kamino.finance/kamino-market/positions?walletAddress=${walletAddress}`
    );
    if (!res.ok) return [];

    const obligations = (await res.json()) as KaminoObligation[];
    return obligations.map((ob): DeFiPosition => {
      const collateral = ob.deposits[0];
      const debt = ob.borrows[0];
      const ltv = ob.loanToValue;
      const healthFactor = ob.unhealthyLoanToValue > 0 ? ob.unhealthyLoanToValue / ltv : 1.5;

      return {
        id: ob.pubkey,
        protocol: "kamino",
        walletAddress,
        collateralToken: collateral?.mintAddress?.slice(0, 6) ?? "Unknown",
        debtToken: debt?.mintAddress?.slice(0, 6) ?? "Unknown",
        collateralUsd: ob.deposits.reduce((s, d) => s + d.marketValue, 0),
        debtUsd: ob.borrows.reduce((s, b) => s + b.marketValue, 0),
        healthFactor,
        liquidationThreshold: ob.unhealthyLoanToValue,
        netApy: 0,
        openedAt: Date.now() - 86_400_000,
        updatedAt: Date.now(),
      };
    });
  } catch (err) {
    logger.debug("Failed to fetch Kamino positions:", err);
    return [];
  }
}

interface MarginFiAccount {
  address: string;
  healthFactor: number;
  totalAssets: number;
  totalLiabilities: number;
}

export async function fetchMarginFiPositions(walletAddress: string): Promise<DeFiPosition[]> {
  try {
    const res = await fetch(
      `https://marginfi-api.mngo.cloud/v0/accounts?authority=${walletAddress}`
    );
    if (!res.ok) return [];

    const accounts = (await res.json()) as { accounts?: MarginFiAccount[] };
    return (accounts.accounts ?? []).map((acc): DeFiPosition => ({
      id: acc.address,
      protocol: "marginfi",
      walletAddress,
      collateralToken: "USDC",
      debtToken: "SOL",
      collateralUsd: acc.totalAssets,
      debtUsd: acc.totalLiabilities,
      healthFactor: acc.healthFactor,
      liquidationThreshold: 1.0,
      netApy: 0,
      openedAt: Date.now() - 86_400_000,
      updatedAt: Date.now(),
    }));
  } catch (err) {
    logger.debug("Failed to fetch MarginFi positions:", err);
    return [];
  }
}
