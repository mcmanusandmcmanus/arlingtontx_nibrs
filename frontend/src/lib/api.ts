import { API_BASE_URL } from "./config";

type FetchOptions = RequestInit & { token?: string | null };

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options;
  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(headers ?? {}),
  };
  if (body instanceof FormData) {
    delete (mergedHeaders as Record<string, string>)["Content-Type"];
  }
  if (token) {
    mergedHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: mergedHeaders,
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || res.statusText);
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return (isJson ? res.json() : (res.text() as unknown)) as Promise<T>;
}

export async function login(username: string, password: string) {
  return apiFetch<{ access: string; refresh: string }>("/api/auth/token/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchProfile(token: string) {
  return apiFetch("/api/accounts/profile/", { token });
}

export async function fetchDistricts() {
  return apiFetch("/api/accounts/districts/");
}

export async function requestAccess(payload: Record<string, unknown>) {
  return apiFetch("/api/accounts/requests/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchSnapshot(slug: string, token: string) {
  return apiFetch(`/api/analytics/districts/${slug}/snapshot/`, { token });
}

export async function fetchModelResults(slug: string, token: string) {
  return apiFetch(`/api/analytics/districts/${slug}/models/`, { token });
}

export async function triggerRefresh(token: string) {
  return apiFetch("/api/uploads/refresh/", {
    method: "POST",
    token,
  });
}

export async function fetchRefreshStatus(token: string) {
  return apiFetch("/api/uploads/refresh/", { token });
}

export async function listUploads(token: string) {
  return apiFetch("/api/uploads/", { token });
}

export async function uploadDataAsset(
  token: string,
  data: FormData | Record<string, unknown>,
) {
  if (data instanceof FormData) {
    return apiFetch("/api/uploads/", {
      method: "POST",
      body: data,
      token,
      headers: {},
    });
  }
  return apiFetch("/api/uploads/", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function fetchDistrictGeo() {
  return apiFetch("/api/geo/districts/");
}

export async function fetchBeatGeo() {
  return apiFetch("/api/geo/beats/");
}
