import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type FyersTrade = {
  id?: string;
  orderId?: string;
  symbol?: string;
  side?: number; // 1 = BUY, -1 = SELL
  qty?: number;
  tradedPrice?: number;
  orderDateTime?: string;
};

type RawFyersTradesResponse = {
  tradeBook?: FyersTrade[];
  trades?: FyersTrade[];
  orderBook?: FyersTrade[];
};

type CleanTrade = {
  symbol: string;
  side: "LONG" | "SHORT";
  entryTime: string | null;
  exitTime: string | null;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
};

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("fyers_access_token")?.value;
    const appId = process.env.FYERS_APP_ID;

    if (!accessToken || !appId) {
      return NextResponse.json({ success: false, trades: [] });
    }

    const fyersRes = await fetch("https://api-t1.fyers.in/api/v3/tradebook", {
      method: "GET",
      headers: {
        Authorization: `${appId}:${accessToken}`,
      },
      cache: "no-store",
    });
    console.log("FYERS status:", fyersRes.status);
    console.log("FYERS content-type:", fyersRes.headers.get("content-type"));

    const rawText = await fyersRes.text();
    console.log('FYERS raw text:', rawText)

    let data: RawFyersTradesResponse = {};

    const rawTrades = Array.isArray(data.tradeBook) ? data.tradeBook : [];

    if (rawTrades.length > 0) {
      console.log("FIRST TRADE OBJECT:", JSON.stringify(rawTrades[0], null, 2));
    }

    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json({ success: false, trades: [] });
    }

    console.log('FYERS parsed object:', JSON.stringify(data, null, 2))


    console.log("COOKIE:", request.cookies.get("fyers_access_token"));
    const trades: FyersTrade[] =
      data.tradeBook || data.trades || data.orderBook || [];

    if (!trades.length) {
      return NextResponse.json({ success: true, trades: [] });
    }

    // ✅ STEP 1: Sort trades by time
    trades.sort((a, b) => {
      return (
        new Date(a.orderDateTime || 0).getTime() -
        new Date(b.orderDateTime || 0).getTime()
      );
    });

    // ✅ STEP 2: Group by symbol
    const grouped: Record<string, FyersTrade[]> = {};

    for (const t of trades) {
      if (!t.symbol) continue;
      if (!grouped[t.symbol]) grouped[t.symbol] = [];
      grouped[t.symbol].push(t);
    }

    const result: CleanTrade[] = [];

    // ✅ STEP 3: Reconstruct trades
    for (const symbol in grouped) {
      const tList = grouped[symbol];

      let positionQty = 0;
      let entryValue = 0;
      let entryQty = 0;

      let entryTime: string | null = null;
      let exitTime: string | null = null;

      for (const t of tList) {
        const qty = t.qty || 0;
        const price = t.tradedPrice || 0;

        if (t.side === 1) {
          // BUY
          if (positionQty === 0) {
            entryTime = t.orderDateTime || null;
          }

          positionQty += qty;
          entryQty += qty;
          entryValue += qty * price;
        }

        if (t.side === -1) {
          // SELL
          positionQty -= qty;

          if (positionQty === 0) {
            exitTime = t.orderDateTime || null;

            const avgEntry = entryQty ? entryValue / entryQty : 0;
            const exitValue = qty * price;

            const pnl = (price - avgEntry) * entryQty;

            result.push({
              symbol,
              side: "LONG",
              entryTime,
              exitTime,
              entryPrice: avgEntry,
              exitPrice: price,
              qty: entryQty,
              pnl,
            });

            // reset for next trade
            entryQty = 0;
            entryValue = 0;
            entryTime = null;
            exitTime = null;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      trades: result,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      trades: [],
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}
