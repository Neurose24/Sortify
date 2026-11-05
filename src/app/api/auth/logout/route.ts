import { logoutController } from "@/controllers/AuthController";

export async function POST() {
  return logoutController();
}