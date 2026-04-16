import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { StarknetWindowObject } from "starknetkit-latest";

export type MarketPool = {
    pool: string;
    poolAddress: string;
    tokenAddress: string;
    collateralTokenAddress: string;
};

export type MarketDataItem = MarketPool & {
    totalBorrowInUSD: string;
    totalSupplyInUSD: string;
    totalBorrow: string;
    totalSupply: string;
    ur: string;
    borrowAPR: string;
    supplyAPY: string;
};

export type UserSupplyDataItem = MarketPool & {
    lpOwned: string;
    tokenSupplied: string;
    supplyAPY: string;
};

export type UserBorrowDataItem = MarketPool & {
    borrowId: string;
    borrowAmount: string;
    collateralAmount: string;
    hf: string;
    borrowAPR: string;
    borrowStartTime: string;
    interest: string;
};

export type LiquidationDataItem = {
    poolName: string;
    poolAddr: string;
    tokenAddress: string;
    collateralTokenAddress: string;
    borrowerAddress: string;
    borrowId: string;
    borrowAmount: string;
    collateralAmount: string;
    hf: string;
    borrowAPR: string;
    borrowStartTime: string;
    interest: string;
};

export const walletStarknetKitAtom = atomWithReset<
    StarknetWindowObject | null | undefined
>(undefined);

// Atom to track the hover state
export const isHoveredAtom = atom(false);

export const tokenPriceDataAtom = atom<Record<string, bigint>>({});

export const marketDataAtom = atom<MarketDataItem[]>([]);

export const userSupplyDataAtom = atom<UserSupplyDataItem[]>([]);

export const userBorrowDataAtom = atom<UserBorrowDataItem[]>([]);

export const liquidationDataAtom = atom<LiquidationDataItem[]>([]);

export const loadingMarketAtom = atom(true);
export const reloadMarketAtom = atom(false);
export const loadingDashboardAtom = atom(true);
export const reloadDashboardAtom = atom(false);
export const loadingLiquidationAtom = atom(true);
export const reloadLiquidationAtom = atom(false);

export const borrowModalLoadingAtom = atom<string | null>(null);

export const modalStateAtom = atom<{
    isOpen: boolean;
    type?: "Supply" | "Borrow" | "Withdraw" | "Repay" | "Liquidate";
}>({
    isOpen: false,
    type: undefined,
});

export const activePoolAtom = atom<MarketPool | null>(null);
export const amountAtom = atom("");
export const collateralAmountAtom = atom("");
export const lpAmountWithdrawAtom = atom("");
export const activeSupplyAtom = atom<UserSupplyDataItem | null>(null);
export const activeBorrowAtom = atom<UserBorrowDataItem | null>(null);
export const activeLiquidationAtom = atom<LiquidationDataItem | null>(null);
