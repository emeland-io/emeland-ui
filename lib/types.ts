export type Severity = "high" | "medium" | "low";

export type FindingState = "open" | "acknowledged" | "snoozed" | "resolved";

export type FindingType = {
  id: string;
  displayName: string;
  description: string;
  severity: Severity;
};

export type Sensor = {
  id: string;
  kind: "git-sensor" | "k8s-sensor" | "file-sensor";
  label: string;
  lastSeen: string;
  status: "healthy" | "degraded";
};

export type Context = {
  id: string;
  displayName: string;
  typeRef: string;
};

export type FindingResource = {
  resourceId: string;
  resourceType: string;
  displayName: string;
  reference?: string;
};

export type Annotation = { key: string; value: string };

export type Finding = {
  findingId: string;
  typeKind: string;
  summary: string;
  description?: string;
  firstSeen: string;
  lastSeen: string;
  count: number;
  resources: FindingResource[];
  annotations: Annotation[];
  contextId: string;
  sensor: string;
  state: FindingState;
  ackedBy?: string;
  ackedAt?: string;
  snoozedUntil?: string;
  snoozedBy?: string;
  resolvedAt?: string;
  resolvedReason?: string;
};

export type Theme = "dark" | "light" | "paper" | "amber";
export type Density = "comfortable" | "dense";
export type Layout = "split" | "full-detail";
export type GroupBy = "none" | "kind" | "context" | "sensor";

export type Tweaks = {
  theme: Theme;
  density: Density;
  layout: Layout;
  groupBy: GroupBy;
  showResolved: boolean;
};

export type LocalNote = { by: string; at: string; text: string };

export type LocalState = {
  overrides: Record<string, Partial<Finding>>;
  notes: Record<string, LocalNote[]>;
  tickets: Record<string, string>;
};

export type ModalKind = "resolve" | "assign" | "link";

export type ActiveView =
  | "inbox"
  | "acknowledged"
  | "snoozed"
  | "resolved"
  | "explorer"
  | "sensors"
  | "classes"
  | "rules"
  | "settings";
