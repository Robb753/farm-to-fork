import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { sanitizeHTML } from "../sanitize";

describe("HTML sanitization and CommonJS runtime compatibility", () => {
  it("loads without Node require(ESM) support", () => {
    expect(execFileSync(process.execPath, [
      "--no-experimental-require-module", "-e",
      "const purify = require('isomorphic-dompurify'); process.stdout.write(purify.sanitize('<b>safe</b>'));",
    ], { encoding: "utf8" })).toBe("<b>safe</b>");
  });

  it("preserves the existing formatting allowlist", () => {
    const html = "<p><b>B</b><i>I</i><em>E</em><strong>S</strong><br></p>";
    expect(sanitizeHTML(html)).toBe(html);
  });

  it.each([
    ['<p onclick="alert(1)">safe<script>alert(1)</script></p>', '<p>safe</p>'],
    ['<img src=x onerror=alert(1)><strong style="color:red">safe</strong>', '<strong>safe</strong>'],
    ['<a href="javascript:alert(1)">safe</a><iframe srcdoc="evil"></iframe>', 'safe'],
    ['<svg onload="alert(1)"><script>alert(1)</script></svg><p>safe</p>', '<p>safe</p>'],
  ])("removes unsafe markup: %s", (input, expected) => {
    expect(sanitizeHTML(input)).toBe(expected);
  });
});
