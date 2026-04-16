import { ConnectButton } from "@/components/ConnectButton";
import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

type AppShellProps = {
    children: ReactNode;
    maxContentWidth?: string;
};

const NAV_ITEMS = [
    { label: "Market", href: "/market" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Liquidation", href: "/liquidation" },
];

const AppShell = ({
    children,
    maxContentWidth = "1440px",
}: AppShellProps) => {
    const navigate = useRouter();
    const currentPath = usePathname();

    return (
        <Flex
            as="main"
            minHeight="100vh"
            width="100%"
            direction="column"
            bg="background"
            color="gray.800"
            position="relative"
            overflow="hidden"
            px={{ base: "4", md: "8", xl: "10" }}
            py={{ base: "5", md: "8" }}
            alignItems="center"
        >
            <Box
                position="absolute"
                inset="0"
                pointerEvents="none"
                bgGradient="linear(to-br, rgba(255,255,255,0.94), rgba(248,250,252,0.92))"
            />
            <Box
                position="absolute"
                top="-8rem"
                left="-5rem"
                w="20rem"
                h="20rem"
                rounded="full"
                bg="rgba(15,23,42,0.05)"
                filter="blur(18px)"
            />
            <Box
                position="absolute"
                top="9rem"
                right="-4rem"
                w="18rem"
                h="18rem"
                rounded="full"
                bg="rgba(148,163,184,0.16)"
                filter="blur(26px)"
            />

            <Flex
                direction="column"
                gap="8"
                width="100%"
                maxW={maxContentWidth}
                position="relative"
                zIndex="1"
            >
                <Box
                    bg="rgba(255,255,255,0.76)"
                    borderWidth="1px"
                    borderColor="rgba(148,163,184,0.18)"
                    rounded="3xl"
                    px={{ base: "5", md: "8" }}
                    py={{ base: "5", md: "6" }}
                    boxShadow="0 24px 60px rgba(15,23,42,0.08)"
                    backdropFilter="blur(16px)"
                >
                    <Flex
                        direction={{ base: "column", lg: "row" }}
                        gap={{ base: "5", lg: "6" }}
                        align={{ base: "flex-start", lg: "center" }}
                        justify="space-between"
                    >
                        <Flex direction="column" gap="2" minW="0">
                            <Heading
                                as="h1"
                                size="xl"
                                color="gray.900"
                                letterSpacing="-0.03em"
                            >
                                Starknet Lending
                            </Heading>
                        </Flex>

                        <Flex
                            direction={{ base: "column", md: "row" }}
                            align={{ base: "stretch", md: "center" }}
                            gap="4"
                            width={{ base: "100%", lg: "auto" }}
                        >
                            <HStack
                                spacing="2"
                                p="1.5"
                                rounded="full"
                                bg="rgba(15,23,42,0.04)"
                                borderWidth="1px"
                                borderColor="rgba(148,163,184,0.18)"
                                alignSelf={{ base: "stretch", md: "center" }}
                                justify={{ base: "space-between", md: "flex-start" }}
                            >
                                {NAV_ITEMS.map((item) => {
                                    const isActive = currentPath === item.href;

                                    return (
                                        <Box
                                            key={item.href}
                                            as="button"
                                            type="button"
                                            onClick={() => navigate.push(item.href)}
                                            px={{ base: "4", md: "5" }}
                                            py="2.5"
                                            rounded="full"
                                            fontSize="sm"
                                            fontWeight={isActive ? "semibold" : "medium"}
                                            color={isActive ? "gray.900" : "gray.600"}
                                            bg={isActive ? "white" : "transparent"}
                                            boxShadow={
                                                isActive
                                                    ? "0 10px 24px rgba(15,23,42,0.10)"
                                                    : "none"
                                            }
                                            transition="all 0.2s ease"
                                            _hover={{
                                                color: "gray.900",
                                                bg: isActive ? "white" : "rgba(255,255,255,0.65)",
                                            }}
                                        >
                                            {item.label}
                                        </Box>
                                    );
                                })}
                            </HStack>

                            <ConnectButton />
                        </Flex>
                    </Flex>
                </Box>

                <Box>{children}</Box>
            </Flex>
        </Flex>
    );
};

export { AppShell };
