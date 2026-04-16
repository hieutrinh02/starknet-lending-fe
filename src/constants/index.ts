import { RpcProvider, constants } from "starknet";

export const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL as string;

export const MARKET_CONTRACT = process.env
  .NEXT_PUBLIC_MARKET_CONTRACT as string;

export const PRICE_DECIMALS = BigInt(10 ** 8);
export const TOKEN_DECIMALS = 1_000_000_000_000_000_000;
export const TOKEN_DECIMALS_BIGINT = BigInt(TOKEN_DECIMALS);
export const PERCENTAGE_DECIMALS = 100;
export const DISPLAYED_MINIMUM_COLLATERAL_DECIMALS = 1_000_000_000_000;
export const DISPLAYED_MINIMUM_COLLATERAL_SCALE = BigInt(
  DISPLAYED_MINIMUM_COLLATERAL_DECIMALS
);
export const DISPLAYED_MINIMUM_COLLATERAL_OFFSET = 12;
export const UPPER_LIQUIDATION_THRESHOLD = 1.5;
export const LIQUIDATION_THRESHOLD = 1.2;
export const LIQUIDATION_THRESHOLD_NUMERATOR = BigInt(12);
export const LIQUIDATION_THRESHOLD_DENOMINATOR = BigInt(10);
export const LOWER_LIQUIDATION_THRESHOLD = 1.0;
export const MAX_LTV_NUMERATOR = BigInt(8);
export const MAX_LTV_DENOMINATOR = BigInt(10);
export const HF_DISPLAY_SCALE = BigInt(10_000);
export const SECS_IN_YEAR = 31_536_000;
export const TX_DELAY_SECS = 86400;

export const CHAIN_ID =
  process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.NetworkName.SN_MAIN
    : constants.NetworkName.SN_SEPOLIA;

const NODE_URL = process.env.NEXT_PUBLIC_RPC_URL as string;

const STARKNET_CHAIN_ID =
  process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.StarknetChainId.SN_MAIN
    : constants.StarknetChainId.SN_SEPOLIA;

export const provider = new RpcProvider({
  nodeUrl: NODE_URL,
  chainId: STARKNET_CHAIN_ID,
  batch: 0,
});

export const ARGENT_WEBWALLET_URL = "https://web.argent.xyz";
