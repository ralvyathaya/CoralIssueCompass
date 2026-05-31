-- release_notes.sql
-- Creates release-note candidates by joining merged PRs, linked issues,
-- community pain, and docs sections that should be updated before release.

WITH merged_prs AS (
  SELECT
    number,
    title,
    merged_at,
    labels,
    linked_issue_numbers,
    url
  FROM github.pull_requests
  WHERE state = 'closed'
    AND merged_at >= CURRENT_DATE - INTERVAL '14 days'
),
linked_issues AS (
  SELECT
    pr.number AS pr_number,
    issue.number AS issue_number,
    issue.title AS issue_title,
    issue.labels AS issue_labels
  FROM merged_prs pr
  JOIN github.issues issue
    ON ARRAY_CONTAINS(pr.linked_issue_numbers, issue.number)
),
community_impact AS (
  SELECT
    linked.issue_number,
    COUNT(message.id) AS community_mentions,
    SUM(CASE WHEN message.sentiment IN ('blocked', 'negative') THEN 1 ELSE 0 END) AS painful_mentions
  FROM linked_issues linked
  LEFT JOIN csv.community_messages message
    ON ARRAY_CONTAINS(message.issue_numbers, linked.issue_number)
  GROUP BY linked.issue_number
),
docs_to_update AS (
  SELECT
    linked.issue_number,
    STRING_AGG(doc.path, ', ') AS related_docs
  FROM linked_issues linked
  LEFT JOIN docs.sections doc
    ON ARRAY_CONTAINS(doc.related_issue_numbers, linked.issue_number)
  GROUP BY linked.issue_number
)
SELECT
  pr.number AS pr_number,
  pr.title AS release_note_title,
  linked.issue_number,
  linked.issue_title,
  impact.community_mentions,
  impact.painful_mentions,
  docs.related_docs,
  CASE
    WHEN impact.painful_mentions > 0 THEN 'Call out user-visible fix'
    WHEN ARRAY_CONTAINS(pr.labels, 'docs') THEN 'Mention docs update'
    ELSE 'Standard changelog item'
  END AS release_note_style,
  pr.url
FROM merged_prs pr
JOIN linked_issues linked ON linked.pr_number = pr.number
LEFT JOIN community_impact impact ON impact.issue_number = linked.issue_number
LEFT JOIN docs_to_update docs ON docs.issue_number = linked.issue_number
ORDER BY impact.painful_mentions DESC, pr.merged_at DESC;
