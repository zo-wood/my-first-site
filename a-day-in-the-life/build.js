#!/usr/bin/env node
// Compiles a Twee 3 source file into a playable Twine 2 HTML story.
// Usage: node build.js <story.twee> <harlowe/format.js> <output.html>
// The output can be played in a browser or imported into Twine (Library -> Import).

const fs = require("fs");

const [src, formatPath, out] = process.argv.slice(2);
if (!src || !formatPath || !out) {
  console.error("Usage: node build.js <story.twee> <format.js> <output.html>");
  process.exit(1);
}

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// --- Parse Twee 3 ---
const passages = [];
let current = null;
for (const line of fs.readFileSync(src, "utf8").split(/\r?\n/)) {
  const header = line.match(/^::\s*(.*?)\s*(?:\[([^\]]*)\])?\s*(\{.*\})?\s*$/);
  if (header) {
    current = { name: header[1], tags: (header[2] || "").trim(), lines: [] };
    passages.push(current);
  } else if (current) {
    current.lines.push(line);
  }
}
for (const p of passages) p.text = p.lines.join("\n").replace(/\s+$/, "");

const special = (n) => passages.find((p) => p.name === n);
const title = special("StoryTitle")?.text.trim() || "Untitled";
const data = JSON.parse(special("StoryData")?.text || "{}");
const story = passages.filter((p) => !["StoryTitle", "StoryData"].includes(p.name));

const css = story.filter((p) => p.tags.split(/\s+/).includes("stylesheet")).map((p) => p.text).join("\n");
const js = story.filter((p) => p.tags.split(/\s+/).includes("script")).map((p) => p.text).join("\n");
const normal = story.filter((p) => !/\b(stylesheet|script)\b/.test(p.tags));

const startIdx = normal.findIndex((p) => p.name === data.start);
if (startIdx < 0) throw new Error(`Start passage "${data.start}" not found`);

// Warn about links to passages that don't exist.
const names = new Set(normal.map((p) => p.name));
for (const p of normal) {
  for (const m of p.text.matchAll(/\[\[(.+?)\]\]/g)) {
    const target = m[1].includes("->") ? m[1].split("->").pop() : m[1].split("|").pop();
    if (!names.has(target.trim())) console.warn(`Broken link in "${p.name}": ${target}`);
  }
}

// Lay passages out in a grid, one row per act prefix (SYS, M, C, W, E).
const rows = {};
const passageXml = normal.map((p, i) => {
  const row = p.name.match(/^(SYS|[A-Z])/)?.[1] || "?";
  rows[row] ??= { y: Object.keys(rows).length, n: 0 };
  const pos = `${100 + rows[row].n++ * 175},${100 + rows[row].y * 175}`;
  return `<tw-passagedata pid="${i + 1}" name="${esc(p.name)}" tags="${esc(p.tags)}" position="${pos}" size="100,100">${esc(p.text)}</tw-passagedata>`;
}).join("");

const storyData =
  `<tw-storydata name="${esc(title)}" startnode="${startIdx + 1}" creator="Twine" creator-version="2.10.0" ` +
  `format="${esc(data.format)}" format-version="${esc(data["format-version"])}" ifid="${esc(data.ifid)}" ` +
  `options="" tags="" zoom="${data.zoom || 1}" hidden>` +
  `<style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css">${esc(css)}</style>` +
  `<script role="script" id="twine-user-script" type="text/twine-javascript">${esc(js)}</script>` +
  passageXml + `</tw-storydata>`;

// --- Load story format (JSONP: window.storyFormat({...})) ---
let format;
global.window = { storyFormat: (f) => (format = f) };
eval(fs.readFileSync(formatPath, "utf8"));

const html = format.source
  .replace("{{STORY_NAME}}", () => esc(title))
  .replace("{{STORY_DATA}}", () => storyData);
fs.writeFileSync(out, html);
console.log(`Built ${out}: ${normal.length} passages, ${format.name} ${format.version}`);
