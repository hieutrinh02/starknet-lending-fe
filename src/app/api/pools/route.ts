import { NextResponse } from "next/server";

export async function GET() {
    const indexerUrl = process.env.NEXT_PUBLIC_INDEXER_URL;

    if (!indexerUrl) {
        return NextResponse.json(
            { error: "NEXT_PUBLIC_INDEXER_URL is not configured" },
            { status: 500 }
        );
    }

    try {
        const response = await fetch(`${indexerUrl}/pools`, { cache: "no-store" });
        const payload = await response.json();

        return NextResponse.json(payload, { status: response.status });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to fetch pools from indexer",
                detail: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 502 }
        );
    }
}
