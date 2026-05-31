import { promises as fs } from "fs";
import path from "path";
import { generateMaintainerBrief } from "./ai";
import { rankIssues } from "./scoring";
import type { AnalysisResult, CommunityMessage, DocSection, GitHubIssue } from "./types";

async function readJson<T>(relativePath: string): Promise<T> {
  const file = await fs.readFile(path.join(process.cwd(), relativePath), "utf8");
  return JSON.parse(file) as T;
}

async function readText(relativePath: string): Promise<string> {
  return fs.readFile(path.join(process.cwd(), relativePath), "utf8");
}

export async function analyzeRepository(): Promise<AnalysisResult> {
  const [issues, communityMessages, docs, priorityIssuesSql, duplicateIssuesSql, releaseNotesSql] =
    await Promise.all([
      readJson<GitHubIssue[]>("data/github_issues.json"),
      readJson<CommunityMessage[]>("data/community_messages.json"),
      readJson<DocSection[]>("data/docs_index.json"),
      readText("coral/queries/priority_issues.sql"),
      readText("coral/queries/duplicate_issues.sql"),
      readText("coral/queries/release_notes.sql")
    ]);

  const rankedIssues = rankIssues(issues, communityMessages, docs);
  const brief = generateMaintainerBrief(rankedIssues);

  return {
    repo: {
      owner: "coral-hackathon",
      name: "issuecompass-demo",
      url: "https://github.com/coral-hackathon/issuecompass-demo"
    },
    sources: [
      {
        name: "GitHub issues / pull requests",
        connector: "github.issues + github.pull_requests",
        status: "Fixture-backed Coral connector",
        records: issues.length
      },
      {
        name: "Community messages",
        connector: "csv.community_messages",
        status: "CSV/JSON export loaded through Coral",
        records: communityMessages.length
      },
      {
        name: "Project docs index",
        connector: "docs.sections",
        status: "README/docs index learned by Coral",
        records: docs.length
      }
    ],
    learnedSchemas: [
      {
        source: "github.issues",
        joinKey: "number",
        learnedColumns: ["number", "title", "labels", "comments", "assignee", "state"]
      },
      {
        source: "csv.community_messages",
        joinKey: "issue_numbers[]",
        learnedColumns: ["source", "author", "text", "sentiment", "created_at"]
      },
      {
        source: "docs.sections",
        joinKey: "related_issue_numbers[]",
        learnedColumns: ["title", "path", "summary", "updated_at", "stale"]
      }
    ],
    cache: {
      status: "cache-hit",
      strategy: "Coral result cache with a local JSON fallback for hackathon demo reliability",
      ttl: "15 minutes",
      lastRefreshed: new Date().toISOString()
    },
    brief,
    sql: {
      priorityIssues: priorityIssuesSql,
      duplicateIssues: duplicateIssuesSql,
      releaseNotes: releaseNotesSql
    },
    rawCounts: {
      issues: issues.length,
      communityMessages: communityMessages.length,
      docs: docs.length
    }
  };
}
