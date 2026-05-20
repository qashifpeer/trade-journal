import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";
import type { SaveTradePayload } from "@/src/types/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveTradePayload;

    if (!body.symbol?.trim()) {
      return NextResponse.json(
        { success: false, error: "Symbol is required" },
        { status: 400 }
      );
    }

    if (!body.tradeDate) {
      return NextResponse.json(
        { success: false, error: "Trade date is required" },
        { status: 400 }
      );
    }

    if (!body.direction || !["Long", "Short"].includes(body.direction)) {
      return NextResponse.json(
        { success: false, error: "Direction must be Long or Short" },
        { status: 400 }
      );
    }

    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { success: false, error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    if (body.entryPrice <= 0 || body.exitPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Entry and exit prices must be greater than 0" },
        { status: 400 }
      );
    }

    const client = getSanityWriteClient();
    const now = new Date().toISOString();

    const doc = {
      _type: "trade",
      fyersTradeId: body.fyersTradeId || `MANUAL-${Date.now()}`,
      symbol: body.symbol.trim().toUpperCase(),
      direction: body.direction,
      quantity: Number(body.quantity),
      entryPrice: Number(body.entryPrice),
      exitPrice: Number(body.exitPrice),
      entryTime: body.entryTime || "",
      exitTime: body.exitTime || "",
      pnl: Number(body.pnl || 0),
      tradeDate: body.tradeDate,
      setup: body.setup || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: body.notes || "",
      mistakes: Array.isArray(body.mistakes) ? body.mistakes : [],
      lessons: body.lessons || "",
      emotionalState: body.emotionalState || "",
      marketCondition: body.marketCondition || "",
      outcome: body.outcome || "",
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    const created = await client.create(doc);

    return NextResponse.json({
      success: true,
      tradeId: created._id,
      mode: "created",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save manual trade",
      },
      { status: 500 }
    );
  }
}