import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";

function getMonthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);

  if (!year || !monthIndex || monthIndex < 1 || monthIndex > 12) {
    return null;
  }

  const start = new Date(year, monthIndex - 1, 1);
  const end = new Date(year, monthIndex, 1);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  return { startDate, endDate };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month")?.trim();

    if (!month) {
      return NextResponse.json(
        { ok: false, error: "Month is required" },
        { status: 400 }
      );
    }

    const range = getMonthRange(month);

    if (!range) {
      return NextResponse.json(
        { ok: false, error: "Invalid month format" },
        { status: 400 }
      );
    }

    const query = `
      *[
        _type == "intradayTrade" &&
        date >= $startDate &&
        date < $endDate
      ] | order(date desc) {
        _id,
        date,
        numberOfTrades,
        outcome,
        charges,
        netPnl,
        notes,
        tags[]->{
          _id,
          title,
          value
        },
        "indexImageUrl": indexImage.asset->url,
        "tradesImageUrl": tradesImage.asset->url
      }
    `;

    const client = getSanityWriteClient();
    const items = await client.fetch(query, range);

    return NextResponse.json({
      ok: true,
      month,
      items,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch monthwise trades" },
      { status: 500 }
    );
  }
}