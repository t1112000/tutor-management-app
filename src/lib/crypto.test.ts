import { describe, expect, it, beforeAll } from "vitest";

beforeAll(() => {
  // Fixed 32-byte (64 hex char) test key — encrypt/decrypt read process.env fresh
  // on every call, so setting it here (before any import runs) is sufficient.
  process.env.CREDENTIALS_ENCRYPTION_KEY = "0".repeat(64);
});

describe("encrypt/decrypt", () => {
  it("round-trips a plain string", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const plain = "Sup3rSecret!123";
    const stored = encrypt(plain);
    expect(decrypt(stored)).toBe(plain);
  });

  it("produces a different ciphertext each call (random IV)", async () => {
    const { encrypt } = await import("./crypto");
    expect(encrypt("same input")).not.toBe(encrypt("same input"));
  });

  it("round-trips strings containing unicode", async () => {
    const { encrypt, decrypt } = await import("./crypto");
    const plain = "mật khẩu có dấu 🔒";
    expect(decrypt(encrypt(plain))).toBe(plain);
  });
});
