import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { makeWireGuardKeys, buildProfile, getEndpoint, parseHttpResponseIfComplete } from "../src/worker.mjs";

test("X25519 keys are WireGuard-sized base64 values", () => {
  const keys = makeWireGuardKeys();
  assert.equal(Buffer.from(keys.privateKey, "base64").length, 32);
  assert.equal(Buffer.from(keys.publicKey, "base64").length, 32);
});

test("profile matches wgcf layout and keepalive", () => {
  const p = buildProfile({
    privateKey: "priv=",
    v4: "172.16.0.2",
    v6: "2606:4700:110::1234",
    peerKey: "peer=",
    endpoint: "engage.cloudflareclient.com:2408",
    keepalive: 25,
  });
  assert.match(p, /Address = 172\.16\.0\.2\/32, 2606:4700:110::1234\/128/);
  assert.match(p, /PersistentKeepalive = 25/);
  assert.match(p, /MTU = 1280/);
});

test("endpoint fallback handles IPv4 and IPv6", () => {
  assert.equal(getEndpoint({ v4: "162.159.192.1:2408", ports: [2408] }), "162.159.192.1:2408");
  assert.equal(getEndpoint({ v6: "2606:4700:d0::a29f:c001", ports: [2408] }), "[2606:4700:d0::a29f:c001]:2408");
});

test("HTTP parser handles Content-Length", () => {
  const payload = '{"ok":true}';
  const raw = Buffer.from(`HTTP/1.1 200 OK\r\nContent-Length: ${Buffer.byteLength(payload)}\r\nContent-Type: application/json\r\n\r\n${payload}`);
  const result = parseHttpResponseIfComplete(raw);
  assert.equal(result.status, 200);
  assert.equal(result.body.toString(), payload);
});

test("HTTP parser handles chunked body", () => {
  const raw = Buffer.from("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nhello\r\n6\r\n world\r\n0\r\n\r\n");
  const result = parseHttpResponseIfComplete(raw);
  assert.equal(result.body.toString(), "hello world");
});
