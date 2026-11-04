
import { NextResponse } from "next/server";

export function successResponse<T>(
  data: T,
  message: string = "Permintaan berhasil."
) {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(
  message: string,
  status: number = 500
) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status }
  );
}