import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/src/lib/sanity.client";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: "Only image uploads are allowed" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Uploaded image is empty" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const client = getSanityWriteClient();

    const asset = await client.assets.upload("image", buffer, {
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json({
      ok: true,
      assetId: asset._id,
      url: asset.url,
      originalFilename: file.name,
    });
  } catch (error) {
    console.error("upload-image error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 }
    );
  }
}