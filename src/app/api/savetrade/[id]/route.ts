// app/api/savetrade/[id]/route.ts

import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";
import { getOrCreateTag } from "@/src/lib/tag";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateTradeRequestBody = {
  date?: unknown;
  trade?: unknown;
  outcome?: unknown;
  riskTaken?: unknown;
  netPnl?: unknown;
  charges?: unknown;
  notes?: unknown;
  tags?: unknown;
};

type TradeTag = {
  _id: string;
  title: string;
  value: string;
};

type TradeResponse = {
  _id: string;
  date: string;
  trade: string;
  outcome: number;
  riskTaken: number;
  netPnl: number;
  charges: number;
  notes: string;
  tags: TradeTag[];
};

type ExistingTrade = {
  _id: string;
  outcome?: number;
  riskTaken?: number;
  netPnl?: number;
  charges?: number;
};

type SavedTradeTagReference = {
  _type: "reference";
  _ref: string;
  _key: string;
};

type ParsedBodyResult =
  | {
      ok: true;
      body: UpdateTradeRequestBody;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown): number | null {
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

  return null;
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

function isValidDate(value: string): boolean {
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

function getTradeProjection() {
  return `
    _id,
    date,
    trade,
    outcome,
    riskTaken,
    netPnl,
    charges,
    notes,
    tags[]->{
      _id,
      title,
      value
    }
  `;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unknown error";
}

async function parseJsonBody(
  request: Request,
): Promise<ParsedBodyResult> {
  try {
    const body = (await request.json()) as UpdateTradeRequestBody;

    if (!body || typeof body !== "object") {
      return {
        ok: false,
        response: NextResponse.json(
          {
            ok: false,
            error: "Request body must be a JSON object",
          },
          { status: 400 },
        ),
      };
    }

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

async function getTradeById(
  id: string,
): Promise<TradeResponse | null> {
  const client = getSanityWriteClient();

  return client.fetch<TradeResponse | null>(
    `*[_type == "savedTrade" && _id == $id][0]{
      ${getTradeProjection()}
    }`,
    { id },
  );
}

async function getExistingTrade(
  id: string,
): Promise<ExistingTrade | null> {
  const client = getSanityWriteClient();

  return client.fetch<ExistingTrade | null>(
    `*[_type == "savedTrade" && _id == $id][0]{
      _id,
      outcome,
      riskTaken,
      netPnl,
      charges
    }`,
    { id },
  );
}

function badRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    { status: 400 },
  );
}

function notFound(error: string) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    { status: 404 },
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return badRequest("Trade ID is required");
    }

    const parsedBody = await parseJsonBody(request);

    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const { body } = parsedBody;

    const date = getString(body.date);
    const trade = getString(body.trade);

    if (!date) {
      return badRequest("Date is required");
    }

    if (!isValidDate(date)) {
      return badRequest(
        "Date must use the YYYY-MM-DD format",
      );
    }

    if (!trade) {
      return badRequest(
        "Trade or contract name is required",
      );
    }

    const existingTrade = await getExistingTrade(id);

    if (!existingTrade) {
      return notFound("Trade not found");
    }

    const hasOutcome = body.outcome !== undefined;
    const hasRiskTaken =
      body.riskTaken !== undefined;
    const hasNetPnl = body.netPnl !== undefined;
    const hasCharges = body.charges !== undefined;
    const hasNotes = body.notes !== undefined;
    const hasTags = body.tags !== undefined;

    const requestedOutcome = getNumber(body.outcome);
    const requestedRiskTaken = getNumber(
      body.riskTaken,
    );
    const requestedNetPnl = getNumber(body.netPnl);
    const requestedCharges = getNumber(body.charges);

    if (
      hasOutcome &&
      requestedOutcome === null
    ) {
      return badRequest(
        "Outcome must be a valid number",
      );
    }

    if (
      hasRiskTaken &&
      requestedRiskTaken === null
    ) {
      return badRequest(
        "Risk taken must be a valid number",
      );
    }

    if (
      hasRiskTaken &&
      requestedRiskTaken !== null &&
      requestedRiskTaken < 0
    ) {
      return badRequest(
        "Risk taken cannot be negative",
      );
    }

    if (
      hasNetPnl &&
      requestedNetPnl === null
    ) {
      return badRequest(
        "Net P&L must be a valid number",
      );
    }

    if (
      hasCharges &&
      requestedCharges === null
    ) {
      return badRequest(
        "Charges must be a valid number",
      );
    }

    if (
      hasCharges &&
      requestedCharges !== null &&
      requestedCharges < 0
    ) {
      return badRequest(
        "Charges cannot be negative",
      );
    }

    const currentOutcome =
      Number(existingTrade.outcome) || 0;

    const currentRiskTaken = Math.abs(
      Number(existingTrade.riskTaken) || 0,
    );

    const currentCharges = Math.abs(
      Number(existingTrade.charges) || 0,
    );

    const outcome = hasOutcome
      ? requestedOutcome!
      : currentOutcome;

    const riskTaken = hasRiskTaken
      ? requestedRiskTaken!
      : currentRiskTaken;

    const charges = hasCharges
      ? requestedCharges!
      : currentCharges;

    const netPnl = hasNetPnl
      ? requestedNetPnl!
      : outcome - charges;

    const updateFields: Record<string, unknown> = {
      date,
      trade,
      outcome,
      riskTaken,
      charges,
      netPnl,
    };

    if (hasNotes) {
      updateFields.notes = getString(body.notes);
    }

    if (hasTags) {
      const tagTitles = getTags(body.tags);

      const tagDocuments = await Promise.all(
        tagTitles.map((tagTitle) =>
          getOrCreateTag(tagTitle),
        ),
      );

      const tagReferences: SavedTradeTagReference[] =
        tagDocuments.map((tag) => ({
          _type: "reference",
          _ref: tag._id,
          _key: crypto.randomUUID(),
        }));

      updateFields.tags = tagReferences;
    }

    const client = getSanityWriteClient();

    await client.patch(id).set(updateFields).commit();

    const updatedTrade = await getTradeById(id);

    if (!updatedTrade) {
      return NextResponse.json(
        {
          ok: false,
          error: "Trade was updated but could not be loaded",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      trade: updatedTrade,
      message: "Trade updated successfully",
    });
  } catch (error) {
    console.error("Update trade API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to update trade",
        details:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return badRequest("Trade ID is required");
    }

    const existingTrade = await getExistingTrade(id);

    if (!existingTrade) {
      return notFound("Trade not found");
    }

    const client = getSanityWriteClient();

    await client.delete(id);

    return NextResponse.json({
      ok: true,
      id,
      message: "Trade deleted successfully",
    });
  } catch (error) {
    console.error("Delete trade API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to delete trade",
        details:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}