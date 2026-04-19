#!/usr/bin/env node
// Rotate the dev root-admin token in public/config.js.
//
// Usage:
//   node scripts/dev-root-token.mjs                  # generate a random token
//   node scripts/dev-root-token.mjs --token=foobar   # use a literal token
//   node scripts/dev-root-token.mjs --reset          # restore the baked-in
//                                                    # "dev-root-admin" default
//
// The script patches the tokenSha256 field in public/config.js and prints the
// raw token to stdout — paste it on the login screen. Reload the page after
// running so the browser picks up the new /config.js.

import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DEV_DEFAULT = "dev-root-admin";
const CONFIG_PATH = resolve(process.cwd(), "public/config.js");
const HASH_PATTERN = /tokenSha256:\s*"[a-f0-9]+"/;

const args = process.argv.slice(2);

const parseTokenArg = () => {
  const hit = args.find((a) => a.startsWith("--token="));
  return hit ? hit.slice("--token=".length) : null;
};

const wantReset = args.includes("--reset");

const token = wantReset
  ? DEV_DEFAULT
  : parseTokenArg() ?? randomBytes(24).toString("base64url");

const hash = createHash("sha256").update(token).digest("hex");

const existing = readFileSync(CONFIG_PATH, "utf8");
if (!HASH_PATTERN.test(existing)) {
  console.error(`could not find tokenSha256 field in ${CONFIG_PATH}`);
  process.exit(1);
}
const patched = existing.replace(HASH_PATTERN, `tokenSha256: "${hash}"`);
writeFileSync(CONFIG_PATH, patched);

console.log(`patched ${CONFIG_PATH}`);
console.log("");
console.log("root-admin token for this dev session:");
console.log(`  ${token}`);
console.log("");
if (wantReset) {
  console.log("this is the checked-in default — safe to commit.");
} else {
  console.log(
    "public/config.js now has a non-default hash. run with --reset before"
  );
  console.log("committing, or revert the change with `git checkout public/config.js`.");
}
console.log("");
console.log("reload the browser tab so it picks up the new /config.js.");
