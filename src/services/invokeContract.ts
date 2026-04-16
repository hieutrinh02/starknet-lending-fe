import { MARKET_CONTRACT, provider } from "@/constants";
import { walletStarknetKitAtom } from "@/state";
import MockTokenABI from "@/abi/MockToken.json";
import { useAtom } from "jotai";
import { CallData, Contract } from "starknet";
import { parseInputAmountToUint256 } from "@/utils";

const useStarknet = () => {
    const [wallet, _] = useAtom(walletStarknetKitAtom);
    const account = wallet?.account;

    const checkTokenAllowance = async (data: any) => {
        const tokenContract = new Contract(MockTokenABI, data?.tokenAddr, provider);
        const allowance = await tokenContract.call(
            "allowance",
            [data?.owner, data?.spender],
            { blockIdentifier: "latest" }
        );
        if (allowance < data?.amount) {
            return true;
        }
        return false;
    };

    const handleSupply = async (data: any) => {
        const supplyAmountWithOffset = parseInputAmountToUint256(
            data?.supplyAmount
        );
        const isApproveNeeded = await checkTokenAllowance({
            tokenAddr: data?.tokenAddr,
            owner: account?.address,
            spender: MARKET_CONTRACT,
            amount: supplyAmountWithOffset.low,
        });
        const res = await account.execute([
            ...(isApproveNeeded
                ? [
                    {
                        contractAddress: data?.tokenAddr,
                        entrypoint: "approve",
                        calldata: CallData.compile({
                            spender: MARKET_CONTRACT,
                            amount: supplyAmountWithOffset,
                        }),
                    },
                ]
                : []),
            {
                contractAddress: MARKET_CONTRACT,
                entrypoint: "supply",
                calldata: CallData.compile({
                    token: data?.tokenAddr,
                    collateral: data?.collateralAddr,
                    supplyAmount: supplyAmountWithOffset,
                }),
            },
        ]);

        return res;
    };

    const handleBorrow = async (data: any) => {
        const borrowAmountWithOffset = parseInputAmountToUint256(
            data?.borrowAmount
        );
        const collateralAmountWithOffset = parseInputAmountToUint256(
            data?.collateralAmount
        );
        const isApproveNeeded = await checkTokenAllowance({
            tokenAddr: data?.collateralAddr,
            owner: account?.address,
            spender: MARKET_CONTRACT,
            amount: collateralAmountWithOffset.low,
        });
        const res = await account.execute([
            ...(isApproveNeeded
                ? [
                    {
                        contractAddress: data?.collateralAddr,
                        entrypoint: "approve",
                        calldata: CallData.compile({
                            spender: MARKET_CONTRACT,
                            amount: collateralAmountWithOffset,
                        }),
                    },
                ]
                : []),
            {
                contractAddress: MARKET_CONTRACT,
                entrypoint: "borrow",
                calldata: CallData.compile({
                    borrow_token: data?.tokenAddr,
                    borrow_amount: borrowAmountWithOffset,
                    collateral_token: data?.collateralAddr,
                    collateral_amount: collateralAmountWithOffset,
                }),
            },
        ]);

        return res;
    };

    const handleWithdraw = async (data: any) => {
        const lpAmountWithdrawWithOffset = parseInputAmountToUint256(
            data?.lpAmountWithdraw
        );
        const res = await account.execute({
            contractAddress: MARKET_CONTRACT,
            entrypoint: "withdraw",
            calldata: CallData.compile({
                token: data?.tokenAddr,
                collateral: data?.collateralAddr,
                lp_amount_withdraw: lpAmountWithdrawWithOffset,
            }),
        });

        return res;
    };

    const handleRepay = async (data: any) => {
        const totalRepayAmountWithOffset = parseInputAmountToUint256(
            data?.totalRepayAmount
        );
        const isApproveNeeded = await checkTokenAllowance({
            tokenAddr: data?.repayTokenAddr,
            owner: account?.address,
            spender: MARKET_CONTRACT,
            amount: totalRepayAmountWithOffset.low,
        });
        const res = await account.execute([
            ...(isApproveNeeded
                ? [
                    {
                        contractAddress: data?.repayTokenAddr,
                        entrypoint: "approve",
                        calldata: CallData.compile({
                            spender: MARKET_CONTRACT,
                            amount: totalRepayAmountWithOffset,
                        }),
                    },
                ]
                : []),
            {
                contractAddress: MARKET_CONTRACT,
                entrypoint: "repay",
                calldata: CallData.compile({
                    repay_token: data?.repayTokenAddr,
                    collateral_token: data?.collateralAddr,
                    borrow_id: {
                        low: data?.borrowId,
                        high: 0,
                    },
                }),
            },
        ]);

        return res;
    };

    const handleLiquidate = async (data: any) => {
        const totalLiquidationAmountWithOffset = parseInputAmountToUint256(
            data?.totalLiquidationAmount
        );
        const isApproveNeeded = await checkTokenAllowance({
            tokenAddr: data?.repayTokenAddr,
            owner: account?.address,
            spender: MARKET_CONTRACT,
            amount: totalLiquidationAmountWithOffset.low,
        });

        const res = await account.execute([
            ...(isApproveNeeded
                ? [
                    {
                        contractAddress: data?.repayTokenAddr,
                        entrypoint: "approve",
                        calldata: CallData.compile({
                            spender: MARKET_CONTRACT,
                            amount: totalLiquidationAmountWithOffset,
                        }),
                    },
                ]
                : []),
            {
                contractAddress: MARKET_CONTRACT,
                entrypoint: "liquidate",
                calldata: CallData.compile({
                    repay_token: data?.repayTokenAddr,
                    collateral_token: data?.collateralAddr,
                    borrower: data?.borrower,
                    borrow_id: {
                        low: data?.borrowId,
                        high: 0,
                    },
                }),
            },
        ]);

        return res;
    };

    return {
        handleSupply,
        handleBorrow,
        handleWithdraw,
        handleRepay,
        handleLiquidate,
    };
};

export default useStarknet;
