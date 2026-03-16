// ─── jobs_raw ────────────────────────────────────────────────────────────────
export interface JobRaw {
  id:           string;
  source:       string | null;
  external_id:  string | null;
  company:      string | null;
  title:        string | null;
  location:     string | null;
  remote:       string | null;
  url:          string;
  description:  string;
  posted_at:    string | null;
  content_hash: string | null;
  ingested_at:  string;
}

// ─── jobs_scored ─────────────────────────────────────────────────────────────
export type EvaluationPath  = 'reject_fast' | 'evaluate_but_ineligible' | 'evaluate';
export type Recommendation  = 'strong_match' | 'possible_match' | 'weak_match' | 'ineligible';
export type TechMismatch    = 'none' | 'some' | 'major';
export type SeniorityLevel  = 'junior' | 'mid' | 'senior' | 'lead_plus' | 'unknown';
export type InfraDepth      = 'none' | 'light' | 'heavy';

export interface JobScored {
  id:                  string;
  job_id:              string;
  role_category:       string;
  score:               number;
  experience_band:     string | null;
  remote_feasibility:  string | null;
  reasons:             string[] | null;
  red_flags:           string[] | null;
  blockers:            string[] | null;
  onsite_required:     boolean | null;
  visa_restriction:    boolean | null;
  salary_min_gbp:      number | null;
  salary_max_gbp:      number | null;
  tech_mismatch:       boolean | null;
  tech_mismatch_level: TechMismatch | null;
  seniority_level:     SeniorityLevel | null;
  infra_depth:         InfraDepth | null;
  salary_currency:     string | null;
  evaluation_path:     EvaluationPath | null;
  recommendation:      Recommendation | null;
  tier:                string;
  created_at:          string;
}
