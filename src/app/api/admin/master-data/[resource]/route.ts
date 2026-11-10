import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { handleMasterDataError } from "@/lib/admin-master-data-response";
import { parseMasterDataResource, saveMasterData } from "@/services/admin-master-data.service";

type RouteContext = { params: Promise<{ resource: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authorization = await authorizeApiRequest(["ADMIN"]);
  if (!authorization.authorized) return authorization.response;

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format JSON tidak valid." },
      { status: 400 },
    );
  }

  try {
    const { resource: resourceParam } = await context.params;
    const resource = parseMasterDataResource(resourceParam);
    await saveMasterData({
      resource,
      input,
      currentUserId: authorization.user.id,
    });
    return NextResponse.json(
      { success: true, message: "Data berhasil ditambahkan." },
      { status: 201 },
    );
  } catch (error) {
    return handleMasterDataError(error);
  }
}
