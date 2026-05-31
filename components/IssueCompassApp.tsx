"use client";

import { useState } from "react";
import type { AnalysisResult, RankedIssue } from "@/lib/types";

interface IssueCompassAppProps {
  analysis: AnalysisResult;
}

export function IssueCompassApp({ analysis }: IssueCompassAppProps) {
  const [question, setQuestion] = useState(
    "What should I work on today as an open-source maintainer?",
  );
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">IssueCompass × Coral SQL</p>
          <h1>Decide what to work on today</h1>
          <p className="lede">
            Join GitHub issues, community messages, and project docs through
            Coral SQL to get a clear maintainer action plan.
          </p>

          <form
            className="ask-box"
            onSubmit={(event) => {
              event.preventDefault();
              setHasAnalyzed(true);
            }}
          >
            <textarea
              aria-label="Maintainer question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <div className="ask-actions">
              <span className="secondary-note">
                Demo repo: {analysis.repo.owner}/{analysis.repo.name}
              </span>
              <button className="primary-button" type="submit">
                Analyze Repo →
              </button>
            </div>
          </form>
        </div>

        <aside className="side-stack" aria-label="Connected source overview">
          <section className="panel">
            <h2>Connected sources</h2>
            <ul className="source-list">
              {analysis.sources.map((source) => (
                <li className="source-item" key={source.name}>
                  <strong>{source.name}</strong>
                  <span>{source.connector}</span>
                  <span className="status-pill">
                    {source.records} records · {source.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>

      {hasAnalyzed ? <Results analysis={analysis} /> : <EmptyState />}

      <p className="footer-note">
        Built for the WeMakeDevs × Coral hackathon. The adapter in{" "}
        <code>lib/coral.ts</code> is ready to swap fixture reads for live Coral
        connectors.
      </p>
    </main>
  );
}

function EmptyState() {
  return (
    <section className="panel empty-state">
      <strong>Ready.</strong>
      <span>Click “Analyze Repo” to generate today’s maintainer brief.</span>
    </section>
  );
}

function Results({ analysis }: IssueCompassAppProps) {
  return (
    <section className="results" id="results">
      <aside className="panel summary-card">
        <p className="eyebrow">AI maintainer brief</p>
        <h2>What should I work on today?</h2>
        <p>{analysis.brief.summary}</p>

        <div className="recommendation">
          <strong>Recommended focus</strong>
          {analysis.brief.recommendedFocus}
        </div>

        <h3>Why Coral matters</h3>
        <ul className="reason-list">
          {analysis.brief.reasoning.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>

        <h3>Learned schemas</h3>
        <ul className="schema-list">
          {analysis.learnedSchemas.map((schema) => (
            <li className="schema-item" key={schema.source}>
              <strong>{schema.source}</strong>
              <span>Join key: {schema.joinKey}</span>
              <span>{schema.learnedColumns.join(", ")}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div>
        <ol className="issue-list">
          {analysis.brief.rankedIssues.map((ranked, index) => (
            <IssueCard key={ranked.issue.id} ranked={ranked} rank={index + 1} />
          ))}
        </ol>

        <details className="query-card" open>
          <summary>SQL used by Coral: priority_issues.sql</summary>
          <pre>
            <code>{analysis.sql.priorityIssues}</code>
          </pre>
        </details>

        <details className="query-card">
          <summary>Additional Coral SQL: duplicate_issues.sql</summary>
          <pre>
            <code>{analysis.sql.duplicateIssues}</code>
          </pre>
        </details>

        <details className="query-card">
          <summary>Additional Coral SQL: release_notes.sql</summary>
          <pre>
            <code>{analysis.sql.releaseNotes}</code>
          </pre>
        </details>
      </div>
    </section>
  );
}

function IssueCard({ ranked, rank }: { ranked: RankedIssue; rank: number }) {
  const { issue } = ranked;

  return (
    <li>
      <article className="issue-card">
        <header className="issue-header">
          <div className="issue-title-row">
            <div>
              <span className="issue-number">
                #{rank} · {issue.type === "pull_request" ? "PR" : "Issue"}{" "}
                {issue.number}
              </span>
              <h2 className="issue-title">{issue.title}</h2>
            </div>
            <span
              className={`priority-pill priority-${ranked.priority.toLowerCase()}`}
            >
              {ranked.priority} · {ranked.score}
            </span>
          </div>
          <div className="issue-meta">
            <span>{issue.comments} comments</span>
            <span>
              {issue.assignee ? `Assigned to ${issue.assignee}` : "Unassigned"}
            </span>
            <span>Updated {formatDate(issue.updatedAt)}</span>
            <a href={issue.url} target="_blank" rel="noreferrer">
              Open source item ↗
            </a>
          </div>
          <div className="label-row">
            {issue.labels.map((label) => (
              <span className="label-pill" key={label}>
                {label}
              </span>
            ))}
          </div>
        </header>

        <div className="issue-body">
          <section>
            <h3>Why this matters</h3>
            <ul className="reason-list">
              {ranked.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>

          <div className="detail-grid">
            <section className="detail-box">
              <h3>Related community mentions</h3>
              {ranked.matchedMessages.length > 0 ? (
                ranked.matchedMessages.map((message) => (
                  <p className="mention" key={message.id}>
                    <strong>
                      {message.source} · {message.author} · {message.sentiment}
                    </strong>
                    <span>{message.text}</span>
                  </p>
                ))
              ) : (
                <p className="mention">No related community message found.</p>
              )}
            </section>

            <section className="detail-box">
              <h3>Related docs sections</h3>
              {ranked.matchedDocs.length > 0 ? (
                ranked.matchedDocs.map((doc) => (
                  <p className="doc-link" key={doc.id}>
                    <strong>
                      {doc.title} · {doc.stale ? "stale" : "current"}
                    </strong>
                    <span>{doc.path}</span>
                    <span>{doc.summary}</span>
                  </p>
                ))
              ) : (
                <p className="doc-link">No matching docs section found.</p>
              )}
            </section>
          </div>

          <section>
            <h3>Suggested maintainer action</h3>
            <div className="action-box">{ranked.suggestedAction}</div>
          </section>

          <section>
            <h3>Draft reply to users</h3>
            <div className="reply-box">{ranked.draftReply}</div>
          </section>
        </div>
      </article>
    </li>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
