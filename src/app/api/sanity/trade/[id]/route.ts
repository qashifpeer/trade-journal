// src/app/api/sanity/trade/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid trade id" },
        { status: 400 }
      );
    }

    const client = getSanityWriteClient();

    const trade = await client.fetch(
      `*[_type == "trade" && _id == $id][0]{
        _id,
        fyersTradeId,
        symbol,
        direction,
        quantity,
        entryPrice,
        exitPrice,
        entryTime,
        exitTime,
        pnl,
        tradeDate,
        setup,
        outcome,
        tags,
        marketCondition,
        emotionalState,
        notes,
        mistakes,
        lessons,
        createdAt,
        updatedAt,
        isSaved,
        status
      }`,
      { id }
    );

    if (!trade) {
      return NextResponse.json(
        { success: false, error: "Trade not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        trade,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sanity fetch trade error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trade",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}