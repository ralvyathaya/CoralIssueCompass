-- duplicate_issues.sql
-- Finds likely duplicate issue clusters by combining title similarity, shared labels,
-- and community messages that mention multiple issue numbers.

WITH open_items AS (
  SELECT number, title, labels, url
  FROM github.issues
  WHERE state = 'open'
),
community_edges AS (
  SELECT
    message.id AS message_id,
    issue_a.number AS issue_a,
    issue_b.number AS issue_b,
    message.text AS community_evidence
  FROM csv.community_messages message
  JOIN open_items issue_a ON ARRAY_CONTAINS(message.issue_numbers, issue_a.number)
  JOIN open_items issue_b ON ARRAY_CONTAINS(message.issue_numbers, issue_b.number)
  WHERE issue_a.number < issue_b.number
),
title_edges AS (
  SELECT
    a.number AS issue_a,
    b.number AS issue_b,
    JACCARD_SIMILARITY(LOWER(a.title), LOWER(b.title)) AS title_similarity
  FROM open_items a
  JOIN open_items b ON a.number < b.number
)
SELECT
  title_edges.issue_a,
  title_edges.issue_b,
  title_edges.title_similarity,
  COUNT(community_edges.message_id) AS shared_community_mentions,
  STRING_AGG(community_edges.community_evidence, '\n---\n') AS evidence
FROM title_edges
LEFT JOIN community_edges
  ON community_edges.issue_a = title_edges.issue_a
  AND community_edges.issue_b = title_edges.issue_b
WHERE title_edges.title_similarity >= 0.42
   OR community_edges.message_id IS NOT NULL
GROUP BY title_edges.issue_a, title_edges.issue_b, title_edges.title_similarity
ORDER BY shared_community_mentions DESC, title_similarity DESC;
