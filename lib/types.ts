export type UserRole = 'owner' | 'contractor'
export type ReportStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
}

export interface Project {
  id: string
  name: string
  address: string | null
  owner_id: string
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: UserRole
  created_at: string
  profiles?: Profile
}

export interface Category {
  id: string
  project_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface DailyReport {
  id: string
  project_id: string
  category_id: string
  reported_by: string
  report_date: string
  worker_count: number
  work_description: string
  progress_note: string | null
  status: ReportStatus
  created_at: string
  updated_at: string
  categories?: Category
  profiles?: Profile
  report_attachments?: ReportAttachment[]
}

export interface ReportAttachment {
  id: string
  report_id: string
  file_url: string
  file_name: string
  file_type: string | null
  created_at: string
}
