// src/app/api/sanity/trade/[id]/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";

export const dynamic = "force-dynamic";

export async function DELETE(
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

    await client.delete(id);

    return NextResponse.json(
      { success: true, deletedId: id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sanity delete trade error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete trade",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}