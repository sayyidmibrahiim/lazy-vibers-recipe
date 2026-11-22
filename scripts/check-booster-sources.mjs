#!/usr/bin/env node
// Verify exact GitHub revisions, license texts, and selected skill names. Reads upstream files over HTTPS.
import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";

const run = promisify(execFile);
const registry = JSON.parse(fs.readFileSync(new URL("../skills/lvr-boosters.json", import.meta.url), "utf8"));
const requests = new Map();

function getFile(booster, file) {
  const url = `https://raw.githubusercontent.com/${booster.repo}/${booster.sha}/${file.split("/").map(encodeURIComponent).join("/")}`;
  if (!requests.has(url)) requests.set(url, run("curl", [
    "--fail", "--silent", "--show-error", "--retry", "2", "--max-time", "20", url,
  ], { maxBuffer: 2 * 1024 * 1024 }).then((result) => result.stdout));
  return requests.get(url);
}

const licenseText = {
  "0BSD": /permission to use, copy, modify, and\/or distribute this software for any purpose/i,
  "Apache-2.0": /Apache License\s+Version 2\.0/i,
  "BSD-2-Clause": /redistribution and use in source and binary forms, with or without/i,
  "BSD-3-Clause": /neither the name.+nor the names of its contributors/is,
  ISC: /permission to use, copy, modify, and\/or distribute this software for any purpose/i,
  MIT: /permission is hereby granted, free of charge/i,
};

async function verify(booster) {
  const [license, ...files] = await Promise.all([
    getFile(booster, booster.license_file),
    ...booster.source_paths.map((file) => getFile(booster, file)),
  ]);
  if (!licenseText[booster.license]?.test(license)) throw new Error(`license text does not match ${booster.license}`);
  if (files.some((file) => !file.trim())) throw new Error("listed upstream file is empty");

  if (booster.install) {
    const skillNames = files.map((file) => {
      const header = file.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
      return header?.match(/^name:\s*["']?([a-z0-9_-]+)["']?\s*$/m)?.[1];
    });
    for (const name of booster.install.skills) {
      if (!skillNames.includes(name)) throw new Error(`skill frontmatter is missing the name ${name}`);
    }
  }
}

let failures = 0;
const batchSize = 4;
for (let i = 0; i < registry.boosters.length; i += batchSize) {
  const batch = registry.boosters.slice(i, i + batchSize);
  const results = await Promise.allSettled(batch.map(verify));
  for (const [index, result] of results.entries()) {
    const { id, repo, sha } = batch[index];
    if (result.status === "fulfilled") {
      console.log(`PASS ${id} (${repo}@${sha})`);
    } else {
      failures++;
      console.error(`FAIL ${id} (${repo}@${sha}): ${result.reason.message.trim()}`);
    }
  }
}
console.log(`${registry.boosters.length - failures} verified, ${failures} failed`);
process.exitCode = failures ? 1 : 0;
