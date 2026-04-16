import { ARGENT_WEBWALLET_URL, CHAIN_ID, provider } from "@/constants";
import { walletStarknetKitAtom, isHoveredAtom } from "@/state";
import { Button } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { RESET } from "jotai/utils";
import { FC, useCallback } from "react";
import { connect, disconnect } from "starknetkit-latest";

const connectWallet = async () => {
    return connect({
        provider,
        modalMode: "alwaysAsk",
        modalTheme: "light",
        webWalletUrl: ARGENT_WEBWALLET_URL,
        argentMobileOptions: {
            dappName: "Starknet Lending",
            url: window.location.hostname,
            chainId: CHAIN_ID,
            icons: [],
        },
    });
};

const ConnectButton: FC = () => {
    const [wallet, setWallet] = useAtom(walletStarknetKitAtom);
    const [isHovered, setIsHovered] = useAtom(isHoveredAtom);

    // Memoized connect function
    const connectFn = useCallback(async () => {
        try {
            const { wallet } = await connectWallet();
            setWallet(wallet);
        } catch (e) {
            console.error(e);
            alert((e as Error).message);
        }
    }, [setWallet]);

    // Memoized disconnect function
    const disconnectFn = useCallback(async () => {
        try {
            await disconnect();
            setWallet(RESET);
        } catch (e) {
            console.error(e);
            alert((e as Error).message);
        }
    }, [setWallet]);

    // Caching the wallet address for reuse
    const walletAddress = wallet?.account?.address;
    const displayAddress = walletAddress
        ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-6)}`
        : "";

    return (
        <Button
            px="5"
            py="4"
            rounded="full"
            onClick={!wallet?.isConnected ? connectFn : disconnectFn}
            minW={{ base: "100%", md: "12rem" }}
            bg={wallet?.isConnected ? "rgba(255,255,255,0.88)" : "gray.900"}
            color={wallet?.isConnected ? "gray.900" : "white"}
            borderWidth="1px"
            borderColor={wallet?.isConnected ? "rgba(148,163,184,0.22)" : "gray.900"}
            boxShadow={
                wallet?.isConnected
                    ? "0 12px 24px rgba(15,23,42,0.08)"
                    : "0 16px 32px rgba(15,23,42,0.18)"
            }
            fontWeight="semibold"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            _hover={{
                transform: "translateY(-1px)",
                bg: wallet?.isConnected ? "white" : "black",
                color: wallet?.isConnected ? "gray.900" : "white",
            }}
            transition="all 0.2s ease"
        >
            {!wallet?.isConnected
                ? "Connect"
                : isHovered
                    ? "Disconnect"
                    : displayAddress}
        </Button>
    );
};

export { ConnectButton, connectWallet };
