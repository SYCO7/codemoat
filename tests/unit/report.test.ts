import { test } from "node:test";
import assert from "node:assert/strict";
import { reportScan } from "../../src/core/report.js";
import type { ScanResult } from "../../src/core/types.js";

const emptyResult: ScanResult = { findings: [], filesScanned: 0, durationMs: 0 };

test("reportScan POSTs the expected body and headers", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl: string | undefined;
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  try {
    await reportScan(emptyResult, {
      apiKey: "cm_live_test",
      apiUrl: "https://example.test",
      repoFullName: "octocat/hello-world",
      commitSha: "deadbeef",
      branch: "main",
      prNumber: 42,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(capturedUrl, "https://example.test/api/report");
  assert.equal(capturedInit?.method, "POST");
  const headers = capturedInit?.headers as Record<string, string>;
  assert.equal(headers["authorization"], "Bearer cm_live_test");
  const body = JSON.parse(capturedInit?.body as string);
  assert.deepEqual(body, {
    repo: "octocat/hello-world",
    commitSha: "deadbeef",
    branch: "main",
    prNumber: 42,
    result: emptyResult,
  });
});

test("reportScan never throws when fetch fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;

  try {
    await assert.doesNotReject(() =>
      reportScan(emptyResult, { apiKey: "cm_live_test", repoFullName: "a/b", commitSha: "abc" })
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reportScan never throws on a non-2xx response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(null, { status: 500 })) as typeof fetch;

  try {
    await assert.doesNotReject(() =>
      reportScan(emptyResult, { apiKey: "cm_live_test", repoFullName: "a/b", commitSha: "abc" })
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
