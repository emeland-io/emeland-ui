export type Severity = "high" | "medium" | "low";

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
};

export type ActiveView =
  | "findings"
  | "explorer"
  | "graph"
  | "sensors"
  | "classes"
  | "rules"
  | "users"
  | "settings";

export type UserRole = "admin" | "observer" | "viewer";

export type UserStatus = "active" | "disabled";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

/** Single relation pointer on a resource — clickable in the explorer. */
export type ModelRelation = {
  /** Label of the relation, e.g. "type", "parent", "consumes". */
  name: string;
  /** Resource type the target belongs to (used for nav + lookup). */
  targetType: string;
  /** ID of the target resource. */
  targetId: string;
  /** Cardinality hint — defaults to "one". */
  cardinality?: "one" | "many";
};

/** Generic landscape resource — used by the model explorer. */
export type ModelResource = {
  id: string;
  type: string;
  displayName: string;
  description?: string;
  /** Free-form scalar attributes shown in the detail pane. */
  attributes: Record<string, string>;
  relations: ModelRelation[];
};

/** A resource type definition — drives the left rail of the explorer. */
export type ModelResourceType = {
  id: string;
  displayName: string;
  description: string;
};

/** A node in the sensor/filter/injector subscriber graph. */
export type GraphNodeKind = "sensor" | "filter" | "injector";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  /** Logical NodeType, e.g. "git-sensor" or "structural-filter". */
  nodeType: string;
  displayName: string;
  /** Subscribers — node IDs this node publishes events to. */
  subscribers: string[];
};
