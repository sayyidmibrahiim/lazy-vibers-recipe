// check.mjs: tiny assertion helper for run.sh.  node check.mjs <name> <json-file> <js-expression over `o`>
// Prints "PASS name" or "FAIL name: ..." and exits 1 on failure.
import fs from "node:fs";
const [name, file, expr] = process.argv.slice(2);
let o;
try { o = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.log(`FAIL ${name}: output is not JSON (${e.message})`); process.exit(1); }
let ok = false, detail = "";
try { ok = !!new Function("o", `return (${expr});`)(o); } catch (e) { detail = e.message; }
console.log(ok ? `PASS ${name}` : `FAIL ${name}: ${detail || JSON.stringify(o).slice(0, 600)}`);
process.exit(ok ? 0 : 1);
