// src/app/api/sanity/trades/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body.fyersTradeIds) ? body.fyersTradeIds : [];

    if (!ids.length) {
      return NextResponse.json(
        { success: true, trades: [] },
        { status: 200 }
      );
    }

    const client = getSanityWriteClient();

    const trades = await client.fetch(
      `*[_type == "trade" && fyersTradeId in $ids]{
        _id,
        fyersTradeId
      }`,
      { ids }
    );

    const mapped =
      Array.isArray(trades) &&
      trades.map((t: { _id: string; fyersTradeId: string }) => ({
        fyersTradeId: t.fyersTradeId,
        sanityId: t._id,
      }));

    return NextResponse.json(
      { success: true, trades: mapped || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sanity status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch status",
      },
      { status: 500 }
    );
  }
}