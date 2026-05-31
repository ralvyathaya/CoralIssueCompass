import type { CommunityMessage, DocSection, GitHubIssue, Priority, RankedIssue } from "./types";

const LABEL_WEIGHTS: Record<string, number> = {
  security: 35,
  regression: 24,
  bug: 14,
  performance: 14,
  docs: 10,
  ci: 8,
  flaky: 7,
  dependencies: 6,
  enhancement: 5
};

const SENTIMENT_WEIGHTS: Record<CommunityMessage["sentiment"], number> = {
  blocked: 14,
  negative: 8,
  neutral: 3,
  positive: 1
};

export function rankIssues(
  issues: GitHubIssue[],
  communityMessages: CommunityMessage[],
  docs: DocSection[]
): RankedIssue[] {
  return issues
    .filter((issue) => issue.state === "open")
    .map((issue) => scoreIssue(issue, communityMessages, docs))
    .sort((left, right) => right.score - left.score || right.issue.comments - left.issue.comments);
}

function scoreIssue(
  issue: GitHubIssue,
  communityMessages: CommunityMessage[],
  docs: DocSection[]
): RankedIssue {
  const matchedMessages = communityMessages.filter((message) => matchesIssue(message, issue.number));
  const matchedDocs = docs.filter((doc) => doc.relatedIssueNumbers.includes(issue.number));
  const staleDocs = matchedDocs.filter((doc) => doc.stale);
  const reasons: string[] = [];

  let score = Math.min(issue.comments * 2, 30);
  if (issue.comments > 0) {
    reasons.push(`${issue.comments} GitHub comments show active maintainer/user discussion`);
  }

  for (const label of issue.labels) {
    const weight = LABEL_WEIGHTS[label.toLowerCase()] ?? 0;
    if (weight > 0) {
      score += weight;
      reasons.push(`Label "${label}" adds ${weight} urgency points`);
    }
  }

  if (matchedMessages.length > 0) {
    const communityScore = Math.min(
      matchedMessages.reduce((total, message) => total + 8 + SENTIMENT_WEIGHTS[message.sentiment], 0),
      34
    );
    score += communityScore;
    reasons.push(
      `${matchedMessages.length} related community mention${matchedMessages.length === 1 ? "" : "s"} add ${communityScore} cross-source signal points`
    );
  }

  if (issue.assignee) {
    score -= 4;
    reasons.push(`Already assigned to ${issue.assignee}, so coordination risk is lower`);
  } else {
    score += 10;
    reasons.push("No assignee yet, so it needs maintainer triage");
  }

  if (staleDocs.length > 0) {
    score += 14;
    reasons.push(`${staleDocs.length} related doc section${staleDocs.length === 1 ? " is" : "s are"} stale`);
  } else if (matchedDocs.length > 0) {
    score += 3;
    reasons.push(`${matchedDocs.length} related doc section${matchedDocs.length === 1 ? "" : "s"} can guide the fix`);
  } else {
    score += 5;
    reasons.push("No related docs found, so the fix may need new documentation");
  }

  if (issue.type === "pull_request") {
    score -= 6;
    reasons.push("Open PR can likely be resolved with review instead of full implementation");
  }

  const normalizedScore = Math.max(0, Math.round(score));

  return {
    issue,
    score: normalizedScore,
    priority: toPriority(normalizedScore),
    matchedMessages,
    matchedDocs,
    reasons,
    suggestedAction: buildSuggestedAction(issue, matchedMessages, matchedDocs),
    draftReply: buildDraftReply(issue, matchedMessages, matchedDocs)
  };
}

function matchesIssue(message: CommunityMessage, issueNumber: number) {
  return message.issueNumbers.includes(issueNumber) || message.text.includes(`#${issueNumber}`);
}

function toPriority(score: number): Priority {
  if (score >= 95) return "Critical";
  if (score >= 65) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function buildSuggestedAction(issue: GitHubIssue, messages: CommunityMessage[], docs: DocSection[]) {
  const labels = issue.labels.map((label) => label.toLowerCase());
  const hasBlockedUsers = messages.some((message) => message.sentiment === "blocked");
  const staleDoc = docs.find((doc) => doc.stale);

  if (labels.includes("security")) {
    return "Patch or pin the vulnerable dependency first, publish a short advisory comment, then cut a patch release if the audit confirms exposure.";
  }

  if (labels.includes("regression") || hasBlockedUsers) {
    return "Reproduce the regression, assign an owner, ship a narrow hotfix, and post a status update to the linked community threads.";
  }

  if (issue.type === "pull_request") {
    return "Review the PR today, run the Windows regression case, and merge if CI is green because community users are already validating it.";
  }

  if (labels.includes("docs") || staleDoc) {
    return "Update the stale docs section, add the corrected setup value, and link the merged documentation change back to the issue.";
  }

  if (labels.includes("performance")) {
    return "Scope an incremental indexing spike, ask affected users for repo sizes, and document the expected performance target before implementation.";
  }

  return "Triage the issue, confirm the expected behavior, and either assign an owner or ask for a minimal reproduction.";
}

function buildDraftReply(issue: GitHubIssue, messages: CommunityMessage[], docs: DocSection[]) {
  const firstMessage = messages[0];
  const staleDoc = docs.find((doc) => doc.stale);
  const communityLine = firstMessage
    ? `We also saw the ${firstMessage.source} report from ${firstMessage.author}, so we understand this is affecting real users.`
    : "We have enough signal to prioritize maintainer triage.";
  const docLine = staleDoc
    ? `The related docs section (${staleDoc.path}) looks stale, so we will update it as part of the fix.`
    : docs.length > 0
      ? `The related docs section (${docs[0].path}) should help validate the fix.`
      : "If the fix changes behavior, we will add a docs note so future users do not hit the same issue.";

  return `Thanks for the detailed reports on #${issue.number}. ${communityLine}\n\nNext step: a maintainer should take ${issue.type === "pull_request" ? "review" : "ownership"} today, post a short status update, and link the fix here. ${docLine}`;
}
