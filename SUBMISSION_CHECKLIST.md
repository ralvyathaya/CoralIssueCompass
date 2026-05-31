# Final submission checklist

## Required assets

- [ ] Public GitHub repository is accessible to judges.
- [ ] Repository contains the complete IssueCompass source code.
- [ ] `README.md` explains the problem, solution, Coral usage, data sources, setup, and demo workflow.
- [ ] Demo video is recorded and link is ready.
- [ ] App runs locally with `npm install` and `npm run dev`.
- [ ] Submission includes the project one-liner: “IssueCompass helps open-source maintainers decide what to work on next by joining GitHub issues/PRs, community messages, and project docs through Coral SQL.”

## Coral judging signals

- [ ] UI visibly shows **Connected sources**.
- [ ] UI visibly shows **SQL used by Coral**.
- [ ] README explains Coral SQL interface.
- [ ] README explains cross-source joins.
- [ ] README explains schema learning / learned join keys.
- [ ] README explains caching.
- [ ] SQL files exist in `coral/queries/`:
  - [ ] `priority_issues.sql`
  - [ ] `duplicate_issues.sql`
  - [ ] `release_notes.sql`

## Demo readiness

- [ ] Start app before recording: `npm run dev`.
- [ ] Open `http://localhost:3000`.
- [ ] Click **Analyze Repo** during the recording.
- [ ] Show the top ranked issue and explain why it matters.
- [ ] Show related community mentions.
- [ ] Show related docs sections.
- [ ] Show suggested maintainer action.
- [ ] Show draft reply.
- [ ] Expand the SQL panel.
- [ ] Mention that `lib/coral.ts` is the adapter layer for swapping fixture data with live Coral connectors.

## Video checklist

- [ ] 2–3 minutes long.
- [ ] Starts with the maintainer problem.
- [ ] Shows the complete working vertical slice.
- [ ] Clearly says why Coral is central.
- [ ] Ends with the outcome: prioritized maintainer action plan.

## Last 30 minutes

- [ ] Run `npm run build` successfully or document any limitation.
- [ ] Push latest code to GitHub.
- [ ] Verify GitHub repo is public or accessible.
- [ ] Add demo video link to README or submission form.
- [ ] Re-run the demo once from a clean browser tab.
