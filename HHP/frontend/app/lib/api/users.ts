import { apiCore } from "./core";

const BASE = `${apiCore.url}/api/v1/users`;

export interface UserProfile {
  auth0_sub?: string;
  full_name?: string;
  age?: number;
  phone_number?: string;
  display_name?: string;
  income_bracket?: string;
  spending_habits?: string[];
  savings_goal?: number;
  risk_tolerance?: string;
  manual_income?: number;
}

export async function fetchMyProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${BASE}/me/profile`, {
    headers: apiCore.headers(token),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateMyProfile(
  token: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const res = await fetch(`${BASE}/me/profile`, {
    method: "PATCH",
    headers: apiCore.headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
