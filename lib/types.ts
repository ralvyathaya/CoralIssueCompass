export type IssueKind = "issue" | "pull_request";
export type IssueState = "open" | "closed";
export type Sentiment = "blocked" | "negative" | "neutral" | "positive";
export type Priority = "Critical" | "High" | "Medium" | "Low";
export type SourceKey = "github" | "community" | "docs";

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: IssueState;
  type: IssueKind;
  labels: string[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  assignee: string | null;
  url: string;
  body: string;
}

export interface CommunityMessage {
  id: string;
  source: "Discord" | "GitHub Discussions" | "Slack" | "Forum";
  author: string;
  text: string;
  createdAt: string;
  issueNumbers: number[];
  sentiment: Sentiment;
}

export interface DocSection {
  id: string;
  title: string;
  path: string;
  summary: string;
  updatedAt: string;
  relatedIssueNumbers: number[];
  stale: boolean;
}

export interface RankedIssue {
  issue: GitHubIssue;
  score: number;
  priority: Priority;
  matchedMessages: CommunityMessage[];
  matchedDocs: DocSection[];
  reasons: string[];
  suggestedAction: string;
  draftReply: string;
}

export interface MaintainerBrief {
  generatedAt: string;
  summary: string;
  recommendedFocus: string;
  reasoning: string[];
  rankedIssues: RankedIssue[];
  nextBestActions: string[];
}

export interface ConnectedSource {
  id: SourceKey;
  name: string;
  connector: string;
  status: string;
  records: number;
}

export interface LearnedSchema {
  source: string;
  joinKey: string;
  learnedColumns: string[];
}

export interface CoralCacheInfo {
  status: "cache-hit" | "cache-miss";
  strategy: string;
  ttl: string;
  lastRefreshed: string;
}

export interface AnalysisResult {
  repo: {
    owner: string;
    name: string;
    url: string;
  };
  sources: ConnectedSource[];
  learnedSchemas: LearnedSchema[];
  cache: CoralCacheInfo;
  brief: MaintainerBrief;
  sql: {
    priorityIssues: string;
    duplicateIssues: string;
    releaseNotes: string;
  };
  rawCounts: {
    issues: number;
    communityMessages: number;
    docs: number;
  };
  sourceData: {
    issues: GitHubIssue[];
    communityMessages: CommunityMessage[];
    docs: DocSection[];
  };
}
