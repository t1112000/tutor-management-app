import { describe, expect, it } from "vitest";
import { buildSignInUrl, publicOrigin, safeCallbackPath } from "./public-url";

const h = (o: Record<string, string>) => new Headers(o);

describe("publicOrigin", () => {
  it("prefers x-forwarded-host/proto", () => {
    expect(publicOrigin(h({ "x-forwarded-host": "tutor.neyut.com", "x-forwarded-proto": "https" }), "https://0.0.0.0:3000/")).toBe(
      "https://tutor.neyut.com"
    );
  });
  it("falls back to Host header and https", () => {
    expect(publicOrigin(h({ host: "tutor.neyut.dev" }), "https://0.0.0.0:3000/")).toBe("https://tutor.neyut.dev");
  });
  it("uses http for localhost", () => {
    expect(publicOrigin(h({ host: "localhost:3000" }), "http://localhost:3000/")).toBe("http://localhost:3000");
  });
  it("uses the first value of comma lists", () => {
    expect(publicOrigin(h({ "x-forwarded-host": "a.com, b.com", "x-forwarded-proto": "https,http" }), "http://x/")).toBe(
      "https://a.com"
    );
  });
});

describe("safeCallbackPath", () => {
  it("accepts relative paths", () => expect(safeCallbackPath("/report?month=2026-07")).toBe("/report?month=2026-07"));
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeCallbackPath("https://evil.com")).toBe("/");
    expect(safeCallbackPath("//evil.com")).toBe("/");
    expect(safeCallbackPath("/\\evil.com")).toBe("/");
    expect(safeCallbackPath(null)).toBe("/");
  });
});

describe("buildSignInUrl", () => {
  it("never leaks the internal 0.0.0.0 host", () => {
    const url = buildSignInUrl("https://0.0.0.0:3000/report?month=2026-07", h({ "x-forwarded-host": "tutor.neyut.com", "x-forwarded-proto": "https" }));
    expect(url.toString()).toBe("https://tutor.neyut.com/signin?callbackUrl=%2Freport%3Fmonth%3D2026-07");
  });
  it("omits callbackUrl for the root path", () => {
    expect(buildSignInUrl("https://0.0.0.0:3000/", h({ host: "tutor.neyut.dev" })).toString()).toBe("https://tutor.neyut.dev/signin");
  });
});
