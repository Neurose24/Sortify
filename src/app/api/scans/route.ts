import { scanBarcodeController } from "@/controllers/ScanController";
import { authorizeApiRequest } from "@/lib/api-auth";

export async function POST(request: Request) {
  const authorization = await authorizeApiRequest(["PETUGAS"]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  return scanBarcodeController(request, authorization.user.id);
}
