import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth";
import { toSafeUser } from "@/models/User";

export async function GET(request: NextRequest) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;
  const response = apiSuccess("Current user retrieved", { user: toSafeUser(auth.user) });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

