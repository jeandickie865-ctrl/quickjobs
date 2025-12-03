export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://employer-worker.preview.emergentagent.com/api";

export const APP_VERSION = "1.0.0";

export const IS_DEV =
  process.env.NODE_ENV === "development" ||
  process.env.EXPO_PUBLIC_ENV === "development";

export const CONFIG = {
  apiUrl: API_URL,
  version: APP_VERSION,
  dev: IS_DEV,
};
