import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";

type DeleteTradeRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: DeleteTradeRouteContext,
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Trade ID is required",
        },
        { status: 400 },
      );
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
      },
      { status: 500 },
    );
  }
}