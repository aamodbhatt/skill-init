# skill-init

Install all essential Claude agent skills in one command.

Covers the full prod stack — frontend, database (Neon), Cloudflare infra, backend, Firebase, AWS, security, testing, CI, and context management.

## Usage
```bash
npx github:aamodbhatt/skill-init
```

Interactive TUI — toggle skills on/off with arrow keys and space, then hit Enter to install.

## Skills included

| Category | Skills |
|---|---|
| Frontend | `frontend-design`, `next-cache`, `next-upgrade` |
| Database | `neon-postgres` (auth, drizzle, branching, serverless, toolkit) |
| Cloudflare | `wrangler`, `durable-objects`, `agents-sdk`, `cf-mcp-server` |
| Backend | `node` + `fastify` + `typescript` + `oauth` (mcollina) |
| Firebase | official firebase agent skills |
| AWS | infra automation + cloud architecture |
| Security | `insecure-defaults`, `sharp-edges` (Trail of Bits) |
| Testing | `playwright` (70+ patterns), `code-review` (multi-agent PR review) |
| CI | `terraform`, `gh-fix-ci` |
| Meta | `context-compression`, `context-optimization`, `reflexion` |

## Controls

| Key | Action |
|---|---|
| `↑ ↓` | navigate |
| `space` | toggle skill |
| `A` | select all |
| `N` | deselect all |
| `enter` | install selected |
| `Q` | quit |
