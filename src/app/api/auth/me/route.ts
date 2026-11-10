import { connection } from "next/server";
import { getMeController } from "@/controllers/AuthController";

export async function GET() {
  await connection();

  return getMeController();
}