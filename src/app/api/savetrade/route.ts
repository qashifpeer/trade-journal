import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";
import { getOrCreateTag } from "@/src/lib/tag";

type SaveTradeRequestBody = {
  date?: unknown;
  trade?: unknown;
  outcome?: unknown;
  riskTaken?: unknown;
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
  riskTaken?: number;
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
  outcome: number;
  netPnl: number;
  riskTaken?: number;
  charges: number;
  notes: string;
  tags: Array<{
    _id: string;
    title: string;
    value: string;
  }>;
};

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown, fallback = 0): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallback;
}

function getTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (tag): tag is string =>
            typeof tag === "string",
        )
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidDateRange(
  startDate: string,
  endDate: string,
): boolean {
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

function getDateRangeError(
  startDate: string,
  endDate: string,
): string {
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

async function parseJsonBody(
  request: Request,
): Promise<
  | {
      ok: true;
      body: SaveTradeRequestBody;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  try {
    const body = (await request.json()) as SaveTradeRequestBody;

    return {
      ok: true,
      body,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "Request body must contain valid JSON",
        },
        { status: 400 },
      ),
    };
  }
}

export async function POST(request: Request) {
  try {
    const parsedBody = await parseJsonBody(request);

    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const { body } = parsedBody;

    const date = getString(body.date);
    const trade = getString(body.trade);
    const notes = getString(body.notes);
    const tagTitles = getTags(body.tags);

    const outcome = getNumber(body.outcome);
    const riskTaken = Math.abs(getNumber(body.riskTaken),);
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

    if (
  body.riskTaken !== undefined &&
  riskTaken < 0
) {
  return NextResponse.json(
    {
      ok: false,
      error: "Risk taken cannot be negative",
    },
    { status: 400 },
  );
}

    const client = getSanityWriteClient();

    const tagDocuments = await Promise.all(
      tagTitles.map((tagTitle) =>
        getOrCreateTag(tagTitle),
      ),
    );

    const document: SavedTradeCreateDocument = {
      _type: "savedTrade",
      date,
      trade,
      outcome,
      riskTaken,
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

    const startDate = getString(
      searchParams.get("startDate"),
    );

    const endDate = getString(
      searchParams.get("endDate"),
    );

    if (!isValidDateRange(startDate, endDate)) {
      return NextResponse.json(
        {
          ok: false,
          error: getDateRangeError(
            startDate,
            endDate,
          ),
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
        outcome,
        netPnl,
        riskTaken,
        charges,
        notes,
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