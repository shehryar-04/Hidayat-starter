# Product: Hidayat

A comprehensive digital ecosystem for managing an Islamic educational institution. The platform is **backend-config driven** — forms, reports, module availability, and eligibility rules are stored as JSON in the database and consumed at runtime, allowing reconfiguration without redeployment.

## Core Modules

- **Dars-e-Nizami** — Multi-year Islamic curriculum with levels, subjects, evaluations, and student promotion
- **Hifz Program** — Quran memorization tracking across 30 Juz with revision cycles
- **Nazra Program** — Quran recitation lesson-by-lesson progress tracking
- **Short Courses** — Time-bounded certified courses with enrollment, payment, and certificate generation
- **Darul Ifta** — Fatwa management workflow (question submission → Mufti assignment → review → publication)
- **Research Center** — Academic publication submission, approval, and searchable repository
- **Wazifa** — Stipend eligibility evaluation driven by configurable JSON rules
- **Student Administration** — Full student lifecycle management (admission → graduation)
- **Scholar Administration** — Faculty profiles, subject/program assignments

## User Roles

- **Admin** — Full system access; manages config, roles, feature flags, and bulk operations
- **Scholar** — Records evaluations, tracks Hifz/Nazra progress, submits publications
- **Mufti** — Scholar with authority to respond to and approve fatwas
- **Student** — Read-only access to own records

## Deployment Targets

- React web application (browser)
- Electron desktop client (same React app + offline capabilities)
