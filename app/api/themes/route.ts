import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { Role } from "@prisma/client";
import cloudinary from "@/lib/cloudinary";

const checkAuth = async () => {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
    return null;
  }
  return session;
};

const extractPublicId = (url: string) => {
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export async function GET() {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { questions: true } }
      }
    });
    return NextResponse.json(themes);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error fetching themes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, description, image } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  try {
    const theme = await prisma.theme.create({
      data: { name, description: description || null, image: image || null }
    });
    return NextResponse.json(theme);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error creating theme" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, name, description, image } = body;
  if (!id || !name) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  try {
    const oldTheme = await prisma.theme.findUnique({ where: { id } });

    if (oldTheme?.image && image && oldTheme.image !== image) {
      const publicId = extractPublicId(oldTheme.image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Error deleting old theme image from Cloudinary:", err);
        }
      }
    }

    const theme = await prisma.theme.update({
      where: { id },
      data: { name, description: description || null, image: image ?? oldTheme?.image ?? null }
    });
    return NextResponse.json(theme);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error updating theme" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    const theme = await prisma.theme.findUnique({
      where: { id },
      include: { questions: { select: { id: true, image: true } } }
    });

    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    for (const question of theme.questions) {
      if (question.image) {
        const publicId = extractPublicId(question.image);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Error deleting question image from Cloudinary:", err);
          }
        }
      }
    }

    if (theme.image) {
      const publicId = extractPublicId(theme.image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Error deleting theme image from Cloudinary:", err);
        }
      }
    }

    await prisma.theme.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error deleting theme" }, { status: 500 });
  }
}
