import { importPackagesController } from "@/controllers/ImportController";
import { authorizeApiRequest } from "@/lib/api-auth";

export async function POST(request: Request) {
  const authorization = await authorizeApiRequest(["SELLER"]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  return importPackagesController(request, authorization.user.id);
}
