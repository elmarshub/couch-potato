export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {}
  return response.statusText || "Request failed";
}

async function request<T>(
  path: string,
  init: RequestInit & { searchParams?: Record<string, string | number> } = {}
): Promise<T> {
  const { searchParams, headers, ...rest } = init;

  let url = path;
  if (searchParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      params.set(key, String(value));
    }
    url = `${path}?${params.toString()}`;
  }

  const response = await fetch(url, {
    ...rest,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const http = {
  get: <T>(path: string, searchParams?: Record<string, string | number>) =>
    request<T>(path, { method: "GET", searchParams }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: <T>(path: string, searchParams?: Record<string, string | number>) =>
    request<T>(path, { method: "DELETE", searchParams }),
};
