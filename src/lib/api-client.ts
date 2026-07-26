/**
 * Single fetch wrapper for every query/mutation hook.
 *
 * Without it each hook re-implemented `if (!res.ok) throw new Error(await res.text())`,
 * which surfaced raw JSON in toasts. The API always answers errors as
 * `{ error: string }` (see jsonError in auth-helpers), so unwrap that here.
 */
export async function api<T>(
  url: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<T> {
  const { body, headers, ...rest } = init;

  const res = await fetch(url, {
    ...rest,
    cache: "no-store",
    headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await readError(res));

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    // Not JSON — fall through to the generic message.
  }
  if (res.status === 401) return "Phiên đăng nhập đã hết hạn";
  if (res.status === 404) return "Không tìm thấy dữ liệu";
  return "Không kết nối được máy chủ";
}
