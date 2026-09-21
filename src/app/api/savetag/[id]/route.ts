import { NextResponse } from "next/server";
import {
  getSanityClient,
  getSanityWriteClient,
} from "@/src/lib/sanity.client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateTagRequestBody = {
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

function jsonResponse<T>(
  body: T,
  status = 200,
) {
  const response = NextResponse.json(body, {
    status,
  });

  response.headers.set(
    "Cache-Control",
    "no-store, max-age=0",
  );

  return response;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function badRequest(error: string) {
  return jsonResponse(
    {
      ok: false,
      error,
    },
    400,
  );
}

function notFound(error: string) {
  return jsonResponse(
    {
      ok: false,
      error,
    },
    404,
  );
}

async function parseJsonBody(
  request: Request,
): Promise<UpdateTagRequestBody> {
  try {
    const body = (await request.json()) as UpdateTagRequestBody;

    if (!body || typeof body !== "object") {
      throw new Error();
    }

    return body;
  } catch {
    throw new Error(
      "Request body must contain valid JSON",
    );
  }
}

async function getTagById(
  id: string,
): Promise<TagItem | null> {
  const client = getSanityClient();

  return client.fetch<TagItem | null>(
    `*[_type == "tag" && _id == $id][0]{
      _id,
      _type,
      title,
      value
    }`,
    { id },
  );
}

async function getTagReferenceCount(
  id: string,
): Promise<number> {
  const client = getSanityClient();

  return client.fetch<number>(
    `count(*[
      _type == "savedTrade" &&
      references($id)
    ])`,
    { id },
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return badRequest("Tag ID is required");
    }

    const body = await parseJsonBody(request);

    const title = getString(body.title);
    const submittedValue = getString(body.value);
    const value = createTagValue(
      submittedValue || title,
    );

    if (!title) {
      return badRequest("Tag title is required");
    }

    if (!value) {
      return badRequest("Tag value is invalid");
    }

    const existingTag = await getTagById(id);

    if (!existingTag) {
      return notFound("Tag not found");
    }

    const client = getSanityWriteClient();

    const duplicateTag = await client.fetch<TagItem | null>(
      `*[
        _type == "tag" &&
        value == $value &&
        _id != $id
      ][0]{
        _id,
        _type,
        title,
        value
      }`,
      {
        id,
        value,
      },
    );

    if (duplicateTag) {
      return jsonResponse(
        {
          ok: false,
          error: "Another tag with this value already exists",
          tag: duplicateTag,
        },
        409,
      );
    }

    await client
      .patch(id)
      .set({
        title,
        value,
      })
      .commit();

    const updatedTag = await getTagById(id);

    if (!updatedTag) {
      return jsonResponse(
        {
          ok: false,
          error: "Tag was updated but could not be loaded",
        },
        500,
      );
    }

    return jsonResponse({
      ok: true,
      tag: updatedTag,
      message: "Tag updated successfully",
    });
  } catch (error) {
    console.error("Update tag API error:", error);

    return jsonResponse(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : "Failed to update tag",
      },
      500,
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
      return badRequest("Tag ID is required");
    }

    const existingTag = await getTagById(id);

    if (!existingTag) {
      return notFound("Tag not found");
    }

    const referenceCount =
      await getTagReferenceCount(id);

    if (referenceCount > 0) {
      return jsonResponse(
        {
          ok: false,
          error: `This tag is used by ${referenceCount} saved trade(s). Remove it from those trades before deleting the tag.`,
          referenceCount,
        },
        409,
      );
    }

    const client = getSanityWriteClient();

    await client.delete(id);

    return jsonResponse({
      ok: true,
      id,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Delete tag API error:", error);

    return jsonResponse(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(error)
            : "Failed to delete tag",
      },
      500,
    );
  }
}