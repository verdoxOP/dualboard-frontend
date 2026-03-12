export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export const OAUTH_GITHUB_URL = `${BACKEND_URL}/oauth2/authorization/github`;
export const OAUTH_GOOGLE_URL = `${BACKEND_URL}/oauth2/authorization/google`;

/** @deprecated Use OAUTH_GITHUB_URL instead */
export const OAUTH_LOGIN_URL = OAUTH_GITHUB_URL;

export const DEFAULT_COLOR = "#000000";
export const DEFAULT_BRUSH_SIZE = 4;
export const MIN_BRUSH_SIZE = 1;
export const MAX_BRUSH_SIZE = 50;

export const COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

