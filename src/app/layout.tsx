import { Box } from "@chakra-ui/react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Starknet Lending",
    description:
        "Front end for interacting with Starknet Lending contract",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <Box as="body" className={inter.className} bg="background" color="gray.800">
                <Providers>{children}</Providers>
            </Box>
        </html>
    )
}
