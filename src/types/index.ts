// src/types/index.ts

// ============================================================
// Workspace
// ============================================================
export interface Workspace {
  id: string;
  name: string;
  chipType: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  rounds: IngestRound[];
  projectCount: number;
}

export interface WorkspaceCreateInput {
  name: string;
  chipType: string;
  description?: string;
}

// ============================================================
// Project
// ============================================================
export interface Project {
  name: string;
  path: string;
  fileCount: number;
  uploadedAt: string;
  classification?: FileClassification;
}

export interface FileClassification {
  sourceFiles: ClassifiedFile[];
  testPlans: ClassifiedFile[];
  datasheets: ClassifiedFile[];
  schematics: ClassifiedFile[];
  buildMetadata: ClassifiedFile[];
  compiledArtifacts: ClassifiedFile[];
  otherFiles: ClassifiedFile[];
  missingTypes: MissingFileType[];
}

export interface ClassifiedFile {
  relativePath: string;
  category: FileCategory;
  priority: "high" | "medium" | "low";
  sizeBytes: number;
}

export type FileCategory =
  | "source"
  | "test_plan"
  | "datasheet"
  | "schematic"
  | "build_metadata"
  | "compiled_artifact"
  | "pin_definition"
  | "config"
  | "other";

export interface MissingFileType {
  type: "test_plan" | "datasheet" | "schematic";
  message: string;
}

// ============================================================
// Ingest
// ============================================================
export interface IngestRound {
  roundNumber: number;
  startedAt: string;
  completedAt?: string;
  status: IngestStatus;
  projects: string[];
  questionCount: number;
  answeredCount: number;
}

export type IngestStatus =
  | "classifying"
  | "loading_context"
  | "extracting"
  | "analyzing"
  | "generating_questions"
  | "awaiting_answers"
  | "assembling_kb"
  | "completed"
  | "failed";

export interface IngestProgress {
  status: IngestStatus;
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  projectProgress?: {
    current: number;
    total: number;
    currentProject: string;
  };
  error?: string;
}

// ============================================================
// Entity Maps (intermediate, per-project)
// ============================================================
export interface EntityMap {
  projectName: string;
  extractedAt: string;
  entities: {
    test_flow: EntityInstance[];
    test_instance: EntityInstance[];
    timing: EntityInstance[];
    levels: EntityInstance[];
    pattern: EntityInstance[];
    bin: EntityInstance[];
    limit: EntityInstance[];
    measurement_setup: EntityInstance[];
    special_handling: EntityInstance[];
    spec_item: EntityInstance[];
    coverage_intent: EntityInstance[];
  };
}

export interface EntityInstance {
  id: string;
  entityType: string;
  summary: string;
  sourceFile: string;
  sourceLines?: string;
  rawEvidence: string;
  attributes: Record<string, unknown>;
}

// ============================================================
// Cross-Project Analysis
// ============================================================
export interface CrossProjectAnalysis {
  patterns: AnalysisPattern[];
  differences: AnalysisDifference[];
  gaps: AnalysisGap[];
}

export interface AnalysisPattern {
  id: string;
  entityType: string;
  description: string;
  occurrences: { project: string; evidence: string }[];
  confidence: "high" | "medium" | "low";
}

export interface AnalysisDifference {
  id: string;
  entityType: string;
  description: string;
  variants: { project: string; behavior: string }[];
}

export interface AnalysisGap {
  id: string;
  entityType: string;
  description: string;
  affectedProjects: string[];
}

// ============================================================
// Questions
// ============================================================
export interface Question {
  id: string;
  roundNumber: number;
  category: QuestionCategory;
  group: string;
  priority: number;
  title: string;
  background: string;
  options: QuestionOption[];
  answer?: QuestionAnswer;
  relatedEntities: string[];
  sourceAnchors: SourceAnchor[];
}

export type QuestionCategory =
  | "mismatch"
  | "gap"
  | "depth"
  | "conflict";

export interface QuestionOption {
  label: string;
  description: string;
}

export interface QuestionAnswer {
  selectedOption: number | null;
  customText?: string;
  answeredAt: string;
}

export interface SourceAnchor {
  project: string;
  file: string;
  lines?: string;
  excerpt: string;
}

// ============================================================
// Knowledge Base
// ============================================================
export interface KBMeta {
  workspaceId: string;
  chipType: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  sourceProjects: string[];
  stats: {
    knowledgeCount: number;
    knowhowCount: number;
    openQuestions: number;
  };
}

export interface KBEntry {
  id: string;
  type: "knowledge" | "knowhow";
  title: string;
  summary: string;
  context: string;
  triggerConditions?: string;
  action: string;
  scope: KBScope;
  evidence: KBEvidence[];
  sourceAnchors: SourceAnchor[];
  relatedItems: string[];
  openQuestions: string[];
  reviewNotes: string[];
  reviewStatus: "draft" | "confirmed" | "revised";
  createdAt: string;
  updatedAt: string;
  version: number;
  dialogueHistory: DialogueEntry[];
}

export interface KBScope {
  chipType: string;
  domain?: string;
  universal: boolean;
}

export interface KBEvidence {
  project: string;
  description: string;
  sourceFile?: string;
  rawExcerpt?: string;
}

export interface DialogueEntry {
  round: number;
  questionId: string;
  question: string;
  answer: string;
}

export interface KBGraph {
  nodes: KBGraphNode[];
  edges: KBGraphEdge[];
}

export interface KBGraphNode {
  id: string;
  type: "knowledge" | "knowhow";
  title: string;
  group: string;
}

export interface KBGraphEdge {
  source: string;
  target: string;
  relationship: string;
}

// ============================================================
// Diff Analysis (incremental ingest)
// ============================================================
export interface DiffReport {
  newEntries: DiffEntry[];
  strengthened: DiffEntry[];
  refined: DiffEntry[];
  conflicts: DiffEntry[];
}

export interface DiffEntry {
  type: "new" | "strengthen" | "refine" | "conflict";
  existingEntryId?: string;
  description: string;
  evidence: KBEvidence[];
  suggestedAction: string;
}

// ============================================================
// Reference Shelf
// ============================================================
export interface ReferenceDoc {
  name: string;
  filename: string;
  sizeBytes: number;
  uploadedAt: string;
}
