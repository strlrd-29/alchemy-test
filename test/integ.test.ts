import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Bun";
import { expect } from "bun:test";
import * as Effect from "effect/Effect";
import * as HttpBody from "effect/unstable/http/HttpBody";
import * as HttpClient from "effect/unstable/http/HttpClient";
import Stack from "../alchemy.run.ts";

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
  providers: Cloudflare.providers(),
  state: Cloudflare.state(),
});

const stack = beforeAll(deploy(Stack));

afterAll.skipIf(!process.env.CI)(destroy(Stack));

test(
  "worker returns a url",
  Effect.gen(function* () {
    const { url } = yield* stack;

    expect(url).toBeString();
  }),
);
test(
  "PUT and GET round-trip an object",
  Effect.gen(function* () {
    const { url } = yield* stack;

    const put = yield* HttpClient.put(`${url}/hello.txt`, {
      body: HttpBody.text("Hello, World!"),
    });
    expect(put.status).toBe(201);

    const get = yield* HttpClient.get(`${url}/hello.txt`);
    expect(yield* get.text).toBe("Hello, World!");
  }),
);

test(
  "GET missing key returns 404",
  Effect.gen(function* () {
    const { url } = yield* stack;
    const response = yield* HttpClient.get(`${url}/no-such-key`);
    expect(response.status).toBe(404);
  }),
);
