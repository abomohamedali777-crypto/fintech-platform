import { describe, it, expect } from "vitest";
import { authorizeBearer } from "./auth";

describe("authorizeBearer", () => {
  it("accepts when no token is configured (disabled)", () => {
    expect(authorizeBearer(null, null)).toBe(true);
    expect(authorizeBearer("Bearer any", null)).toBe(true);
  });

  it("rejects missing or malformed headers when configured", () => {
    expect(authorizeBearer(null, "s3cret")).toBe(false);
    expect(authorizeBearer("", "s3cret")).toBe(false);
    expect(authorizeBearer("Basic dXNlcjpwYXNz", "s3cret")).toBe(false);
    expect(authorizeBearer("Bearer", "s3cret")).toBe(false);
  });

  it("accepts the correct bearer token", () => {
    expect(authorizeBearer("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects a wrong token (constant-time shape)", () => {
    expect(authorizeBearer("Bearer wrong", "s3cret")).toBe(false);
  });
});