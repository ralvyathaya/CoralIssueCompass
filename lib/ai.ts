import type { MaintainerBrief, RankedIssue } from "./types";

export function generateMaintainerBrief(rankedIssues: RankedIssue[]): MaintainerBrief {
  const topFive = rankedIssues.slice(0, 5);
  const topIssue = topFive[0];
  const blockedItems = topFive.filter((ranked) =>
    ranked.matchedMessages.some((message) => message.sentiment === "blocked")
  ).length;
  const staleDocItems = topFive.filter((ranked) => ranked.matchedDocs.some((doc) => doc.stale)).length;

  return {
    generatedAt: new Date().toISOString(),
    summary:
      "IssueCompass joined GitHub issues/PRs, community messages, and docs metadata through Coral-style SQL, then ranked maintainer work by urgency and user impact.",
    recommendedFocus: topIssue
      ? `Start with #${topIssue.issue.number}: ${topIssue.issue.title}. It has the strongest combined signal across GitHub activity, community pain, ownership, and documentation risk.`
      : "No open maintainer work found in the connected sources.",
    reasoning: [
      "Coral is the workflow center: it gives the app one SQL interface over GitHub, CSV/JSON community exports, and docs index data.",
      `${blockedItems} of the top ${topFive.length} items have blocked-user community signals, which would be hard to see from GitHub alone.`,
      `${staleDocItems} of the top ${topFive.length} items touch stale docs, creating a clear fix-plus-documentation path.`,
      "The result is a maintainer-ready action plan instead of another dashboard of unprioritized issues."
    ],
    rankedIssues: topFive,
    nextBestActions: [
      "Assign an owner to the highest-ranked unassigned issue.",
      "Post the generated maintainer reply on the issue and in the related community thread.",
      "Use the duplicate and release-note SQL examples to batch the next triage pass."
    ]
  };
}
