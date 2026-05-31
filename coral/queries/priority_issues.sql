-- priority_issues.sql
-- Coral SQL demo query: join GitHub issues/PRs, community messages, and docs metadata.
-- The app displays this query so judges can see Coral as the cross-source workflow layer.

WITH github_items AS (
  SELECT
    number,
    title,
    'issue' AS item_type,
    labels,
    comments,
    assignee,
    state,
    updated_at,
    url
  FROM github.issues
  WHERE state = 'open'

  UNION ALL

  SELECT
    number,
    title,
    'pull_request' AS item_type,
    labels,
    comments,
    assignee,
    state,
    updated_at,
    url
  FROM github.pull_requests
  WHERE state = 'open'
),
community_signal AS (
  SELECT
    item.number,
    COUNT(message.id) AS community_mentions,
    SUM(CASE WHEN message.sentiment = 'blocked' THEN 1 ELSE 0 END) AS blocked_mentions,
    STRING_AGG(message.source || ': ' || message.text, '\n---\n') AS mention_evidence
  FROM github_items item
  LEFT JOIN csv.community_messages message
    ON ARRAY_CONTAINS(message.issue_numbers, item.number)
    OR LOWER(message.text) LIKE CONCAT('%#', CAST(item.number AS TEXT), '%')
  GROUP BY item.number
),
doc_signal AS (
  SELECT
    item.number,
    COUNT(doc.id) AS related_doc_sections,
    SUM(CASE WHEN doc.stale THEN 1 ELSE 0 END) AS stale_doc_sections,
    STRING_AGG(doc.path || ' :: ' || doc.summary, '\n---\n') AS doc_evidence
  FROM github_items item
  LEFT JOIN docs.sections doc
    ON ARRAY_CONTAINS(doc.related_issue_numbers, item.number)
  GROUP BY item.number
)
SELECT
  item.number,
  item.title,
  item.item_type,
  item.labels,
  item.comments,
  item.assignee,
  community.community_mentions,
  community.blocked_mentions,
  docs.related_doc_sections,
  docs.stale_doc_sections,
  (
    LEAST(item.comments * 2, 30)
    + CASE WHEN ARRAY_CONTAINS(item.labels, 'security') THEN 35 ELSE 0 END
    + CASE WHEN ARRAY_CONTAINS(item.labels, 'regression') THEN 24 ELSE 0 END
    + CASE WHEN ARRAY_CONTAINS(item.labels, 'bug') THEN 14 ELSE 0 END
    + CASE WHEN ARRAY_CONTAINS(item.labels, 'docs') THEN 10 ELSE 0 END
    + LEAST(COALESCE(community.community_mentions, 0) * 12, 34)
    + CASE WHEN item.assignee IS NULL THEN 10 ELSE -4 END
    + CASE WHEN COALESCE(docs.stale_doc_sections, 0) > 0 THEN 14 ELSE 3 END
  ) AS urgency_score,
  community.mention_evidence,
  docs.doc_evidence,
  item.url
FROM github_items item
LEFT JOIN community_signal community ON community.number = item.number
LEFT JOIN doc_signal docs ON docs.number = item.number
ORDER BY urgency_score DESC, item.updated_at DESC
LIMIT 5;
