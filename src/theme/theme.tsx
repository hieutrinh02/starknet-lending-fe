import {
    ChakraProvider,
    ChakraProviderProps,
    ThemeConfig,
    theme as baseTheme,
    extendTheme
} from "@chakra-ui/react";
import { colors } from "./colors";

const config: ThemeConfig = {
    initialColorMode: "light",
    useSystemColorMode: false,
};

const extendedTheme = extendTheme({
    config,
    styles: {
        global: {
            "html, body": {
                bg: "background",
                color: "gray.800",
                backgroundImage:
                    "radial-gradient(circle at top left, rgba(15,23,42,0.04), transparent 26%), radial-gradient(circle at right 20%, rgba(148,163,184,0.18), transparent 20%)",
            },
        },
    },
    components: {
        Modal: {
            parts: ["overlay", "dialog", "header", "body", "footer"],
            baseStyle: {
                overlay: {
                    bg: "blackAlpha.300",
                    backdropFilter: "blur(4px)",
                    transition: "background-color 0.3s ease"
                },
                dialog: {
                    bg: "white",
                    color: "gray.800",
                    borderRadius: "2xl",
                    boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                    borderWidth: "1px",
                    borderColor: "gray.200",
                },
                header: {
                    fontSize: "xl",
                    fontWeight: "bold",
                    color: "gray.900",
                },
                body: {
                    fontSize: "md",
                    color: "gray.700",
                },
                footer: {
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "2",
                },
            },
        },
    },
});

export type UITheme = Omit<typeof baseTheme, "colors" | "semanticTokens"> & {
    colors: typeof colors;
};

export const theme = {
    ...extendedTheme,
    colors /** omits default Chakra UI colors */,
} as UITheme;

/** Theme with initial color mode "light" also see {@link SetDarkMode} */
export const ThemeProvider = ({ children }: ChakraProviderProps) => (
    <ChakraProvider theme={theme}>{children}</ChakraProvider>
);
