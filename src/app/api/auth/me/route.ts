import { getMeController } from "@/controllers/AuthController";

export async function GET() {
  return getMeController();
}