import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";

// Require login on protected routes; landing page (/) is public
export default withMiddlewareAuthRequired();

export const config = {
  matcher: [
    // Exclude: root landing page, auth endpoints, Next.js internals, static assets
    "/((?!$|api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
