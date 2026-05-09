// Database types and constants for the Hidayat
// These correspond to the Supabase schema tables

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SCHOLAR: 'scholar',
  MUFTI: 'mufti',
  STUDENT: 'student',
}

// Student statuses
export const STUDENT_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  GRADUATED: 'graduated',
  WITHDRAWN: 'withdrawn',
}

// Employment statuses
export const EMPLOYMENT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

// Hifz statuses
export const HIFZ_STATUSES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  MEMORIZED: 'memorized',
  REVISED: 'revised',
}

// Fatwa statuses
export const FATWA_STATUSES = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  CLOSED: 'closed',
}

// Publication types
export const PUBLICATION_TYPES = {
  PAPER: 'paper',
  BOOK: 'book',
  ARTICLE: 'article',
}

// Publication statuses
export const PUBLICATION_STATUSES = {
  UNDER_REVIEW: 'under_review',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
}

// Feature flag modules
export const FEATURE_FLAG_MODULES = {
  DARS_E_NIZAMI: 'dars_e_nizami',
  HIFZ: 'hifz',
  NAZRA: 'nazra',
  SHORT_COURSES: 'short_courses',
  DARUL_IFTA: 'darul_ifta',
  RESEARCH_CENTER: 'research_center',
  WAZIFA: 'wazifa',
  STUDENT_REPORTS: 'student_reports',
}
