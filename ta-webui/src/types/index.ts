export { ApiError, type FieldError } from "./errors.ts";

export interface HealthResponse {
  status: string;
  service?: string;
  uptimeSeconds?: number;
}

export type DatabaseReadiness = "up" | "down" | "not_configured";

export interface ReadinessResponse {
  status: "ready" | "not_ready";
  checks?: {
    database?: DatabaseReadiness;
  };
}

export type Role = "learner" | "admin";

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
}

export interface Session {
  id: string;
}

export interface TutorContext {
  courseId: string | null;
  unitId: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface MessageReply {
  message: ChatMessage;
  teaching_action?: string | null;
}

export type CourseStatus = "draft" | "verified" | "published";

export type TreeNodeKind = "course" | "chapter" | "section" | "unit";

export interface CourseTreeNode {
  id: string;
  title: string;
  kind: TreeNodeKind;
  children: CourseTreeNode[];
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  status: CourseStatus;
  unit_count: number;
  progress: number;
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  status: CourseStatus;
  tree: CourseTreeNode[];
}

export type ResourceType = "ppt" | "video";

export interface ResourceRef {
  resource_id: string;
  title: string;
  type: ResourceType;
  locator?: string | null;
}

export interface UnitDetail {
  id: string;
  title: string;
  content_md: string;
  prerequisites: string[];
  successors: string[];
  resources: ResourceRef[];
}

export type UnitStatus = "not_started" | "in_progress" | "completed";

export interface UnitProgress {
  unit_id: string;
  title: string;
  status: UnitStatus;
  last_activity_at?: string | null;
}

export interface CourseProgress {
  course_id: string;
  title: string;
  percent: number;
  completed_units: number;
  total_units: number;
  last_activity_at?: string | null;
  units: UnitProgress[];
}

export interface MasteryScore {
  label: string;
  score: number;
}

export interface RecentActivity {
  title: string;
  detail: string;
  when: string;
}

export type ResourceStatus = "imported" | "parsing" | "ready" | "failed";

export type Genre = "讲解" | "例题" | "习题" | "参考" | "其他";

export interface Fragment {
  id: string;
  text: string;
  locator?: string | null;
  genre: Genre;
}

export interface ResourceSummary {
  id: string;
  title: string;
  type: ResourceType;
  status: ResourceStatus;
  size_bytes: number;
  created_at: string;
}

export interface ResourceDetail extends ResourceSummary {
  fragments: Fragment[];
  parse_error?: string | null;
}

export type ToolSideEffect = "read" | "external" | "paid";

export interface ToolInfo {
  name: string;
  description: string;
  side_effect: ToolSideEffect;
  timeout_ms: number;
}

export interface PromptInfo {
  version: string;
  description: string;
}

export interface Transcript {
  text: string;
}
