// src/app/api/sanity/save-trade/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";
import type { SaveTradePayload } from "@/src/types/api";

export const dynamic = "force-dynamic";

function invalid(message: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SaveTradePayload>;

    const requiredStringFields: (keyof SaveTradePayload)[] = [
      "fyersTradeId",
      "symbol",
      "direction",
      "entryTime",
      "exitTime",
      "tradeDate",
    ];

    for (const field of requiredStringFields) {
      const value = body[field];
      if (!value || typeof value !== "string" || !value.trim()) {
        return invalid(`Missing or invalid field: ${field}`);
      }
    }

    const requiredNumberFields: (keyof SaveTradePayload)[] = [
      "quantity",
      "entryPrice",
      "exitPrice",
      "pnl",
    ];

    for (const field of requiredNumberFields) {
      const value = body[field];
      if (typeof value !== "number" || Number.isNaN(value)) {
        return invalid(`Missing or invalid numeric field: ${field}`);
      }
    }

    const tradeDate = body.tradeDate!;
    const fyersTradeId = body.fyersTradeId!.trim();
    const symbol = body.symbol!.trim();
    const direction = body.direction!.trim();

    const tags = Array.isArray(body.tags)
      ? body.tags.filter(
          (t): t is string => typeof t === "string" && t.trim().length > 0
        )
      : [];

    const mistakes = Array.isArray(body.mistakes)
      ? body.mistakes.filter(
          (m): m is string => typeof m === "string" && m.trim().length > 0
        )
      : [];

    const sanityDoc = {
      _type: "trade",
      tradeDate,
      fyersTradeId,
      symbol,
      direction,
      quantity: body.quantity!,
      entryPrice: body.entryPrice!,
      exitPrice: body.exitPrice!,
      entryTime: body.entryTime!,
      exitTime: body.exitTime!,
      pnl: body.pnl!,
      setup: body.setup || undefined,
      outcome: body.outcome || undefined,
      tags,
      marketCondition: body.marketCondition || undefined,
      emotionalState: body.emotionalState || undefined,
      notes: body.notes || undefined,
      mistakes,
      lessons: body.lessons || undefined,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const client = getSanityWriteClient();
    const created = await client.create(sanityDoc);

    return NextResponse.json(
      {
        success: true,
        tradeId: created._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sanity save error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save trade",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}