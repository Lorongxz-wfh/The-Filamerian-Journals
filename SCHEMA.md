# Database & API Schema Documentation (SCHEMA.md)
## The Filamerian Journals — Relational Data Blueprint & Endpoint Contract Registry
**Database Engine:** PostgreSQL 16 (Neon Serverless)  
**Schema Status:** 38 Migrations Applied (Production Baseline)  

---

## 1. Entity-Relationship (ER) Hierarchy

```
┌─────────────────┐
│   CATEGORIES    │ (e.g. Undergraduate, Graduate School, Institutional, Multidisciplinary)
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│    JOURNALS     │ (ISSN, Scope, Editorial Board, Frequency, Status, SoftDeletes)
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│     VOLUMES     │ (Volume Number, Issue Number, Year, Title, SoftDeletes)
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐       N:M       ┌─────────────────┐
│    ARTICLES     ├─────────────────┤     AUTHORS     │
│ (Title, Abstract│ (article_author)│(Name, Affiliation│
│  DOI, PDF, Views│                 │ Email, ORCID)   │
│  SoftDeletes)   ├─────────────────┼─────────────────┤
└────────┬────────┘ (article_keyword)│    KEYWORDS     │
         │                          └─────────────────┘
         │ 1:N
         ▼
┌─────────────────┐
│ ARTICLE_METRICS │ (Views, Downloads, Timestamps)
└─────────────────┘
```

---

## 2. Core Database Tables & Column Definitions

### 2.1 `users` Table
| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | Primary Key | Unique user identifier |
| `name` | `VARCHAR(255)` | Not Null | Computed full formatted name |
| `first_name` | `VARCHAR(100)` | Nullable | Given name |
| `middle_name` | `VARCHAR(100)` | Nullable | Middle name |
| `last_name` | `VARCHAR(100)` | Nullable | Surname |
| `suffix` | `VARCHAR(20)` | Nullable | Name suffix (Jr., III, Ph.D.) |
| `email` | `VARCHAR(255)` | Unique, Not Null | Institutional email |
| `password` | `VARCHAR(255)` | Not Null | Bcrypt hashed password |
| `is_approved` | `BOOLEAN` | Default `false` | Administrator approval flag |
| `is_disabled` | `BOOLEAN` | Default `false` | Account active/disabled status |
| `disabled_at` | `TIMESTAMP` | Nullable | Timestamp when account was disabled |
| `email_verified_at`| `TIMESTAMP` | Nullable | Email verification timestamp |
| `deleted_at` | `TIMESTAMP` | Nullable | Soft delete timestamp |
| `created_at` / `updated_at` | `TIMESTAMP` | Nullable | Standard timestamps |

---

### 2.2 `journals` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `BIGSERIAL` | Primary Key |
| `category_id` | `BIGINT` | Foreign key referencing `categories(id)` |
| `title` | `VARCHAR(255)` | Full journal title |
| `slug` | `VARCHAR(255)` | URL-friendly slug (Unique) |
| `issn` | `VARCHAR(50)` | International Standard Serial Number |
| `e_issn` | `VARCHAR(50)` | Electronic ISSN |
| `description` | `TEXT` | Aims, scope, and editorial overview |
| `frequency` | `VARCHAR(100)` | Publication schedule (e.g. Biannual, Annual) |
| `cover_path` | `VARCHAR(255)` | R2 storage path for journal cover |
| `status` | `VARCHAR(50)` | `Published`, `Draft`, or `Archived` |
| `deleted_at` | `TIMESTAMP` | Soft delete timestamp |

---

### 2.3 `volumes` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `BIGSERIAL` | Primary Key |
| `journal_id` | `BIGINT` | Foreign key referencing `journals(id)` |
| `volume_number`| `INT` | Volume numerical index |
| `issue_number` | `INT` | Issue number within volume |
| `year` | `INT` | Year of publication |
| `title` | `VARCHAR(255)` | Special issue title or theme |
| `cover_path` | `VARCHAR(255)` | Issue cover asset |
| `deleted_at` | `TIMESTAMP` | Soft delete timestamp |

---

### 2.4 `articles` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `BIGSERIAL` | Primary Key |
| `volume_id` | `BIGINT` | Foreign key referencing `volumes(id)` |
| `title` | `VARCHAR(500)` | Article research title |
| `slug` | `VARCHAR(500)` | URL slug |
| `abstract` | `TEXT` | Complete manuscript abstract |
| `doi` | `VARCHAR(255)` | Digital Object Identifier |
| `pdf_path` | `VARCHAR(255)` | Cloudflare R2 file path to PDF |
| `order` | `INT` | Display order in journal volume |
| `views_count` | `BIGINT` | Cumulative view counter |
| `downloads_count`| `BIGINT` | Cumulative download counter |
| `status` | `VARCHAR(50)` | `Published`, `Draft`, `Archived` |
| `published_at`| `DATE` | Official date of publication |
| `deleted_at` | `TIMESTAMP` | Soft delete timestamp |

---

### 2.5 `authors` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `BIGSERIAL` | Primary Key |
| `name` | `VARCHAR(255)` | Computed display name |
| `first_name` / `last_name` | `VARCHAR(100)` | Structured author names |
| `email` | `VARCHAR(255)` | Author correspondence email |
| `affiliation` | `VARCHAR(255)` | Institutional affiliation (e.g. Dept. of Computer Science, FCU) |
| `orcid` | `VARCHAR(50)` | ORCID academic identifier |

---

## 3. Complete API Endpoint Contract Registry

### 3.1 Public Exploration Routes (No Authentication Required)
- `GET /api/public/search?q={query}` — Multi-entity full-text search.
- `GET /api/public/categories` — List active academic categories.
- `GET /api/public/journals` — List all published journals with categories.
- `GET /api/public/journals/{journal:slug}` — Detailed journal metadata and volumes.
- `GET /api/public/journals/{journal}/pdf` — Stream complete journal issue PDF.
- `GET /api/public/articles/latest` — Retrieve recently published research papers.
- `GET /api/public/articles/{article:slug}` — Full article details, authors, citations, and abstract.
- `GET /api/public/articles/{article}/pdf` — Stream article full-text PDF manuscript.
- `POST /api/public/articles/{article}/view` — Increment view metric counter.
- `GET /api/public/resources` — Retrieve institutional policies and guidelines.
- `GET /api/public/settings` — Public site settings (contact info, footer columns).
- `POST /api/public/feedbacks` — Submit public feedback or inquiry (`throttle:1,3`).

---

### 3.2 Authentication & User Lifecycle Routes
- `POST /api/login` — Authenticate and receive Sanctum Bearer Token (`throttle:login`).
- `POST /api/forgot-password` — Request password reset email link.
- `POST /api/reset-password` — Update password with verified reset token.
- `GET /api/me` — Return authenticated user profile and roles (Bearer Auth).
- `PUT /api/profile` — Update user profile details.
- `PUT /api/change-password` — Update user account password.
- `POST /api/logout` — Revoke active Bearer token.

---

### 3.3 Administrative Publishing & System Routes (`role:Super Admin|Admin`)
- `GET/POST /api/journals` — List and create academic journals.
- `PUT/DELETE /api/journals/{id}` — Update or soft-delete journal.
- `GET/POST /api/volumes` — List and create volume issues.
- `POST /api/volumes/{volume}/reorder` — Reorder articles within a volume issue.
- `GET/POST /api/articles` — List and publish research articles.
- `POST /api/imports/articles` — Bulk Excel/CSV article batch importer.
- `GET /api/trash` — Browse soft-deleted entities across the repository.
- `POST /api/trash/{type}/{id}/restore` — Restore soft-deleted entity.
- `GET /api/system/health` — Check server memory, disk, and database health.
- `GET /api/system/errors` — Browse captured runtime system errors.
- `GET /api/dashboard/logs` — Immutable activity audit logs.
