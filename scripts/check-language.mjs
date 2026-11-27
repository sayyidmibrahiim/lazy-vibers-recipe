import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";

// Indicators for authored Indonesian prose and short UI labels. Shared terms
// such as "data" and "status" are intentionally omitted.
const indonesianWords = [
  "agar akan anda apa apakah atau bagaimana bagi bagian balas bandingkan bekerja beranda",
  "berbahasa berdasarkan berhenti berikut berisi berkas berlaku berlangsung bersama bertanya",
  "bila bisa buka bukan cantumkan catat catatan contoh cukup dalam dapat dari dengan detik",
  "diberi dibuka dicatat digunakan dihasilkan dikerjakan dilewati diminta dinonaktifkan",
  "dipakai ditemukan diterapkan dokumen dulu gagal galat gunakan hanya hapus harus hasilnya",
  "hingga ikut ingin isi itu jadi jangan jawab jawaban jika judul jumlah kamu kata keadaan",
  "keluar kembali kenapa ketika kini klik kondisi kumpulan kurang lainnya lanjutkan lengkap lihat",
  "lokasi masih masuk masukkan melalui membalas membuka memilih meminta menambah menemukan",
  "menggunakan menghapus mengubah menulis menunggu meskipun minta mudah mulai pakai paling",
  "panduan pastikan pengguna penjelasan penyebab percobaan periksa perlu perubahan pilih",
  "pilihan proyek pulihkan rahasia rekomendasi ringkas ringkasan rumah saat salah saling sampai",
  "saran sebagai",
  "sebelum sebelumnya sedang sekali selain selalu selesai seluruh sementara semua seperti",
  "serta sesi setelah setiap siap simpan sudah supaya tambah tampilkan tanpa tekan teks temuan",
  "terakhir terapkan terputus tersebut tersedia tertunda tetap thn tidak tinjau tombol tulis",
  "ulang untuk wajib waktu yang",
].join(" ").split(" ");
const indonesian = new RegExp(`\\b(?:${indonesianWords.join("|")})\\b`, "iu");
const locale = /\b(?:id[-_]ID|lang\s*=\s*(?:\{\s*)?["']id["'])/iu;
const activelyLocalizedArtifact = [
  /\b(?:web (?:app|UI|viewer)|dashboard|viewer)\b[^.;!?]*\b(?:renders?|translates?)\b[^.;!?]*\b(?:in|to|into) (?:the )?(?:user(?:['’]s)? language|language of the (?:user|idea))\b/iu,
  /\b(?:write|generate|produce|revise|save|store|render)\b[^.;!?]*\b(?:bundle|document|artifact|blueprint|report)s?\b[^.;!?]*\b(?:in|to|into) (?:the )?(?:user(?:['’]s)? language|same language as the (?:user|idea)|language of the (?:user|idea))\b/iu,
  /\b(?:document|artifact|bundle|generated prose|output)\s+language\b[^.;!?]*\b(?:matches?|follows?|depends on)\s+(?:the )?(?:user|idea)\b/iu,
];

const image = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/iu;
const decoder = new TextDecoder("utf-8", { fatal: true });
const helper = /^(?:scripts|skills\/lvr-[^/]+\/scripts)\/lvr\.mjs$/u;
const localizedMemoryTerms = /^\s*\["pengetahuan model", \/pengetahuan model\/gi\],/u;
const originalInput = /^\s*"idea_raw"\s*:/u;
const dashboardTabs = "src/app/p/[id]/lvr-client.tsx";
const internalTabKey = /(?<=\[|useState<Tab>\(|tab === )"(?:ringkasan|sesi|peta)"(?=,|\)| &&)/gu;

function categoryFor(file) {
  if (file === "examples/futsal-booking/README.md" || file === "examples/trials-2026-11/README.md") return "active";
  if (file.startsWith(".scratch/") || file.startsWith("examples/futsal-booking/") || file.startsWith("examples/trials-2026-11/")) return "archive";
  if (file.startsWith("tests/")) return "fixture";
  if (file === "scripts/check-language.mjs") return "dictionary";
  if (/\/\.lv[pr]\/(?:journal\.ndjson|review\/LEDGER\.jsonl)$/u.test(file)) return "raw record";
  return "active";
}

function withoutReferences(line) {
  return line
    .replace(/https?:\/\/[^\s)<>"]+/giu, " ")
    .replace(/\b[\w./-]+\.(?:md|mjs|tsx?|jsonl?|ndjson|txt|png|svg|yml)\b/gu, " ")
    .replace(/<!-- language-audit: verbatim -->/gu, "");
}

function languageFinding(line, file) {
  if (file.startsWith("src/") && locale.test(line)) return ["non-English interface locale", "active"];

  const prose = withoutReferences(line);
  if (!/\b(?:never|do not|should not|no longer)\b/iu.test(prose)
    && activelyLocalizedArtifact.some((rule) => rule.test(prose))) {
    return ["localized artifact instruction"];
  }

  if (!indonesian.test(prose)) return null;
  if (helper.test(file) && localizedMemoryTerms.test(line)) {
    return ["Indonesian research-memory indicators", "dictionary"];
  }
  if (/\/\.lv[pr]\/state\.json$/u.test(file) && originalInput.test(line)) {
    return ["original project idea", "raw record"];
  }
  if (file === dashboardTabs && !indonesian.test(prose.replace(internalTabKey, " "))) {
    return ["legacy tab identifier", "identifier"];
  }
  if (line.includes("<!-- language-audit: verbatim -->")) {
    // The marker applies to source strings in quotes or code spans only.
    const surrounding = prose.replace(/`[^`]+`|"[^"]+"|“[^”]+”/gu, " ");
    if (!indonesian.test(surrounding)) return ["Indonesian source text", "verbatim"];
  }
  return ["possible Indonesian text"];
}

function scanFile(root, file, category) {
  const target = path.join(root, file);
  let data;
  try {
    if (!lstatSync(target).isFile()) return [];
    data = readFileSync(target);
  } catch (error) {
    // A working-tree deletion can still be listed by the Git index.
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const matches = image.test(file) ? [{ line: 1, reason: "inspect image text", category: "visual" }] : [];
  if (data.includes(0)) return matches;
  let text;
  try {
    text = decoder.decode(data);
  } catch {
    return matches;
  }

  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    const match = languageFinding(line, file);
    if (match) matches.push({ line: index + 1, reason: match[0], category: match[1] ?? category });
  }
  return matches;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args[0] && !["--audit", "--check"].includes(args[0]))) {
    throw new Error("Usage: node scripts/check-language.mjs [--audit | --check]");
  }
  const check = args[0] === "--check";
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trimEnd();
  const listed = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  });
  const files = [...new Set(listed.split("\0").filter(Boolean))].sort();
  const totals = new Map();
  for (const file of files) {
    const category = categoryFor(file);
    if (check && category !== "active") continue;
    for (const match of scanFile(root, file, category)) {
      if (check && match.category !== "active") continue;
      totals.set(match.category, (totals.get(match.category) ?? 0) + 1);
      console.log(`${file}:${match.line} [${match.category}] ${match.reason}`);
    }
  }

  if (check) {
    const errors = totals.get("active") ?? 0;
    console.log(`Language check found ${errors} active text candidate(s).`);
    if (errors) process.exitCode = 1;
    return;
  }
  const summary = [...totals].map(([category, count]) => `${category} ${count}`).join(", ");
  console.log(`Language audit checked ${files.length} paths${summary ? ` (${summary})` : ""}.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
