

export interface DenseComparisonSchemaData {
  readonly title: string;
  readonly metric: string;
  readonly left: string | number;
  readonly right: string | number;
  readonly delta: string | number;
  readonly selected?: string;
}
export interface HierarchySchemaData {
  readonly root: string;
  readonly nodes: readonly string[];
  readonly selected: string;
  readonly parent?: string;
  readonly depth?: string | number;
  readonly expanded?: string;
}
export interface ExplorationListSchemaData {
  readonly title: string;
  readonly facet: string;
  readonly items: readonly string[];
  readonly selected: string;
  readonly preview?: string;
}
export interface TemporalDependencySchemaData {
  readonly title: string;
  readonly events: readonly string[];
  readonly dependency: string;
  readonly selected?: string;
  readonly dependsOn?: string;
}
export interface StandardSectionSpec {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly description?: string;
}
