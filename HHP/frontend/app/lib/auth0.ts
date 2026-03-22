/**
 * Shared Auth0 server-side client singleton.
 * Import only from server-side code (API routes, server components).
 */
import { initAuth0 } from "@auth0/nextjs-auth0";

export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET!,
  baseURL: process.env.AUTH0_BASE_URL ?? "http://localhost:3000",
  issuerBaseURL:
    process.env.AUTH0_ISSUER_BASE_URL ??
    "https://dev-lj4xn6l3x8k1tvak.us.auth0.com",
  clientID:
    process.env.AUTH0_CLIENT_ID ?? "T2vlY1wWdw6NQZ6U1PkNXYkdEmxEOY7V",
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  authorizationParams: {
    scope: "openid profile email",
    audience: process.env.AUTH0_AUDIENCE ?? undefined,
  },
});
