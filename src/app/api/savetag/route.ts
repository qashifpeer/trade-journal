import { NextResponse } from "next/server";
import {
  getSanityClient,
  getSanityWriteClient,
} from "@/src/lib/sanity.client";

type CreateTagRequestBody = {
  title?: unknown;
  value?: unknown;
};

type TagItem = {
  _id: string;
  _type: "tag";
  title: string;
  value: string;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createTagValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function noStoreResponse<T>(
  body: T,
  init?: ResponseInit,
) {
  const response = NextResponse.json(body, init);

  response.headers.set(
    "Cache-Control",
    "no-store, max-age=0",
  );

  return response;
}

async function readJsonBody(
  request: Request,
): Promise<CreateTagRequestBody> {
  try {
    const body = (await request.json()) as CreateTagRequestBody;

    if (!body || typeof body !== "object") {
      throw new Error("Request body must be an object");
    }

    return body;
  } catch {
    throw new Error("Request body must contain valid JSON");
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = getString(searchParams.get("q"));

    const client = getSanityClient();

    const tags = query
      ? await client.fetch<TagItem[]>(
          `*[
            _type == "tag" &&
            (
              title match $pattern ||
              value match $pattern
            )
          ]
          | order(title asc) {
            _id,
            _type,
            title,
            value
          }`,
          {
            pattern: `${query.toLowerCase()}*`,
          },
          {
            cache: "no-store",
          },
        )
      : await client.fetch<TagItem[]>(
          `*[_type == "tag"]
          | order(title asc) {
            _id,
            _type,
            title,
            value
          }`,
          {},
          {
            cache: "no-store",
          },
        );

    return noStoreResponse({
      ok: true,
      tags: Array.isArray(tags) ? tags : [],
    });
  } catch (error) {
    console.error("Get tags API error:", error);

    return noStoreResponse(
      {
        ok: false,
        tags: [],
        error: "Failed to load tags",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);

    const title = getString(body.title);
    const submittedValue = getString(body.value);
    const value = createTagValue(
      submittedValue || title,
    );

    if (!title) {
      return noStoreResponse(
        {
          ok: false,
          error: "Tag title is required",
        },
        { status: 400 },
      );
    }

    if (!value) {
      return noStoreResponse(
        {
          ok: false,
          error: "A valid tag value could not be generated",
        },
        { status: 400 },
      );
    }

    const client = getSanityWriteClient();

    const existingTag = await client.fetch<TagItem | null>(
      `*[_type == "tag" && value == $value][0]{
        _id,
        _type,
        title,
        value
      }`,
      { value },
      {
        cache: "no-store",
      },
    );

    if (existingTag) {
      return noStoreResponse(
        {
          ok: false,
          error: "A tag with this value already exists",
          tag: existingTag,
        },
        { status: 409 },
      );
    }

    const createdTag = await client.create({
      _type: "tag",
      title,
      value,
    });

    const tag: TagItem = {
      _id: createdTag._id,
      _type: "tag",
      title,
      value,
    };

    return noStoreResponse(
      {
        ok: true,
        tag,
        message: "Tag created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create tag API error:", error);

    return noStoreResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create tag",
      },
      { status: 500 },
    );
  }
}