# Requirements Document

## Introduction

The Hidayat is a comprehensive digital ecosystem for managing an Islamic educational institution. It covers structured multi-year academic programs (Dars-e-Nizami), Quran memorization and recitation programs (Hifz & Nazra), short certified courses, a Darul Ifta (fatwa management) system, an academic research center, and full institutional administration. The system is backend-config driven, meaning forms, reports, modules, and UI behavior are controlled from the database rather than hardcoded in the frontend. The system is deployed as a **React web application** (browser-based), backed by **Supabase**: PostgreSQL for relational data, Row-Level Security (RLS) for per-role data isolation, Supabase Auth for identity, Supabase Storage for file attachments, and Supabase Edge Functions for privileged server-side operations.

---

## Glossary

- **System**: The Hidayat platform as a whole.
- **Admin**: A privileged institutional user who configures the system, manages roles, and controls feature flags.
- **Scholar**: A teacher or faculty member who delivers instruction, evaluates students, and participates in academic workflows.
- **Mufti**: A Scholar with authority to issue fatwas within the Darul Ifta module.
- **Student**: An enrolled learner in any program offered by the institution.
- **Dars-e-Nizami**: A traditional multi-year Islamic curriculum structured across defined academic levels.
- **Hifz Program**: A Quran memorization program tracked by Juz (chapter) completion.
- **Nazra Program**: A Quran recitation/reading program tracked by lesson progress.
- **Darul Ifta**: The fatwa management module where religious questions are received, assigned, reviewed, and published.
- **Fatwa**: A formal religious ruling issued by a Mufti in response to a submitted question.
- **Research Center**: The module managing academic publications, research papers, and scholarly work.
- **Wazifa**: A stipend or financial eligibility benefit assigned to qualifying students.
- **Config Table**: A Supabase database table that stores JSON-based configuration controlling system behavior, form schemas, report schemas, and feature flags.
- **Feature Flag**: A boolean or conditional value stored in a Config Table that enables or disables a system module or UI feature at runtime.
- **Dynamic Form**: A form whose fields, validation rules, and layout are defined by a JSON schema stored in a Config Table rather than hardcoded in the frontend.
- **Edge Function**: A Supabase serverless function that executes secure, privileged database operations on behalf of authenticated users.
- **RLS**: Row-Level Security — PostgreSQL policies enforced by Supabase that restrict data access per authenticated user role.
- **Enrollment**: The act of associating a Student with a specific program and academic level.
- **Juz**: One of the 30 sections of the Quran, used as a progress unit in the Hifz Program.
- **Short Course**: A time-bounded, certified course offered independently of the Dars-e-Nizami curriculum.
- **Publication**: An academic paper, book, or research output managed by the Research Center.

---

## Requirements

### Requirement 1: Role-Based Access Control

**User Story:** As an Admin, I want to assign roles to users and enforce access boundaries, so that each user only sees and operates on data relevant to their role.

#### Acceptance Criteria

1. THE System SHALL support the following roles: Admin, Scholar, Mufti, and Student.
2. WHEN a user authenticates, THE System SHALL load that user's role from the database and apply the corresponding RLS policies for all subsequent data operations.
3. WHILE a Student session is active, THE System SHALL restrict data access to records belonging to that Student only.
4. WHILE a Scholar session is active, THE System SHALL restrict data access to students, courses, and evaluations assigned to that Scholar.
5. WHEN an operation requires elevated privileges (e.g., bulk updates, config changes, cross-student data access), THE System SHALL route that operation through an Edge Function that validates the caller's role before executing.
6. IF a user attempts to access a resource outside their role's permissions, THEN THE System SHALL return an authorization error and log the attempt.
7. THE Admin SHALL be the only role authorized to modify Config Tables, Feature Flags, and role assignments.

---

### Requirement 2: Backend-Config Driven Dynamic Forms

**User Story:** As an Admin, I want to define and modify form schemas from the backend, so that student forms, admission forms, and other data entry screens can be updated without redeploying the application.

#### Acceptance Criteria

1. THE System SHALL store all form schemas as JSON documents in a Config Table named `form_schemas`.
2. WHEN the frontend loads a form, THE System SHALL fetch the corresponding JSON schema from `form_schemas` and render the form fields, validation rules, and layout from that schema.
3. WHEN an Admin updates a form schema in `form_schemas`, THE System SHALL reflect the updated form to all users on their next form load without requiring a frontend redeployment.
4. THE Dynamic Form renderer SHALL support field types including: text, number, date, select (single), multi-select, file upload, textarea, and boolean toggle.
5. IF a required field defined in the schema is left empty on submission, THEN THE System SHALL display a validation error message specific to that field.
6. THE System SHALL version form schemas so that historical submissions are associated with the schema version active at the time of submission.
7. WHERE a form schema defines conditional fields (fields that appear based on another field's value), THE Dynamic Form renderer SHALL show or hide those fields in real time as the user interacts with the form.

---

### Requirement 3: Feature Flag Module Control

**User Story:** As an Admin, I want to enable or disable system modules from the backend, so that the institution can control which features are active without redeploying the application.

#### Acceptance Criteria

1. THE System SHALL store module availability as Feature Flags in a Config Table named `feature_flags`.
2. WHEN the frontend initializes, THE System SHALL fetch all Feature Flags and suppress navigation, routes, and UI components for any module whose flag is set to disabled.
3. WHEN an Admin updates a Feature Flag, THE System SHALL apply the change to all active sessions within 60 seconds without requiring a page reload.
4. IF a user navigates directly to a URL for a disabled module, THEN THE System SHALL redirect the user to the dashboard and display an informational message.
5. THE System SHALL support Feature Flags for the following modules: Dars-e-Nizami, Hifz Program, Nazra Program, Short Courses, Darul Ifta, Research Center, Wazifa, and Student Reports.

---

### Requirement 4: Dars-e-Nizami Program Management

**User Story:** As an Admin or Scholar, I want to manage the multi-year Dars-e-Nizami curriculum, so that students can be enrolled, tracked, and evaluated across structured academic levels.

#### Acceptance Criteria

1. THE System SHALL model the Dars-e-Nizami curriculum as a sequence of named academic levels, each containing one or more subjects.
2. WHEN a Student is enrolled in the Dars-e-Nizami program, THE System SHALL assign the Student to a specific academic level and record the enrollment date.
3. WHEN a Scholar records an evaluation for a Student in a subject, THE System SHALL store the result linked to the Student, subject, academic level, and Scholar.
4. WHEN a Student completes all subjects at their current academic level with passing evaluations, THE System SHALL mark the level as complete and make the Student eligible for promotion to the next level.
5. THE System SHALL allow an Admin or Scholar to promote a Student to the next academic level, recording the promotion date and the Scholar who authorized it.
6. IF a Student's evaluation result falls below the passing threshold defined for that subject, THEN THE System SHALL flag the Student for remedial review.
7. THE System SHALL generate a per-student academic transcript that lists all completed levels, subjects, evaluation results, and promotion dates.

---

### Requirement 5: Hifz Program Management

**User Story:** As a Scholar, I want to track a student's Quran memorization progress by Juz, so that the institution has an accurate record of each student's Hifz completion.

#### Acceptance Criteria

1. THE System SHALL model Hifz progress as a sequence of 30 Juz, each with a status of: not started, in progress, memorized, or revised.
2. WHEN a Scholar marks a Juz as memorized for a Student, THE System SHALL record the Juz number, the date, and the Scholar's identity.
3. WHEN all 30 Juz are marked as memorized for a Student, THE System SHALL automatically update the Student's Hifz status to complete.
4. THE System SHALL track revision cycles separately from initial memorization, allowing a Scholar to record revision passes per Juz.
5. IF a Student's Hifz record is modified, THEN THE System SHALL log the previous value, the new value, the modifying Scholar, and the timestamp.

---

### Requirement 6: Nazra Program Management

**User Story:** As a Scholar, I want to track a student's Quran recitation progress lesson by lesson, so that the institution can monitor reading fluency development.

#### Acceptance Criteria

1. THE System SHALL model Nazra progress as an ordered sequence of lessons defined by the Admin in a Config Table.
2. WHEN a Scholar marks a lesson as complete for a Student, THE System SHALL record the lesson identifier, completion date, and Scholar identity.
3. WHEN a Student completes all lessons in the Nazra sequence, THE System SHALL update the Student's Nazra status to complete.
4. THE System SHALL allow a Scholar to add a qualitative note per lesson completion describing the Student's recitation quality.

---

### Requirement 7: Short Course Management

**User Story:** As an Admin, I want to create and manage short certified courses, so that the institution can offer revenue-generating programs independently of the main curriculum.

#### Acceptance Criteria

1. THE System SHALL allow an Admin to create a Short Course with the following attributes: title, description, duration, fee, assigned Scholar(s), start date, end date, and certificate template.
2. WHEN a Student enrolls in a Short Course, THE System SHALL record the enrollment, associate the payment record, and grant the Student access to the course materials.
3. WHEN a Student meets the completion criteria defined for a Short Course, THE System SHALL generate a certificate using the course's certificate template populated with the Student's name and completion date.
4. THE System SHALL track Short Course enrollment counts and revenue totals, accessible to the Admin.
5. IF a Short Course's end date passes and a Student has not met the completion criteria, THEN THE System SHALL mark the Student's enrollment as incomplete and notify the assigned Scholar.

---

### Requirement 8: Darul Ifta — Fatwa Management

**User Story:** As a Mufti, I want to receive, process, and publish fatwas through a structured workflow, so that religious questions are handled with proper scholarly oversight.

#### Acceptance Criteria

1. THE System SHALL allow any authenticated user to submit a religious question through the Darul Ifta module, providing a question text and optional supporting context.
2. WHEN a question is submitted, THE System SHALL assign it a unique reference number and set its status to pending.
3. WHEN an Admin or senior Mufti assigns a question to a Mufti, THE System SHALL notify the assigned Mufti and update the question status to assigned.
4. WHEN a Mufti submits a fatwa response, THE System SHALL record the response text, the Mufti's identity, and the submission timestamp, and set the status to under review.
5. WHEN a senior Mufti or Admin approves a fatwa, THE System SHALL set the status to approved and make the fatwa available for publication.
6. THE System SHALL allow an Admin to publish an approved fatwa to a public or internal fatwa repository, with the option to anonymize the questioner's identity.
7. IF a submitted question is determined to be a duplicate of an existing fatwa, THEN THE System SHALL allow the Admin to link the question to the existing fatwa and close the new submission.
8. THE System SHALL maintain a full audit trail of all status transitions for each fatwa question, recording the actor and timestamp for each transition.

---

### Requirement 9: Research Center — Publication Management

**User Story:** As a Scholar, I want to submit and manage academic publications, so that the institution can maintain a searchable repository of scholarly work.

#### Acceptance Criteria

1. THE System SHALL allow a Scholar to submit a Publication with the following attributes: title, abstract, authors, publication type (paper, book, article), file attachment, and submission date.
2. WHEN a Publication is submitted, THE System SHALL set its status to under review and notify the Admin.
3. WHEN an Admin approves a Publication, THE System SHALL set its status to published and make it available in the research repository.
4. THE System SHALL allow any authenticated user to search the research repository by title, author, publication type, and date range.
5. IF a Scholar submits a Publication with a file attachment, THEN THE System SHALL store the file in Supabase Storage and associate the storage reference with the Publication record.
6. THE System SHALL track download counts for each published Publication.

---

### Requirement 10: Student Administration

**User Story:** As an Admin, I want to manage the full student lifecycle from admission through graduation, so that all student records are centralized and accurate.

#### Acceptance Criteria

1. THE System SHALL maintain a student profile containing: full name, date of birth, gender, contact information, guardian information, enrollment date, program(s), current academic level, and status (active, suspended, graduated, withdrawn).
2. WHEN a student's status changes, THE System SHALL record the previous status, new status, the Admin who made the change, and the timestamp.
3. THE System SHALL allow an Admin to attach documents to a student profile (e.g., admission forms, certificates) stored in Supabase Storage.
4. WHEN an Admin searches for students, THE System SHALL return results filtered by name, enrollment number, program, academic level, or status within 2 seconds for a dataset of up to 10,000 student records.
5. THE System SHALL support bulk operations (status update, program assignment) on selected student records, executed via an Edge Function to enforce authorization.

---

### Requirement 11: Scholar and Teacher Management

**User Story:** As an Admin, I want to manage scholar and teacher profiles and their assignments, so that the institution has a clear record of faculty and their responsibilities.

#### Acceptance Criteria

1. THE System SHALL maintain a Scholar profile containing: full name, qualifications, specializations, assigned programs, assigned subjects, contact information, and employment status.
2. WHEN a Scholar is assigned to a subject or program, THE System SHALL record the assignment date and the Admin who made the assignment.
3. THE System SHALL allow an Admin to deactivate a Scholar, which removes the Scholar from active assignment lists but preserves all historical records.
4. WHEN a Scholar is deactivated, THE System SHALL reassign or flag all active student assignments linked to that Scholar for Admin review.

---

### Requirement 12: Wazifa (Stipend) Management

**User Story:** As an Admin, I want to define and apply wazifa eligibility rules from the backend, so that stipend calculations can be updated without redeploying the application.

#### Acceptance Criteria

1. THE System SHALL store wazifa eligibility rules as JSON documents in a Config Table named `wazifa_rules`.
2. WHEN the System evaluates a Student's wazifa eligibility, THE System SHALL apply the rules defined in `wazifa_rules` against the Student's current academic record, attendance, and program status.
3. WHEN a Student's eligibility status changes based on rule evaluation, THE System SHALL record the change, the rule version applied, and the evaluation timestamp.
4. THE System SHALL allow an Admin to update `wazifa_rules` without redeploying the application, with the updated rules taking effect on the next eligibility evaluation cycle.
5. THE System SHALL generate a wazifa disbursement report listing all eligible students, their stipend amounts, and the rules that qualified them.

---

### Requirement 13: Schema-Driven Reports

**User Story:** As an Admin, I want to define report structures from the backend, so that institutional reports can be modified without redeploying the application.

#### Acceptance Criteria

1. THE System SHALL store report schemas as JSON documents in a Config Table named `report_schemas`.
2. WHEN a user requests a report, THE System SHALL fetch the corresponding schema from `report_schemas`, execute the defined data query, and render the output according to the schema's layout definition.
3. WHEN an Admin updates a report schema, THE System SHALL apply the updated structure to all subsequent report generations without requiring a frontend redeployment.
4. THE System SHALL support report output formats of: on-screen table, PDF export, and CSV export.
5. IF a report query returns no data, THEN THE System SHALL display an empty state message defined in the report schema rather than an error.

---

### Requirement 14: Supabase Security Architecture

**User Story:** As an Admin, I want all data operations to be secured through RLS and Edge Functions, so that no client-side code can bypass authorization rules.

#### Acceptance Criteria

1. THE System SHALL enforce RLS policies on all database tables such that direct client queries are restricted to data the authenticated user is authorized to access.
2. WHEN a privileged operation is required (cross-role data access, bulk mutations, config updates), THE System SHALL execute that operation exclusively through an Edge Function that re-validates the caller's JWT and role before proceeding.
3. THE System SHALL never expose service-role Supabase credentials to the frontend client.
4. WHEN an Edge Function receives a request, THE System SHALL validate the Authorization header contains a valid Supabase JWT before executing any database operation.
5. IF an Edge Function receives an invalid or expired JWT, THEN THE System SHALL return a 401 Unauthorized response without executing any database operation.
6. THE System SHALL log all Edge Function invocations with the caller's user ID, the operation type, and the timestamp for audit purposes.
