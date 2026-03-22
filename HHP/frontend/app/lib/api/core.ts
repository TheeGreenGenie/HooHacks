export const apiCore = {
  url: process.env.NEXT_PUBLIC_API_URL,
  headers(token: string) {
    const h: Record<string, string> = {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  },
};
