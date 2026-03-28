#!/usr/bin/env node

const { execSync } = require("child_process");
const readline = require("readline");

// ── Skill definitions ──────────────────────────────────────────────────────
const SKILLS = {
  "Frontend": [
    { key: "frontend-design",   cmd: "npx skills add anthropics/claude-code-skill frontend-design",        desc: "Best-in-class UI output (Anthropic official)" },
    { key: "next-cache",        cmd: "npx skills add vercel-labs/next-cache-components",                   desc: "Next.js caching strategies" },
    { key: "next-upgrade",      cmd: "npx skills add vercel-labs/next-upgrade",                            desc: "Next.js version upgrade playbook" },
  ],
  "Database": [
    { key: "neon-postgres",     cmd: "npx skills add neondatabase/agent-skills",                           desc: "Neon serverless Postgres (auth, drizzle, branching, toolkit)" },
  ],
  "Cloudflare": [
    { key: "wrangler",          cmd: "npx skills add cloudflare/wrangler",                                 desc: "Workers, KV, R2, D1, Vectorize, Queues" },
    { key: "durable-objects",   cmd: "npx skills add cloudflare/durable-objects",                          desc: "Stateful coordination, SQLite, WebSockets" },
    { key: "agents-sdk",        cmd: "npx skills add cloudflare/agents-sdk",                               desc: "Stateful AI agents on CF (scheduling, RPC, MCP)" },
    { key: "cf-mcp-server",     cmd: "npx skills add cloudflare/building-mcp-server-on-cloudflare",        desc: "Build remote MCP servers with OAuth" },
  ],
  "Backend / Runtime": [
    { key: "node-fastify",      cmd: "npx skills add mcollina/skills",                                     desc: "Node.js, Fastify, TypeScript, OAuth (Matteo Collina)" },
  ],
  "Firebase": [
    { key: "firebase",          cmd: "npx skills add firebase/skills",                                     desc: "Official Firebase agent skills" },
  ],
  "AWS": [
    { key: "aws",               cmd: "npx skills add zxkane/aws-skills",                                   desc: "AWS infra automation + cloud architecture" },
  ],
  "Security": [
    { key: "insecure-defaults", cmd: "npx skills add trailofbits/insecure-defaults",                       desc: "Catches hardcoded secrets, weak crypto, bad configs" },
    { key: "sharp-edges",       cmd: "npx skills add trailofbits/sharp-edges",                             desc: "Flags dangerous APIs and error-prone patterns" },
  ],
  "Testing / QA": [
    { key: "playwright",        cmd: "npx skills add testdino-hq/playwright-skill",                        desc: "70+ production Playwright patterns (E2E, POM, CI/CD)" },
    { key: "code-review",       cmd: "npx skills add NeoLabHQ/code-review",                                desc: "Multi-agent PR review: bugs, security, coverage" },
  ],
  "CI / Infra-as-Code": [
    { key: "terraform",         cmd: "npx skills add antonbabenko/terraform-skill",                        desc: "Terraform IaC best practices" },
    { key: "gh-fix-ci",         cmd: "npx skills add openai/gh-fix-ci",                                   desc: "Debug failing GitHub Actions automatically" },
  ],
  "Meta / Context": [
    { key: "ctx-compression",   cmd: "npx skills add muratcankoylan/context-compression",                  desc: "Compaction + caching for long sessions" },
    { key: "ctx-optimization",  cmd: "npx skills add muratcankoylan/context-optimization",                 desc: "Masking + context strategy patterns" },
    { key: "reflexion",         cmd: "npx skills add NeoLabHQ/reflexion",                                  desc: "Self-critique loop before finalising output" },
  ],
};

// ── Colours ────────────────────────────────────────────────────────────────
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  gray:   "\x1b[90m",
  white:  "\x1b[97m",
  bg:     "\x1b[44m",
};

// ── Flatten skills + build state ───────────────────────────────────────────
const flat = [];
for (const [group, skills] of Object.entries(SKILLS)) {
  for (const s of skills) flat.push({ ...s, group, selected: true });
}

let cursor = 0;
let mode = "select"; // "select" | "confirm" | "installing" | "done"

// ── Terminal raw mode helpers ──────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin });
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

function hideCursor() { process.stdout.write("\x1b[?25l"); }
function showCursor() { process.stdout.write("\x1b[?25h"); }
function clearScreen() { process.stdout.write("\x1b[2J\x1b[H"); }
function moveTo(row, col) { process.stdout.write(`\x1b[${row};${col}H`); }

function exit() {
  showCursor();
  rl.close();
  process.stdout.write("\n");
  process.exit(0);
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  clearScreen();
  const lines = [];

  lines.push(`${c.bold}${c.cyan}  skill-init${c.reset}  ${c.gray}— essential Claude agent skills${c.reset}`);
  lines.push(`${c.gray}  SPACE toggle · A select all · N select none · ENTER install · Q quit${c.reset}`);
  lines.push("");

  let lastGroup = null;
  flat.forEach((skill, i) => {
    if (skill.group !== lastGroup) {
      lines.push(`  ${c.bold}${c.white}${skill.group}${c.reset}`);
      lastGroup = skill.group;
    }
    const isCursor  = i === cursor;
    const isChecked = skill.selected;
    const check  = isChecked ? `${c.green}✓${c.reset}` : `${c.gray}○${c.reset}`;
    const hi     = isCursor  ? `${c.bg}${c.white}` : "";
    const hiEnd  = isCursor  ? c.reset : "";
    const name   = isCursor
      ? `${c.bold}${skill.key}${c.reset}`
      : isChecked ? `${c.white}${skill.key}${c.reset}` : `${c.gray}${skill.key}${c.reset}`;
    const desc   = `${c.gray}${skill.desc}${c.reset}`;
    lines.push(`  ${hi} ${check} ${name.padEnd(22)} ${desc}${hiEnd}`);
  });

  const sel = flat.filter(s => s.selected).length;
  lines.push("");
  lines.push(`  ${c.yellow}${sel} skill${sel !== 1 ? "s" : ""} selected${c.reset}`);

  process.stdout.write(lines.join("\n"));
}

function renderConfirm() {
  clearScreen();
  const selected = flat.filter(s => s.selected);
  const lines = [];
  lines.push(`${c.bold}${c.cyan}  Installing ${selected.length} skills${c.reset}`);
  lines.push("");
  selected.forEach(s => {
    lines.push(`  ${c.green}✓${c.reset}  ${c.white}${s.key}${c.reset}  ${c.gray}${s.group}${c.reset}`);
  });
  lines.push("");
  lines.push(`  ${c.yellow}Press ENTER to confirm, Q to go back${c.reset}`);
  process.stdout.write(lines.join("\n"));
}

// ── Install ────────────────────────────────────────────────────────────────
async function install() {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  rl.close();
  clearScreen();

  const selected = flat.filter(s => s.selected);
  const total = selected.length;
  let done = 0;
  let failed = [];

  console.log(`${c.bold}${c.cyan}  Installing ${total} skills...${c.reset}\n`);

  for (const skill of selected) {
    process.stdout.write(`  ${c.gray}[${done + 1}/${total}]${c.reset}  ${c.white}${skill.key}${c.reset}  `);
    try {
      execSync(skill.cmd, { stdio: "ignore" });
      process.stdout.write(`${c.green}✓${c.reset}\n`);
    } catch {
      process.stdout.write(`${c.red}✗ failed${c.reset}\n`);
      failed.push(skill.key);
    }
    done++;
  }

  console.log("");
  if (failed.length === 0) {
    console.log(`  ${c.bold}${c.green}All ${total} skills installed.${c.reset}`);
  } else {
    console.log(`  ${c.green}${total - failed.length} installed${c.reset}  ${c.red}${failed.length} failed: ${failed.join(", ")}${c.reset}`);
  }

  if (flat.some(s => s.key === "neon-postgres" && s.selected)) {
    console.log(`\n  ${c.yellow}Neon tip:${c.reset} also run inside Claude Code:`);
    console.log(`  ${c.gray}/plugin marketplace add neondatabase/agent-skills${c.reset}`);
    console.log(`  ${c.gray}/plugin install neon-postgres@neon${c.reset}`);
  }

  console.log("");
  showCursor();
  process.exit(0);
}

// ── Input handler ──────────────────────────────────────────────────────────
process.stdin.on("keypress", (str, key) => {
  if (!key) return;
  const k = key.name;

  if (mode === "select") {
    if (k === "q" || (key.ctrl && k === "c")) { exit(); }
    else if (k === "up")    { cursor = (cursor - 1 + flat.length) % flat.length; render(); }
    else if (k === "down")  { cursor = (cursor + 1) % flat.length; render(); }
    else if (k === "space") { flat[cursor].selected = !flat[cursor].selected; render(); }
    else if (str === "a" || str === "A") { flat.forEach(s => s.selected = true);  render(); }
    else if (str === "n" || str === "N") { flat.forEach(s => s.selected = false); render(); }
    else if (k === "return") {
      if (flat.some(s => s.selected)) { mode = "confirm"; renderConfirm(); }
    }
  } else if (mode === "confirm") {
    if (k === "q" || (key.ctrl && k === "c")) { mode = "select"; render(); }
    else if (k === "return") { mode = "installing"; install(); }
  }
});

// ── Boot ───────────────────────────────────────────────────────────────────
hideCursor();
render();
