import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$connect();

    const marketplaces = await prisma.marketplace.findMany();

    return NextResponse.json({
      success: true,
      message: "Database Sortify berhasil terhubung!",
      data: marketplaces,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Database gagal terhubung.",
      },
      { status: 500 }
    );
  }
}