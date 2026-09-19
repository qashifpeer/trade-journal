// app/api/savetrade/tags/route.ts

import { NextResponse } from "next/server";
import { getSanityClient } from "@/src/lib/sanity.client";
import { TAG_SUGGESTIONS_QUERY } from "@/src/lib/sanity.queries";

type TagItem = {
  _id: string;
  title: string;
  value: string;
};

type TagsResponse = {
  ok: boolean;
  tags: TagItem[];
  error?: string;
};

function getSearchQuery(request: Request) {
  const { searchParams } = new URL(request.url);

  return searchParams.get("q")?.trim() ?? "";
}

function normalizeTagQuery(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ");
}

export async function GET(
  request: Request,
): Promise<NextResponse<TagsResponse>> {
  try {
    const rawQuery = getSearchQuery(request);
    const query = normalizeTagQuery(rawQuery);

    const client = getSanityClient();

    const tags = query
      ? await client.fetch<TagItem[]>(
          TAG_SUGGESTIONS_QUERY,
          {
            pattern: `${query}*`,
          },
        )
      : await client.fetch<TagItem[]>(
          `*[_type == "tag"] | order(title asc) {
            _id,
            title,
            value
          }`,
        );

    const uniqueTags = Array.from(
      new Map(
        (Array.isArray(tags) ? tags : []).map((tag) => [
          tag.value,
          tag,
        ]),
      ).values(),
    );

    return NextResponse.json({
      ok: true,
      tags: uniqueTags,
    });
  } catch (error) {
    console.error("Get trade tags API error:", error);

    return NextResponse.json(
      {
        ok: false,
        tags: [],
        error: "Failed to load tags",
      },
      { status: 500 },
    );
  }
}