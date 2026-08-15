# Product Requirements Document (PRD)
## The Filamerian Journals — Official Academic Repository & Journal Management System
**Institution:** Filamer Christian University, Inc. (Roxas City, Capiz, Philippines)  
**System Classification:** Institutional Digital Repository & Peer-Reviewed Publishing CMS  
**Document Status:** Production Baseline (v1.0.0)

---

## 1. Executive Summary
**The Filamerian Journals** is the official digital institutional repository and academic journal management system of Filamer Christian University (FCU). The platform provides a centralized, open-access digital infrastructure for publishing, archiving, discovering, and disseminating scholarly research produced by FCU faculty, graduate students, undergraduate scholars, and affiliated research institutes.

The system bridges public open-access dissemination with an enterprise-grade administrative publishing workflow, allowing editorial boards and university administrators to manage journals, issues, volumes, and peer-reviewed articles with strict academic metadata integrity.

---

## 2. Problem Statement & Motivation
Prior to this system, academic research outputs across FCU’s academic departments encountered several operational challenges:
1. **Fragmented Research Archives:** Theses, capstones, and institutional research papers were stored in physical print or dispersed across isolated digital drives without uniform cataloging.
2. **Limited Global Visibility:** Lack of an indexing-ready, web-accessible repository limited the citation reach and digital presence of university research.
3. **Manual Editorial Workflows:** Journal issue compilation, volume indexing, author affiliation tracking, and metadata curation were performed manually without structured relational validation.
4. **Data Preservation & Compliance:** Accreditation bodies (such as PAASCU, PACUCOA, and CHED) require standardized digital repositories with verifiable archival policies, persistent access, and comprehensive institutional audit trails.

---

## 3. Core Goals & Objectives
- **Centralized Scholarly Index:** Establish a unified digital repository hosting all university journals, organized cleanly by academic discipline.
- **Strict Hierarchical Cataloging:** Implement a structured relational hierarchy: `Academic Category` ➔ `Journal` ➔ `Volume` ➔ `Article` ➔ `Author` & `Keyword`.
- **Frictionless Open Access:** Provide public readers with fast search, keyword filtering, PDF reading, direct download streaming, and citation generation.
- **Enterprise Publishing Dashboard:** Equip university administrators and editorial staff with granular role-based access control (RBAC) to curate, edit, bulk-import, and archive research without touching raw database records.
- **Institutional Governance & Audit Trails:** Log all administrative activities, user modifications, and entity lifecycles to maintain complete compliance transparency.

---

## 4. Target Users & Personas

| User Persona | Role / Context | Primary Goals & Activities |
| :--- | :--- | :--- |
| **Public Researcher / Student** | Unauthenticated Public Visitor | Searches keywords, filters by discipline, views abstracts and citation metadata, reads PDF manuscripts online, and downloads full-text research. |
| **Editorial Staff / Admin** | Departmental Editor / Journal Manager | Curates journal metadata, organizes volumes/issues, publishes articles, registers structured author profiles, and manages announcements. |
| **Super Administrator** | University IT & Research Office Director | Manages staff accounts, controls site-wide maintenance and institutional settings, configures footer navigation, inspects system errors, and monitors activity audit logs. |

---

## 5. Live Production Feature Specifications (Current MVP)

### 5.1 Public Portal Experience
- **Hero & Repository Discovery:** Displays live repository statistics (Total Academic Journals, Published Papers, Research Fields), university bulletin announcements, and recent article highlights.
- **Global & Live Dynamic Search:** Search bar supporting full-text query matching across article titles, abstracts, author names, DOIs, and keywords with debounced auto-complete dropdown.
- **Category & Discipline Exploration:** Filter journals by academic departments (Undergraduate, Graduate School, Institutional, Multidisciplinary).
- **Journal & Volume Explorer:** Dedicated journal landing pages showcasing editorial boards, publication frequency, ISSN, aims/scope, and volume/issue archives.
- **Article Reader & Citation Hub:** Article view displaying full abstract, structured author affiliations, citation export, related articles, PDF stream viewer, and direct download counter.
- **Feedback & Inquiry Channel:** Rate-limited public feedback submission modal with category tags and administrative notification routing.
- **Institutional Knowledge Hub:** Dynamic About and Policy pages rendering university policies, open-access statements, submission guidelines, and FAQs.

### 5.2 Secure Portal Authentication & Governance
- **Role-Based Access Control (RBAC):** Powered by Spatie Laravel-Permission with strict `Super Admin` and `Admin` role tiers.
- **2-Tier Token Security:** 
  - *Tier 1 (Inactivity Guard):* Client-side 60-minute idle auto-logout.
  - *Tier 2 (Server Expiration):* 24-hour server-side Sanctum token invalidation.
- **Account Verification & Approval Guard:** Multi-stage activation requiring verified email and administrative approval prior to dashboard access.
- **Rate-Limited Authentication:** Protection against credential brute-forcing via IP-throttled login and password recovery endpoints.

### 5.3 Administrative Publishing Dashboard
- **Overview & Analytics Hub:** Real-time metrics tracking total published articles, journal volume counts, author rosters, view trends, and storage health.
- **Journal & Volume Management:** CRUD interface for journals, custom cover image uploads, PDF volume attachments, category assignment, and volume/issue sorting.
- **Article Publishing CMS:** Article authoring suite supporting rich-text abstracts, structured name attributes, keyword tagging, PDF file attachment, DOI allocation, and publication status toggles (`Published`, `Draft`, `Archived`).
- **Structured Author Directory:** Registry tracking researchers' first name, middle name, last name, suffix, institutional affiliation, email, and ORCID identifier.
- **Bulk Excel/CSV Importer:** Spreadsheet parser for batch-uploading research articles and legacy journal catalogs with instant error validation.
- **Two-Stage Trash Bin (Soft Deletes):** Accidental deletion safeguard supporting individual/batch restoration, audit preservation, and 30-day automatic purge.
- **Activity Audit Logging:** Immutable system log recording every login attempt, article modification, deletion, and configuration update with user IDs and timestamps.
- **System Error Inspector:** Automated exception capture recording backend error traces, endpoint URLs, and client-side JavaScript crashes with resolution status toggles.
- **Dynamic Institutional Settings:** Web-based control panel to update university contact info, campus address, social media links, site maintenance mode, and multi-column footer navigation.

---

## 6. Technology Stack & Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATION LAYER                 │
│  React 19 • TypeScript 6 • Vite 8 • Tailwind CSS 4 • Zod    │
│  Hosted on Vercel Edge Network (the-filamerian-journals)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST API (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES LAYER                  │
│  Laravel 11 • PHP 8.2 • Apache • Sanctum • Spatie RBAC      │
│  Hosted on Render Web Service (Docker Container)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────┐
│     DATABASE ENGINE LAYER     │   │   OBJECT STORAGE LAYER    │
│  Neon Serverless PostgreSQL   │   │  Cloudflare R2 (S3-API)   │
│  Direct Connection (Auto SSL) │   │  PDFs, Covers, Assets     │
└───────────────────────────────┘   └───────────────────────────┘
```

---

## 7. Quality & Compliance Criteria
- **Zero Data Loss:** Soft deletes enabled across all core scholarly tables (`journals`, `volumes`, `articles`, `users`).
- **Academic Citation Compatibility:** Article metadata structured to support standard APA, MLA, and Chicago format generation.
- **High-Resolution Reading Experience:** Crisp in-browser PDF rendering with responsive mobile zoom and pagination.
- **Performance Budget:** Sub-second page transition times powered by Vite code-splitting and cached public settings endpoints.
