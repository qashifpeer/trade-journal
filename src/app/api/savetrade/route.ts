// app/api/savetrade/route.ts

import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";
import { getOrCreateTag } from "@/src/lib/tag";

type SaveTradeRequestBody = {
  date?: unknown;
  trade?: unknown;
  outcome?: unknown;
  charges?: unknown;
  notes?: unknown;
  tags?: unknown;
};

type SavedTradeTagReference = {
  _type: "reference";
  _ref: string;
  _key: string;
};

type SavedTradeCreateDocument = {
  _type: "savedTrade";
  date: string;
  trade: string;
  outcome: number;
  charges: number;
  netPnl: number;
  notes: string;
  tags: SavedTradeTagReference[];
  createdAt: string;
};

type SavedTradeListItem = {
  _id: string;
  date: string;
  trade: string;
  netPnl: number;
  charges: number;
  tags: Array<{
    _id: string;
    title: string;
    value: string;
  }>;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallback;
}

function getTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidDateRange(startDate: string, endDate: string) {
  if (startDate && !isValidDate(startDate)) {
    return false;
  }

  if (endDate && !isValidDate(endDate)) {
    return false;
  }

  if (startDate && endDate && startDate > endDate) {
    return false;
  }

  return true;
}

function getDateRangeError(startDate: string, endDate: string) {
  if (startDate && !isValidDate(startDate)) {
    return "Start date must use the YYYY-MM-DD format";
  }

  if (endDate && !isValidDate(endDate)) {
    return "End date must use the YYYY-MM-DD format";
  }

  if (startDate && endDate && startDate > endDate) {
    return "Start date cannot be later than end date";
  }

  return "Invalid date range";
}

export async function POST(request: Request) {
  try {
    let body: SaveTradeRequestBody;

    try {
      body = (await request.json()) as SaveTradeRequestBody;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Request body must contain valid JSON",
        },
        { status: 400 },
      );
    }

    const date = getString(body.date);
    const trade = getString(body.trade);
    const notes = getString(body.notes);
    const tagTitles = getTags(body.tags);

    const outcome = getNumber(body.outcome);
    const charges = Math.abs(getNumber(body.charges));
    const netPnl = outcome - charges;

    if (!date) {
      return NextResponse.json(
        {
          ok: false,
          error: "Date is required",
        },
        { status: 400 },
      );
    }

    if (!isValidDate(date)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Date must use the YYYY-MM-DD format",
        },
        { status: 400 },
      );
    }

    if (!trade) {
      return NextResponse.json(
        {
          ok: false,
          error: "Trade or contract name is required",
        },
        { status: 400 },
      );
    }

    const client = getSanityWriteClient();

    const tagDocuments = await Promise.all(
      tagTitles.map((tagTitle) => getOrCreateTag(tagTitle)),
    );

    const document: SavedTradeCreateDocument = {
      _type: "savedTrade",
      date,
      trade,
      outcome,
      charges,
      netPnl,
      notes,
      tags: tagDocuments.map((tag) => ({
        _type: "reference",
        _ref: tag._id,
        _key: crypto.randomUUID(),
      })),
      createdAt: new Date().toISOString(),
    };

    const result = await client.create(document);

    return NextResponse.json(
      {
        ok: true,
        id: result._id,
        message: "Trade saved successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Save trade API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to save trade",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate = getString(searchParams.get("startDate"));
    const endDate = getString(searchParams.get("endDate"));

    if (!isValidDateRange(startDate, endDate)) {
      return NextResponse.json(
        {
          ok: false,
          error: getDateRangeError(startDate, endDate),
        },
        { status: 400 },
      );
    }

    const filters = ['_type == "savedTrade"'];
    const queryParams: Record<string, string> = {};

    if (startDate) {
      filters.push("date >= $startDate");
      queryParams.startDate = startDate;
    }

    if (endDate) {
      filters.push("date <= $endDate");
      queryParams.endDate = endDate;
    }

    const query = `
      *[${filters.join(" && ")}]
      | order(date desc, _createdAt desc) {
        _id,
        date,
        trade,
        netPnl,
        charges,
        tags[]->{
          _id,
          title,
          value
        }
      }
    `;

    const client = getSanityWriteClient();

    const trades = await client.fetch<SavedTradeListItem[]>(
      query,
      queryParams,
    );

    return NextResponse.json({
      ok: true,
      trades,
    });
  } catch (error) {
    console.error("Get trades API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load trades",
      },
      { status: 500 },
    );
  }
}