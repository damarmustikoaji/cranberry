import { RetryableLlmError } from "./types.js";

export async function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    // DNS failure, connection reset, timeout: treat as outage, let the next provider try.
    throw new RetryableLlmError(`${url} -> ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) {
    const text = await res.text();
    const msg = `${url} -> HTTP ${res.status}: ${text.slice(0, 500)}`;
    // 429 = quota/rate limit, 5xx = provider outage, 404 = bad/deprecated model name:
    // none of these say the other providers are broken too, so let the next one try.
    if (res.status === 429 || res.status === 404 || res.status >= 500) throw new RetryableLlmError(msg);
    throw new Error(msg);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // A 200 with a non-JSON body (proxy/edge quirk, wrong endpoint, etc.) is still
    // this provider's problem, not reason to give up on the others.
    throw new RetryableLlmError(`${url} -> HTTP 200 with non-JSON body: ${text.slice(0, 200)}`);
  }
}
