import { num, uint256 } from "starknet";
import { PERCENTAGE_DECIMALS, TOKEN_DECIMALS } from "@/constants";

export interface BigDecimal {
    value: bigint;
    decimals: number;
}

export const feltToStr = (felt: bigint) => {
    let hex = felt.toString(16);
    if (hex.length % 2 !== 0) {
        hex = "0" + hex;
    }
    const text = Buffer.from(hex, "hex").toString("utf8");
    return text;
};

export const strToFelt = (text: string) => {
    if (text.length > 31) {
        throw new Error("Text length too long to convert to felt.");
    }
    if (text.length <= 0) {
        throw new Error("Text length too short to convert to felt.");
    }
    return BigInt("0x" + Buffer.from(text, "utf8").toString("hex"))
        .toString()
        .replace("n", "");
};

export const formatNumber = (value: number): string => {
    let actual_val = value / TOKEN_DECIMALS;
    if (actual_val >= 1_000_000_000) {
        return `${(actual_val / 1_000_000_000).toFixed(2)}B`; // Billion
    } else if (actual_val >= 1_000_000) {
        return `${(actual_val / 1_000_000).toFixed(2)}M`; // Million
    } else if (actual_val >= 1_000) {
        return `${(actual_val / 1_000).toFixed(2)}K`; // Thousand
    }
    let return_val = actual_val.toFixed(2);
    if (return_val === Number(0).toFixed(2)) {
        return `${actual_val}`;
    }
    return `${return_val}`; // For smaller numbers
};

export const formatUSDNumber = (value: number): string => {
    let actual_val = value / TOKEN_DECIMALS;
    if (actual_val >= 1_000_000_000) {
        return `$${(actual_val / 1_000_000_000).toFixed(2)}B`; // Billion
    } else if (actual_val >= 1_000_000) {
        return `$${(actual_val / 1_000_000).toFixed(2)}M`; // Million
    } else if (actual_val >= 1_000) {
        return `$${(actual_val / 1_000).toFixed(2)}K`; // Thousand
    }
    return `$${actual_val.toFixed(2)}`; // For smaller numbers
};

export const formatUserSupplyNumber = (value: number): string => {
    let actual_val = value / TOKEN_DECIMALS;
    let return_val = actual_val.toFixed(2);
    if (return_val === Number(0).toFixed(2)) {
        return `${actual_val}`;
    }
    return `${return_val}`;
};

export const formatUserBorrowNumber = (value: number): string => {
    let actual_val = value / TOKEN_DECIMALS;
    let return_val = actual_val.toFixed(2);
    if (return_val === Number(0).toFixed(2)) {
        return `${actual_val}`;
    }
    return `${return_val}`;
};

export const formatCollateralNumber = (value: number): string => {
    let actual_val = value / TOKEN_DECIMALS;
    let return_val = actual_val.toFixed(2);
    if (return_val === Number(0).toFixed(2)) {
        return `${actual_val}`;
    }
    return `${return_val}`;
};

export const formatInterestNumber = (value: number): string => {
    return `${(value / TOKEN_DECIMALS).toFixed(2)}`;
};

export const formatPercentage = (value: number): string => {
    return `${(value / PERCENTAGE_DECIMALS).toFixed(2)}`;
};

export const formatScaledDecimal = (
    value: bigint,
    scale: bigint,
    options?: { trimTrailingZeros?: boolean },
): string => {
    const whole = value / scale;
    const fraction = (value % scale)
        .toString()
        .padStart(scale.toString().length - 1, "0");

    if (options?.trimTrailingZeros) {
        const trimmedFraction = fraction.replace(/0+$/, "");
        return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
    }

    return `${whole}.${fraction}`;
};

export const parseUnits = (value: string, decimals: number): BigDecimal => {
    let [integer, fraction = ""] = value.split(".");

    const negative = integer.startsWith("-");
    if (negative) {
        integer = integer.slice(1);
    }

    // If the fraction is longer than allowed, round it off
    if (fraction.length > decimals) {
        const unitIndex = decimals;
        const unit = Number(fraction[unitIndex]);

        if (unit >= 5) {
            const fractionBigInt = BigInt(fraction.slice(0, decimals)) + BigInt(1);
            fraction = fractionBigInt.toString().padStart(decimals, "0");
        } else {
            fraction = fraction.slice(0, decimals);
        }
    } else {
        fraction = fraction.padEnd(decimals, "0");
    }

    const parsedValue = BigInt(`${negative ? "-" : ""}${integer}${fraction}`);

    return {
        value: parsedValue,
        decimals,
    };
};

export const formatUnits = (
    value: bigint | string,
    decimals: number,
    options?: { trimTrailingZeros?: boolean }
): string => {
    const parsedValue = typeof value === "bigint" ? value : BigInt(value);
    const scale = BigInt(10) ** BigInt(decimals);

    return formatScaledDecimal(parsedValue, scale, options);
};

export const getUint256CalldataFromBN = (bn: num.BigNumberish) =>
    uint256.bnToUint256(bn);

export const parseInputAmountToUint256 = (
    input: string,
    decimals: number = 18,
) => getUint256CalldataFromBN(parseUnits(input, decimals).value);
