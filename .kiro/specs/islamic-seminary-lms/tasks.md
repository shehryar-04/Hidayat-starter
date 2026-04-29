# Implementation Plan: Hidayat

## Overview

Incremental implementation of the Hidayat as a React + Supabase web application. Tasks are ordered to establish the foundation first (auth, config infrastructure, shared components), then build each academic module, and finally wire everything together with routing and navigation.

## Tasks

- [x] 1. Initialize project structure and Supabase schema
  - Scaffold a Vite + React + JSX project with the `src/` module structure defined in the design
  - Create all Supabase migration files for every table in the data model (profiles, students, scholars, config tables, all academic program tables, audit tables)
  - Enable Supabase Auth and configure the `profiles` table trigger to auto-insert a profile row on user sign-up
  - Write all RLS policies per the policy summary table in the design
  - Seed `feature_flags` with all 8 modules defaulting to `enabled = true`
  - _Requirements: 1.1, 1.2, 14.1, 14.3_

  - [ ]* 1.1 Write integration tests for RLS policies
    - Verify student sessions cannot read other students' rows
    - Verify scholar sessions are restricted to assigned students
    - Verify admin sessions have full read/write access
    - _Requirements: 1.3, 1.4, 14.1_

- [x] 2. Implement authentication and role loading
  - Implement sign-in / sign-out flows using Supabase Auth
  - Create `RoleProvider.jsx` that fetches the authenticated user's role from `profiles` on login and exposes it via React context
  - Protect all routes with a role guard that redirects unauthenticated users to the login page
  - _Requirements: 1.2, 1.6_

  - [ ]* 2.1 Write unit tests for RoleProvider
    - Test that role is correctly loaded from the profile record
    - Test that an unauthenticated state redirects to login
    - _Requirements: 1.2_

- [x] 3. Implement feature flag infrastructure
  - Create `FeatureFlagProvider.jsx` that fetches all rows from `feature_flags` on app init and exposes them via React context
  - Subscribe to Supabase Realtime on the `feature_flags` table and update context state within 60 seconds of any change
  - Gate all module routes and navigation items behind their corresponding flag
  - Implement redirect-to-dashboard behavior when a user navigates to a disabled module's URL
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.1 Write unit tests for FeatureFlagProvider
    - Test that disabled flags suppress navigation items
    - Test that a direct URL to a disabled module redirects to dashboard
    - _Requirements: 3.2, 3.4_

- [x] 4. Implement the DynamicForm shared component
  - Create `src/shared/DynamicForm/` that accepts a `FormSchema` object and renders all supported field types: text, number, date, select, multi-select, file upload, textarea, boolean toggle
  - Implement required-field validation that displays per-field error messages on submission
  - Implement `visibleWhen` conditional field logic that shows/hides fields in real time
  - Store the schema `version` alongside each submission payload
  - _Requirements: 2.2, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 4.1 Write unit tests for DynamicForm
    - Test each field type renders correctly from schema
    - Test required-field validation error messages
    - Test conditional field show/hide behavior
    - _Requirements: 2.4, 2.5, 2.7_

- [x] 5. Implement the ReportRenderer shared component
  - Create `src/shared/ReportRenderer/` that fetches a `ReportSchema` from `report_schemas`, calls the designated Edge Function for data, and renders the result
  - Support on-screen table, PDF export (using a PDF library), and CSV export output formats
  - Display the schema's `empty_state_message` when the query returns no rows
  - _Requirements: 13.2, 13.4, 13.5_

  - [ ]* 5.1 Write unit tests for ReportRenderer
    - Test table rendering with mock data
    - Test empty state message display
    - Test CSV export output format
    - _Requirements: 13.4, 13.5_

- [x] 6. Implement Edge Functions scaffold and security middleware
  - Create all 8 Edge Functions listed in the design with a shared middleware that: extracts and verifies the JWT, decodes the role claim, returns 401 on invalid/expired JWT, returns 403 on insufficient role
  - Implement the `edge_function_log` write in the shared middleware (caller user_id, function name, timestamp, success/failure)
  - _Requirements: 1.5, 14.2, 14.4, 14.5, 14.6_

  - [ ]* 6.1 Write integration tests for Edge Function auth middleware
    - Test 401 is returned for missing/expired JWT
    - Test 403 is returned for insufficient role
    - Test successful invocation logs to `edge_function_log`
    - _Requirements: 14.4, 14.5, 14.6_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Student Administration module
  - Create `src/modules/student-admin/` with student profile CRUD using DynamicForm for data entry
  - Implement student search filtered by name, enrollment number, program, academic level, and status; query must return within 2 seconds for up to 10,000 records (add appropriate DB indexes)
  - Implement student status change flow that writes to `student_status_history` on every change
  - Implement document attachment upload to Supabase Storage linked to the student profile
  - Wire bulk status update and program assignment to the `bulk-student-update` Edge Function
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 8.1 Write unit tests for student search and status change
    - Test search filters return correct subsets
    - Test status change writes a history record with actor and timestamp
    - _Requirements: 10.2, 10.4_

- [x] 9. Implement Scholar and Teacher Management module
  - Create `src/modules/scholar-admin/` with scholar profile CRUD
  - Implement scholar-to-subject and scholar-to-program assignment, recording assignment date and acting Admin
  - Implement scholar deactivation that sets `employment_status = 'inactive'` and flags all active student assignments linked to that scholar for Admin review
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 9.1 Write unit tests for scholar deactivation
    - Test that deactivation preserves historical records
    - Test that active student assignments are flagged after deactivation
    - _Requirements: 11.3, 11.4_

- [x] 10. Implement Dars-e-Nizami module
  - Create `src/modules/dars-e-nizami/` with views for curriculum levels, subject lists, and student enrollments
  - Implement evaluation recording form (Scholar records score per student per subject) that stores result linked to student, subject, level, and scholar; flag evaluations below the level's `passing_threshold`
  - Implement level-completion detection: when all subjects at a level have passing evaluations, mark the level complete and surface the student as eligible for promotion
  - Wire student promotion to the `promote-student` Edge Function, recording promotion date and authorizing scholar
  - Implement per-student transcript view listing completed levels, subjects, scores, and promotion dates
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 10.1 Write unit tests for evaluation flagging and level-completion logic
    - Test that a score below threshold sets `flagged = true`
    - Test that all-passing evaluations trigger level-complete eligibility
    - _Requirements: 4.4, 4.6_

- [x] 11. Implement Hifz Program module
  - Create `src/modules/hifz/` with a 30-Juz progress grid per student
  - Implement Juz status update (Scholar sets status to in_progress, memorized, or revised) that writes to `hifz_progress` and inserts a row into `hifz_audit_log` with old/new status, scholar, and timestamp
  - Implement auto-complete detection: when all 30 Juz reach `memorized` status, update the student's Hifz status to complete
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 11.1 Write unit tests for Hifz audit logging and auto-complete
    - Test that every status change writes a `hifz_audit_log` row with correct old/new values
    - Test that all-30-memorized triggers the complete status
    - _Requirements: 5.3, 5.5_

- [x] 12. Implement Nazra Program module
  - Create `src/modules/nazra/` with an ordered lesson list per student
  - Implement lesson completion recording (Scholar marks lesson complete with optional quality note) that writes to `nazra_progress`
  - Implement auto-complete detection: when all lessons are completed, update the student's Nazra status to complete
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 12.1 Write unit tests for Nazra completion logic
    - Test that completing all lessons triggers the complete status
    - Test that quality notes are persisted correctly
    - _Requirements: 6.3, 6.4_

- [x] 13. Implement Short Courses module
  - Create `src/modules/short-courses/` with course CRUD (Admin creates/edits courses with all required attributes)
  - Implement student enrollment flow that records enrollment, associates payment reference, and grants course access
  - Wire certificate generation to the `generate-certificate` Edge Function, passing student name and completion date into the course's certificate template
  - Implement enrollment count and revenue total views for Admin
  - Implement incomplete-enrollment detection: when a course's `end_date` passes and a student has not completed, mark enrollment as incomplete
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 13.1 Write unit tests for enrollment and completion logic
    - Test that enrollment records payment reference correctly
    - Test that past-end-date incomplete enrollments are marked correctly
    - _Requirements: 7.2, 7.5_

- [x] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement Darul Ifta module
  - Create `src/modules/darul-ifta/` with question submission form (any authenticated user), question list views per role, and fatwa response editor (Mufti)
  - Implement question submission that assigns a unique `reference_number` and sets status to `pending`
  - Wire question assignment to the `assign-fatwa` Edge Function (Admin/Mufti assigns to a Mufti, status → `assigned`, notification sent)
  - Implement Mufti response submission that records response text, mufti identity, timestamp, and sets status to `under_review`
  - Wire fatwa approval and publication to the `publish-fatwa` Edge Function (status → `approved` then `published`, with optional questioner anonymization)
  - Implement duplicate-question linking: Admin can link a question to an existing fatwa and close the new submission
  - Ensure every status transition writes a row to `fatwa_audit_log` with actor and timestamp
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 15.1 Write unit tests for fatwa workflow status transitions
    - Test each valid status transition writes to `fatwa_audit_log`
    - Test duplicate-linking closes the new submission correctly
    - _Requirements: 8.7, 8.8_

- [x] 16. Implement Research Center module
  - Create `src/modules/research-center/` with publication submission form (Scholar), publication list/search view, and admin approval workflow
  - Implement file attachment upload to Supabase Storage; store the storage path in `publications.file_path`
  - Implement publication approval (Admin sets status to `published`)
  - Implement repository search by title, author, publication type, and date range
  - Implement download count increment on each file download
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 16.1 Write unit tests for publication search and download count
    - Test search filters return correct subsets by each filter type
    - Test download count increments on each download event
    - _Requirements: 9.4, 9.6_

- [x] 17. Implement Wazifa module
  - Create `src/modules/wazifa/` with eligibility evaluation trigger (Admin) and disbursement report view
  - Wire eligibility evaluation to the `evaluate-wazifa` Edge Function, which reads the active `wazifa_rules` JSON, evaluates each student's academic record, and writes results to `wazifa_evaluations` with rule version and timestamp
  - Implement disbursement report using ReportRenderer, listing eligible students, stipend amounts, and qualifying rules
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 17.1 Write unit tests for wazifa eligibility evaluation
    - Test that rule version is recorded on each evaluation
    - Test that eligibility status change is recorded correctly
    - _Requirements: 12.2, 12.3_

- [x] 18. Implement Admin config management UI
  - Create admin screens for editing `form_schemas`, `report_schemas`, `feature_flags`, and `wazifa_rules` via the `config-update` Edge Function
  - Implement form schema version increment on every save
  - Ensure config changes are reflected to all users on next load without redeployment
  - _Requirements: 2.1, 2.3, 2.6, 3.1, 12.1, 12.4, 13.1, 13.3_

  - [ ]* 18.1 Write integration tests for config update flow
    - Test that saving a form schema increments the version
    - Test that a feature flag update propagates via Realtime within 60 seconds
    - _Requirements: 2.6, 3.3_

- [x] 19. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Wire router with feature-flag gating and finalize navigation
  - Update `src/app/router.jsx` to include all module routes, each wrapped in the feature-flag guard
  - Implement the main navigation sidebar/menu that renders only enabled modules based on the current feature flags and user role
  - Verify redirect-to-dashboard behavior for disabled module URLs end-to-end
  - _Requirements: 3.2, 3.4, 1.6_

- [x] 21. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical milestones
- Unit and integration tests validate specific examples and edge cases
- The design has no Correctness Properties section, so property-based tests are not applicable for this feature
