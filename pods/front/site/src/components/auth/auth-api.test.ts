import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { AuthApi } from "./auth-api";

const originalFetch = globalThis.fetch;
const api = new AuthApi({ accountsUrl: "http://localhost/_accounts", disableSignup: false, hideLocalLogin: false, useOtp: true }, "pt-BR");

afterEach(() => { globalThis.fetch = originalFetch; });

test("cookie rejects absent tokens without sending requests", async () => {
  let requests = 0;
  globalThis.fetch = (async () => {
    requests++;
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  for (const token of [undefined, null, "", "undefined", "null"]) {
    await assert.rejects(api.setCookie(token as string));
  }
  assert.equal(requests, 0);
});

test("cookie sends supplied session token", async () => {
  globalThis.fetch = (async (url, options) => {
    assert.equal(url, "http://localhost/_accounts/cookie");
    assert.equal(options?.method, "PUT");
    assert.equal(options?.credentials, "include");
    assert.deepEqual(options?.headers, { Authorization: "Bearer session-token" });
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  await api.setCookie("session-token");
});

test("invite signup and login preserve responses awaiting confirmation", async () => {
  globalThis.fetch = (async () => Response.json({ result: { account: "account-id" } })) as typeof fetch;
  const results = [
    await api.signUpJoin("person@example.com", "password", "First", "Last", "invite", "workspace"),
    await api.join("person@example.com", "password", "invite", "workspace"),
  ];
  for (const result of results) {
    assert.equal(result.token, undefined);
    assert.equal(result.account, "account-id");
  }
});
