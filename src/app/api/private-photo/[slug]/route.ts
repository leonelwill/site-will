import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const privatePhotoDirectory = path.join(process.cwd(), "private-photos");

const allowedPhotos = {
  "william-about": "william-about.jpg",
  "william-about2": "william-about2.jpg",
} as const;

type AllowedPhotoSlug = keyof typeof allowedPhotos;

function isAllowedPhotoSlug(value: string): value is AllowedPhotoSlug {
  return value in allowedPhotos;
}

function getContentType(filename: string) {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!isAllowedPhotoSlug(slug)) {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }

  const filename = allowedPhotos[slug];
  const absolutePath = path.join(privatePhotoDirectory, filename);

  try {
    const fileBuffer = await readFile(absolutePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": getContentType(filename),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Disposition": `inline; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }
}
