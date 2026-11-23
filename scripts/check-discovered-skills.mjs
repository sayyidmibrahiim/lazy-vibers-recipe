import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillsDir = fileURLToPath(new URL("../skills/", import.meta.url));
const expected = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsDir, entry.name, "SKILL.md")))
  .map((entry) => entry.name).sort();
const output = fs.readFileSync(process.argv[2], "utf8").replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
const actual = [...new Set(output.match(/\blvr-[a-z0-9]+(?:-[a-z0-9]+)*\b/g) ?? [])].sort();
const missing = expected.filter((name) => !actual.includes(name));
console.log(JSON.stringify({ expected, missing }));
process.exitCode = expected.length && !missing.length ? 0 : 1;
