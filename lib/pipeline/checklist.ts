// Single source of the review checklist; .github/pull_request_template.md must match (tested).
export const CHECKLIST: readonly string[] = [
  "Functional and non-functional requirements stated.",
  "Scale estimate present with numbers.",
  "Bottleneck named explicitly.",
  "At least one trade-off with both sides.",
  "At least one failure mode or lesson from failure.",
  "Every number has a source reference.",
  "For a small team is specific, not a platitude.",
  "Subject check: Lessons is about them, For a small team is about you.",
  "Nothing paraphrased so closely it reproduces the original.",
  "Same diagram count and shape across locales.",
];
