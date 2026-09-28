// app/api/savetrade/tags/route.ts

import { NextResponse } from "next/server";
import { getSanityClient } from "@/src/lib/sanity.client";
import { TAG_SUGGESTIONS_QUERY } from "@/src/lib/sanity.queries";

type TagItem = {
  _id: string;
  value: string;
  groupName: string;
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
  return value
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeGroupName(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "custom";
  }

  return value.trim();
}

function normalizeTagValue(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "";
  }

  return value.trim();
}

function normalizeTags(
  tags: unknown,
): TagItem[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const validTags = tags
    .filter((tag): tag is Record<string, unknown> => {
      return Boolean(
        tag &&
          typeof tag === "object" &&
          typeof tag._id === "string",
      );
    })
    .map((tag) => ({
      _id: tag._id as string,
      value: normalizeTagValue(tag.value),
      groupName: normalizeGroupName(tag.groupName),
    }))
    .filter((tag) => tag.value.length > 0);

  const uniqueTags = new Map<string, TagItem>();

  for (const tag of validTags) {
    const uniqueKey = `${tag.groupName}:${tag.value.toLowerCase()}`;

    if (!uniqueTags.has(uniqueKey)) {
      uniqueTags.set(uniqueKey, tag);
    }
  }

  return Array.from(uniqueTags.values()).sort(
    (first, second) => {
      const groupComparison =
        first.groupName.localeCompare(
          second.groupName,
        );

      if (groupComparison !== 0) {
        return groupComparison;
      }

      return first.value.localeCompare(
        second.value,
      );
    },
  );
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
          `*[_type == "tag"] | order(groupName asc, value asc) {
            _id,
            value,
            groupName
          }`,
        );

    return NextResponse.json({
      ok: true,
      tags: normalizeTags(tags),
    });
  } catch (error) {
    console.error(
      "Get trade tags API error:",
      error,
    );

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