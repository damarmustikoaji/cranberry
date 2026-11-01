import { describe, expect, it } from "vitest";
import { assertPathAllowed, normalizeRelPath, validateWrites } from "../src/tools/fs-guard.js";

describe("assertPathAllowed", () => {
  it("menolak folder terkunci", () => {
    expect(() => assertPathAllowed("data/who/bb-u.json")).toThrow();
    expect(() => assertPathAllowed(".github/workflows/ci.yml")).toThrow();
    expect(() => assertPathAllowed("content/medis/panduan.md")).toThrow();
    expect(() => assertPathAllowed("tests/reference/who.reference.test.ts")).toThrow();
  });

  it("menolak jalan keluar repo", () => {
    expect(() => assertPathAllowed("../../etc/passwd")).toThrow();
    expect(() => assertPathAllowed("/etc/passwd")).toThrow();
  });

  it("mengizinkan folder biasa", () => {
    expect(() => assertPathAllowed("components/growth-form.tsx")).not.toThrow();
    expect(() => assertPathAllowed("lib/clipboard.ts")).not.toThrow();
  });
});

describe("normalizeRelPath", () => {
  it("membersihkan prefix ./", () => {
    expect(normalizeRelPath("./lib/foo.ts")).toBe("lib/foo.ts");
  });
});

describe("validateWrites", () => {
  it("menolak jika tidak ada file", () => {
    expect(() => validateWrites([], new Map())).toThrow();
  });

  it("menolak jika terlalu banyak file", () => {
    const files = Array.from({ length: 11 }, (_, i) => ({ path: `lib/f${i}.ts`, content: "x" }));
    expect(() => validateWrites(files, new Map())).toThrow(/maksimal 10/);
  });

  it("menolak jika ada file di folder terkunci", () => {
    expect(() => validateWrites([{ path: "data/who/bb-u.json", content: "{}" }], new Map())).toThrow();
  });

  it("mengizinkan perubahan kecil pada folder biasa", () => {
    expect(() => validateWrites([{ path: "lib/clipboard.ts", content: "export {};" }], new Map())).not.toThrow();
  });
});
