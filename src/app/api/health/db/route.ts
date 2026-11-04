
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<
      { waktu_database: Date }[]
    >`SELECT NOW() AS waktu_database`;

    return NextResponse.json({
      status: "success",
      message: "Koneksi database Sortify berhasil.",
      database: "connected",
      time: result[0]?.waktu_database,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Koneksi database gagal.",
        database: "disconnected",
      },
      { status: 500 }
    );
  }
}