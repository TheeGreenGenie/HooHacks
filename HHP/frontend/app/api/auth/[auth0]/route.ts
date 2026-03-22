import { auth0 } from "@/app/lib/auth0";

const handler = auth0.handleAuth();

export async function GET(
  req: Request,
  context: { params: Promise<{ auth0: string | string[] }> }
) {
  const params = await context.params;
  return handler(req, { params });
}
