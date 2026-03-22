/**
 * GET /api/auth/token
 *
 * Server-side route: reads the Auth0 session from the httpOnly cookie and
 * returns the ID token so client components can pass it as Bearer token to
 * the FastAPI backend (which verifies it via Auth0 JWKS).
 *
 * Returns 200 { token: string, sub: string } or 401 { token: null }.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export async function GET(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await auth0.getSession(req, res);
    if (!session) {
      return NextResponse.json({ token: null }, { status: 401 });
    }
    const sub: string = session.user?.sub ?? "";
    let token: string | undefined;
    try {
      const access = await auth0.getAccessToken(req, res);
      token = access?.accessToken;
    } catch {
      token = undefined;
    }
    if (!token) {
      token = (session as any).idToken;
    }
    if (!token) {
      return NextResponse.json({ token: null, sub }, { status: 200 });
    }
    return NextResponse.json({ token, sub });
  } catch {
    return NextResponse.json({ token: null }, { status: 401 });
  }
}
