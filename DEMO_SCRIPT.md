# IssueCompass demo script — 2 to 3 minutes

## 0:00–0:20 — Problem

“Open-source maintainers have too much signal spread across too many places. GitHub issues show part of the story, but user pain often appears in Discord, Slack, forums, or docs complaints. IssueCompass answers one question: what should I work on today?”

## 0:20–0:40 — Solution

“This is IssueCompass, an AI first mate for maintainers. It joins GitHub issues and PRs, community messages, and docs metadata through Coral SQL, then ranks the top maintainer actions.”

Point to the hero and connected sources panel.

## 0:40–1:05 — Connected data sources

Show the right-side panel:

- GitHub issues / pull requests
- Community CSV/JSON export
- Docs index

Say:

“Coral gives us one SQL interface across these sources. The app also shows learned schemas, join keys, and cache status so judges can see Coral in the workflow.”

## 1:05–1:25 — Core interaction

Click **Analyze Repo**.

Say:

“The maintainer asks: what should I work on today? IssueCompass runs the Coral priority query, joins the sources, scores each issue, and generates a maintainer-ready brief.”

## 1:25–1:55 — Top recommendation

Show the first ranked card.

Say:

“The top issue is not just high because of GitHub comments. It is high because Coral connects GitHub labels, blocked community messages, missing ownership, and stale docs. That cross-source join is the value.”

Point out:

- score and priority
- labels
- community mentions
- stale docs
- suggested action
- draft reply

## 1:55–2:20 — SQL used by Coral

Open **SQL used by Coral: priority_issues.sql**.

Say:

“This is the SQL powering the demo. It joins GitHub items to community messages and docs sections, computes urgency, and returns the top five. The app is built around this Coral adapter boundary, so live connectors can replace the fixtures without rewriting the UI.”

## 2:20–2:45 — Outcome

Say:

“The outcome is a ranked action plan, not another dashboard. A maintainer can assign the top issue, post the generated reply, and know which docs or community threads are connected.”

## 2:45–3:00 — Close

“Coral matters because it turns scattered maintainer data into one queryable workflow. IssueCompass uses Coral’s SQL interface, cross-source joins, schema learning, and caching to help maintainers make the next best decision.”
