# IssueCompass

**IssueCompass is an AI first mate for open-source maintainers.** It answers the question: **“What should I work on today?”**

Built for the WeMakeDevs × Coral hackathon, IssueCompass shows how Coral can become the maintainer workflow layer by joining GitHub issues/PRs, community messages, and project docs through SQL.

## Problem

Open-source maintainers do not just triage GitHub issues. Important signals are scattered across:

- GitHub issues and pull requests
- Discord, Slack, forums, or GitHub Discussions
- README and docs sections that may be stale

A maintainer can miss urgent work when a GitHub issue looks quiet but community users are blocked, or when a small docs bug creates repeated support requests.

## Solution

IssueCompass joins those signals and produces a maintainer-ready brief:

- Top 5 priority issues / PRs
- Why each item matters
- Related community mentions
- Related docs sections
- Suggested maintainer action
- Draft reply to users
- The Coral SQL query used to create the ranking

## How Coral is used

Coral is central to the workflow. The app is designed around Coral as the cross-source query and schema layer:

1. **SQL interface** — maintainer prioritization is expressed as SQL in `coral/queries/priority_issues.sql`.
2. **Cross-source joins** — GitHub items are joined to community messages and docs sections by issue number.
3. **Schema learning** — the UI shows learned source schemas and join keys such as `github.issues.number`, `csv.community_messages.issue_numbers[]`, and `docs.sections.related_issue_numbers[]`.
4. **Caching** — the UI surfaces a Coral-style cache status and TTL so repeat maintainer analysis is fast and demoable.
5. **Adapter layer** — `lib/coral.ts` is the integration boundary. For hackathon reliability, this MVP reads fixture-backed data while preserving the Coral SQL contract. Swapping in live Coral connectors should only require changing this adapter.

## Connected data sources

| Source | Demo file | Coral-style connector | Join value |
| --- | --- | --- | --- |
| GitHub issues / PRs | `data/github_issues.json` | `github.issues`, `github.pull_requests` | `number` |
| Community messages | `data/community_messages.json` | `csv.community_messages` | `issue_numbers[]` or text `#123` mentions |
| Docs index | `data/docs_index.json` | `docs.sections` | `related_issue_numbers[]` |

## Scoring model

The MVP ranks open issues and PRs with a transparent scoring function in `lib/scoring.ts`.

Signals used:

- Number of GitHub comments
- Labels such as `security`, `regression`, `bug`, `docs`, and `performance`
- Related community mentions and sentiment
- Whether the item has an assignee
- Whether related docs exist or are stale
- Whether an item is already a PR that mainly needs review

## SQL examples

The main demo query is `coral/queries/priority_issues.sql`:

```sql
SELECT
  item.number,
  item.title,
  community.community_mentions,
  docs.related_doc_sections,
  urgency_score
FROM github_items item
LEFT JOIN community_signal community ON community.number = item.number
LEFT JOIN doc_signal docs ON docs.number = item.number
ORDER BY urgency_score DESC
LIMIT 5;
```

Additional Coral SQL examples:

- `coral/queries/duplicate_issues.sql` — finds likely duplicate issue clusters using title similarity and shared community mentions.
- `coral/queries/release_notes.sql` — generates release-note candidates by joining merged PRs, linked issues, community impact, and docs sections.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo workflow

1. Open the app.
2. Show the connected sources panel: GitHub issues/PRs, community messages, docs index.
3. Click **Analyze Repo**.
4. Explain that Coral SQL joins the sources and returns cached results.
5. Show the top recommendation and why it ranked first.
6. Open **SQL used by Coral: priority_issues.sql**.
7. Show a ranked issue card with:
   - community messages
   - docs sections
   - suggested maintainer action
   - draft user reply

## Why Coral matters

Without Coral, the app would need custom ETL code for every data source and join. With Coral, the maintainer question becomes a query:

> “Join my GitHub work queue with community pain and docs freshness, then show what needs action today.”

That makes IssueCompass more than a dashboard: it is a decision layer over connected maintainer data.

## Project structure

```text
app/                         Next.js app route and global styles
components/IssueCompassApp.tsx  Client demo workflow
lib/coral.ts                 Coral adapter boundary
lib/scoring.ts               Transparent prioritization score
lib/ai.ts                    Deterministic maintainer brief generator
coral/queries/               Coral SQL examples
data/                        Fixture-backed connected sources
DEMO_SCRIPT.md               2–3 minute video script
SUBMISSION_CHECKLIST.md      Final-day submission checklist
```

## Future improvements

- Replace fixture data with live Coral GitHub, CSV, and docs connectors.
- Add Coral MCP or CLI execution so SQL files can be run directly from the app or terminal.
- Add repository URL input for analyzing any open-source project.
- Use an LLM provider for richer draft replies while keeping Coral as the source-of-truth retrieval layer.
- Add duplicate detection and release note generation views using the included SQL files.
