import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";
import type { SaveTradePayload } from "@/src/types/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        updatedAt
      }`,
      { id }
    );

    if (!trade) {
      return NextResponse.json(
        { success: false, error: "Trade not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, trade });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load trade",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as SaveTradePayload;
    const client = getSanityWriteClient();

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

    const updated = await client
      .patch(id)
      .set({
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
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return NextResponse.json({
      success: true,
      tradeId: updated._id,
      mode: "updated",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update trade",
      },
      { status: 500 }
    );
  }
}