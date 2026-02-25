// ─── jobs_raw ────────────────────────────────────────────────────────────────
export interface JobRaw {
  id: string;
  source: string | null;
  external_id: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  remote: string | null;
  url: string;
  description: string;
  posted_at: string | null;
  content_hash: string;
  ingested_at: string;
}

// ─── jobs_scored ─────────────────────────────────────────────────────────────
export interface JobScored {
  id: string;
  job_id: string;
  role_category: string;
  score: number;
  experience_band: string | null;
  remote_feasibility: string | null;
  reasons: string[] | null;       // jsonb — array of reason strings
  red_flags: string[] | null;     // jsonb — array of flag strings
  created_at: string;
}

// ─── job_actions ─────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'new'
  | 'notified'
  | 'shortlisted'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'ghosted'
  | 'archived';

export interface JobAction {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  notes: string | null;
  updated_at: string;
}

// ─── job_assets ──────────────────────────────────────────────────────────────
export interface CvEmphasis {
  lead_project: string;
  highlight_skills: string[];
  talking_points: string[];
}

export interface JobAsset {
  id: string;
  job_id: string;
  intro_paragraph: string | null;
  cover_letter: string | null;
  cv_emphasis: CvEmphasis | null;  // jsonb
  created_at: string;
}
