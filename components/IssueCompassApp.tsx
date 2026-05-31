"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateMaintainerBrief } from "@/lib/ai";
import { rankIssues } from "@/lib/scoring";
import type { AnalysisResult, RankedIssue, SourceKey } from "@/lib/types";

interface IssueCompassAppProps {
  analysis: AnalysisResult;
}

interface RepoTarget {
  owner: string;
  name: string;
  url: string;
}

type SourceToggleState = Record<SourceKey, boolean>;

interface ResultsProps extends IssueCompassAppProps {
  sectionRef: RefObject<HTMLDivElement>;
  targetRepo: RepoTarget;
  question: string;
  onBackToTop: () => void;
  onToggleResults: () => void;
}

export function IssueCompassApp({ analysis }: IssueCompassAppProps) {
  const [repoUrl, setRepoUrl] = useState(analysis.repo.url);
  const [question, setQuestion] = useState(
    "What should I work on today as an open-source maintainer?",
  );
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrollRequest, setScrollRequest] = useState(0);
  const [enabledSources, setEnabledSources] = useState<SourceToggleState>({
    github: true,
    community: true,
    docs: true,
  });
  const resultsRef = useRef<HTMLDivElement>(null);
  const targetRepo = parseGitHubRepo(repoUrl) ?? analysis.repo;
  const activeAnalysis = useMemo(
    () => buildAnalysisFromSources(analysis, enabledSources),
    [analysis, enabledSources],
  );

  useEffect(() => {
    if (!hasAnalyzed || !showResults) return;

    const frame = requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: getScrollBehavior(),
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [hasAnalyzed, showResults, scrollRequest]);

  function analyzeRepo() {
    setHasAnalyzed(true);
    setShowResults(true);
    setScrollRequest((request) => request + 1);
  }

  function viewLatestAnalysis() {
    setShowResults(true);
    setScrollRequest((request) => request + 1);
  }

  function toggleLatestAnalysis() {
    if (showResults) {
      setShowResults(false);
      return;
    }

    viewLatestAnalysis();
  }

  function scrollToQuestion() {
    window.scrollTo({ top: 0, behavior: getScrollBehavior() });
  }

  function toggleSource(source: SourceKey) {
    setEnabledSources((current) => ({
      ...current,
      [source]: !current[source],
    }));
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">IC</span>
          <span>IssueCompass</span>
        </div>
        <span className="topbar-meta">Coral SQL maintainer triage</span>
      </header>

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
              analyzeRepo();
            }}
          >
            <div className="form-field">
              <label className="ask-label" htmlFor="repo-url">
                Repository URL
              </label>
              <Input
                id="repo-url"
                aria-label="Repository URL"
                placeholder="https://github.com/coral-hackathon/issuecompass-demo"
                type="url"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
              />
              <p className="field-hint">
                Demo data is fixture-backed for reliability; this sets the repo
                target shown in the brief. Live Coral connectors can replace it.
              </p>
            </div>

            <div className="form-field">
              <label className="ask-label" htmlFor="maintainer-question">
                Question optional
              </label>
              <Textarea
                id="maintainer-question"
                aria-label="Maintainer question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </div>

            <div className="ask-actions">
              <span className="secondary-note">
                Target repo: {targetRepo.owner}/{targetRepo.name}
              </span>
              <div className="ask-buttons">
                {hasAnalyzed ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleLatestAnalysis}
                  >
                    {showResults ? "Hide analysis" : "View analysis ↓"}
                  </Button>
                ) : null}
                <Button type="submit">Analyze Repo →</Button>
              </div>
            </div>
          </form>
        </div>

        <aside className="side-stack" aria-label="Connected source overview">
          <section className="panel">
            <h2>Connected sources</h2>
            <p className="panel-caption">
              Toggle sources to see the Coral join signals change the ranking.
            </p>
            <ul className="source-list">
              {analysis.sources.map((source) => {
                const isEnabled = enabledSources[source.id];

                return (
                  <li className="source-item" key={source.name}>
                    <button
                      className="source-toggle"
                      type="button"
                      aria-pressed={isEnabled}
                      onClick={() => toggleSource(source.id)}
                    >
                      <span className="source-row">
                        <strong>{source.name}</strong>
                        <span className="source-state">
                          {isEnabled ? "Included" : "Excluded"}
                        </span>
                      </span>
                      <span>{source.connector}</span>
                      <span className="status-pill">
                        {source.records} records · {source.status}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </section>

      {hasAnalyzed && showResults ? (
        <Results
          analysis={activeAnalysis}
          sectionRef={resultsRef}
          targetRepo={targetRepo}
          question={question}
          onBackToTop={scrollToQuestion}
          onToggleResults={toggleLatestAnalysis}
        />
      ) : hasAnalyzed ? (
        <CollapsedResult onShow={viewLatestAnalysis} />
      ) : (
        <EmptyState />
      )}

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
      <span>Enter a GitHub repo URL, then analyze the maintainer queue.</span>
    </section>
  );
}

function CollapsedResult({ onShow }: { onShow: () => void }) {
  return (
    <section className="panel collapsed-result">
      <div>
        <strong>Analysis ready.</strong>
        <span> The latest maintainer brief is hidden.</span>
      </div>
      <Button type="button" variant="outline" onClick={onShow}>
        View analysis ↓
      </Button>
    </section>
  );
}

function Results({
  analysis,
  sectionRef,
  targetRepo,
  question,
  onBackToTop,
  onToggleResults,
}: ResultsProps) {
  return (
    <div className="analysis-section" id="results" ref={sectionRef}>
      <section
        className="analysis-divider"
        aria-label="Analysis result summary"
      >
        <div>
          <p className="section-kicker">Analysis result</p>
          <h2>Today’s maintainer plan</h2>
          <p>
            Answering “{question}” for {targetRepo.owner}/{targetRepo.name}
            using the currently included Coral sources.
          </p>
        </div>
        <div className="analysis-controls">
          <div className="analysis-badges" aria-label="Analysis metadata">
            <span>{analysis.brief.rankedIssues.length} priorities</span>
            <span>{analysis.rawCounts.communityMessages} messages joined</span>
            <span>{analysis.cache.status}</span>
          </div>
          <div className="analysis-actions">
            <Button type="button" variant="outline" onClick={onBackToTop}>
              ↑ Analyze another repo
            </Button>
            <Button type="button" variant="secondary" onClick={onToggleResults}>
              Hide results
            </Button>
          </div>
        </div>
      </section>

      <section className="results" aria-label="Analysis results">
        <aside
          className="results-column results-sidebar"
          aria-label="Maintainer brief"
        >
          <div className="panel summary-card">
            <p className="eyebrow">Maintainer brief</p>
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
          </div>
        </aside>

        <div
          className="results-column results-main"
          aria-label="Ranked issues and Coral SQL"
        >
          <ol className="issue-list">
            {analysis.brief.rankedIssues.map((ranked, index) => (
              <IssueCard
                key={ranked.issue.id}
                ranked={ranked}
                rank={index + 1}
              />
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
    </div>
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

function buildAnalysisFromSources(
  analysis: AnalysisResult,
  enabledSources: SourceToggleState,
): AnalysisResult {
  const issues = enabledSources.github ? analysis.sourceData.issues : [];
  const communityMessages = enabledSources.community
    ? analysis.sourceData.communityMessages
    : [];
  const docs = enabledSources.docs ? analysis.sourceData.docs : [];
  const rankedIssues = rankIssues(issues, communityMessages, docs);

  return {
    ...analysis,
    learnedSchemas: analysis.learnedSchemas.filter((schema) => {
      if (schema.source.startsWith("github")) return enabledSources.github;
      if (schema.source.startsWith("csv")) return enabledSources.community;
      if (schema.source.startsWith("docs")) return enabledSources.docs;
      return true;
    }),
    brief: generateMaintainerBrief(rankedIssues),
    rawCounts: {
      issues: issues.length,
      communityMessages: communityMessages.length,
      docs: docs.length,
    },
    sourceData: {
      issues,
      communityMessages,
      docs,
    },
  };
}

function getScrollBehavior(): ScrollBehavior {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "auto";
  }

  return "smooth";
}

function parseGitHubRepo(value: string): RepoTarget | null {
  const trimmed = value.trim().replace(/\.git$/, "");
  if (!trimmed) return null;

  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);

    if (!url.hostname.includes("github.com")) return null;

    const [owner, name] = url.pathname.replace(/^\/+/, "").split("/");
    if (!owner || !name) return null;

    return {
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
    };
  } catch {
    const [owner, name] = trimmed.replace(/^github\.com\//, "").split("/");
    if (!owner || !name) return null;

    return {
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
    };
  }
}
