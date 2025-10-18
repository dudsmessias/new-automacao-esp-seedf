import { UserWithoutPassword } from "@shared/schema";

const AUTH_KEY = "esp_auth_user";

export function saveAuthUser(user: UserWithoutPassword) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getAuthUser(): UserWithoutPassword | null {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem("esp_auth_token");
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}
