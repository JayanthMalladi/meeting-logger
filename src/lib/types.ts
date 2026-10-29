export type Segment = { start: number; end: number; text: string };

export type Decision = { text: string; ts?: string };
export type Action = { text: string; owner?: string; due?: string; ts?: string };
export type Question = { text: string; ts?: string };

export type Extracted = {
  summary: string;
  decisions: Decision[];
  actions: Action[];
  openQuestions: Question[];
  atRisk: string[];
};

export type MeetingMeta = {
  title?: string;
  attendees?: string;
  kind?: string;
  source?: "recorded" | "uploaded";
};

export type Transcript = { text: string; segments: Segment[]; duration?: number };

export const KINDS = [
  "standup",
  "1:1",
  "planning",
  "design review",
  "customer call",
  "post-mortem",
  "sales call",
  "other",
];
