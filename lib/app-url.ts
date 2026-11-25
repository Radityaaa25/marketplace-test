import "server-only";

export function getAppUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (request) {
    const origin = new URL(request.url).origin;
    return origin.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}
