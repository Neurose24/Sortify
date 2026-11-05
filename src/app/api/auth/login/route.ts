import { loginController } from "@/controllers/AuthController";

export async function POST(request: Request) {
  return loginController(request);
}