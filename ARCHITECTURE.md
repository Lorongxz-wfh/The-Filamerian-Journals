# System Architecture Documentation (ARCHITECTURE.md)
## The Filamerian Journals — Technical Architecture & Infrastructure Blueprint
**System Version:** 1.0.0 (Production Architecture)  
**Classification:** Decoupled SPA Client & RESTful Backend Micro-Monolith  

---

## 1. High-Level Architecture Overview

```
[ Public Readers & University Staff ]
                 │
                 ▼ (HTTPS / TLS 1.3)
┌──────────────────────────────────────────────────────────┐
│              FRONTEND SINGLE-PAGE APP (SPA)              │
│  React 19 + TypeScript + Vite + Tailwind CSS + React-PDF │
│  Deployed on: Vercel Edge Network                        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼ (REST API / Bearer Auth)
┌──────────────────────────────────────────────────────────┐
│                 LARAVEL 11 RESTful API                   │
│  PHP 8.2 • Apache • Sanctum Auth • Spatie RBAC           │
│  Deployed on: Render Web Service (Docker Linux)          │
└──────────────┬─────────────────────────────┬─────────────┘
               │ (Direct Postgres / SSL)     │ (S3 REST API / HTTPS)
               ▼                             ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     NEON SERVERLESS PGSQL     │   │     CLOUDFLARE R2 BUCKET      │
│  Direct Connection (No Pooler)│   │  Journal PDFs, Covers, Assets │
│  Automated Atomic Migrations  │   │  S3 Compatible / Global CDN   │
└───────────────────────────────┘   └───────────────────────────────┘
```

---

## 2. Layered Directory & Domain Structure

```
The-Filamerian-Journals/
├── backend/                        # Laravel 11 Backend API Service
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # REST Controllers (Article, Journal, Auth, etc.)
│   │   │   ├── Middleware/        # RBAC, Approval & Rate Limiting Guards
│   │   │   └── Requests/          # Form Request Validation Handlers
│   │   ├── Models/                # Eloquent Models with SoftDeletes & Relationships
│   │   ├── Mail/                  # Mailable Classes (UserCreatedMail, etc.)
│   │   └── Services/              # ActivityLogger, FileStorageService
│   ├── config/                    # Sanctum, Database, Cors, Filesystems
│   ├── database/
│   │   ├── migrations/            # 38 Immutable PostgreSQL Migrations
│   │   └── seeders/               # Role, User, Category, Resource Seeders
│   ├── routes/
│   │   └── api.php                # Complete API Route Registry
│   ├── Dockerfile                 # Multi-stage Apache PHP 8.2 Container
│   └── render-start.sh            # Production Container Entrypoint & Migrations
│
├── frontend/                       # React 19 Client SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Navbar, Footer, DashboardLayout, PublicLayout
│   │   │   └── ui/                # Modal, Button, Table, Badges, SearchDropdown
│   │   ├── contexts/              # SettingsContext, ThemeContext
│   │   ├── hooks/                 # useDebounce, useSmartPolling, useMediaQuery
│   │   ├── pages/                 # Home, Journals, Articles, Search, About, Login
│   │   │   └── dashboard/         # MyJournals, Articles, UserManager, Logs, Settings
│   │   ├── services/
│   │   │   └── api.ts             # Axios Instance, Interceptors & Base URLs
│   │   └── index.css              # Tailwind v4 Theme Tokens & Typography
│   ├── package.json
│   └── vite.config.ts
```

---

## 3. Middleware & Request Pipeline

All incoming HTTP requests to the backend pass through an optimized execution pipeline:

```
[ Incoming Request ]
        │
        ▼
1. \Illuminate\Http\Middleware\HandleCors (Enforce Allowed Origin: Vercel)
        │
        ▼
2. \Illuminate\Foundation\Http\Middleware\ValidateCsrfTokens (Exempts /api/* for Bearer Auth)
        │
        ▼
3. Rate Limiting Throttles (throttle:login, throttle:5,1 for Password Reset)
        │
        ▼
4. auth:sanctum (Validates Bearer Token from Authorization Header)
        │
        ▼
5. EnsureUserIsApproved (Blocks unapproved accounts from accessing dashboard endpoints)
        │
        ▼
6. Spatie Role Middleware (role:Super Admin|Admin)
        │
        ▼
[ Controller Action Execution ]
```

---

## 4. Authentication & Token Lifecycle

1. **Login & Token Generation:** User submits credentials ➔ `AuthController::login` verifies bcrypt hash ➔ Generates plain text Sanctum token.
2. **Dual-Tier Token Security:**
   - **Tier 1 (Frontend Idle Guard):** `DashboardLayout.tsx` monitors mouse/keyboard interaction. After 60 minutes of inactivity, it purges tokens and redirects to `/login?expired=1`.
   - **Tier 2 (Server Expiration):** `config/sanctum.php` enforces `expiration => 1440` (24 Hours). Tokens older than 24 hours are rejected with `401 Unauthorized`.
3. **Global 401 Interceptor:** `api.ts` intercepts any `401` response from the backend, clears `localStorage`, and safely routes the user to the login screen.

---

## 5. Storage Engine & Cloudflare R2 Integration

- **PDF Manuscripts & Journal Covers** are streamed and stored in **Cloudflare R2 Object Storage** using the standard AWS S3 SDK integration (`FILESYSTEM_DISK=r2`).
- **Direct Stream / Public URLs:** Public asset requests are served either via direct R2 Public CDN URLs or streamed safely through `JournalController::servePdf` / `ArticleController::servePdf` with proper `Content-Type: application/pdf` headers.

---

## 6. Cross-Cutting Concerns

### 6.1 Error Logging & System Error Inspector
- Uncaught exceptions are intercepted by Laravel’s global exception handler in `bootstrap/app.php` and persisted to the `system_errors` table (`level`, `message`, `file`, `line`, `stack_trace`, `path`, `user_id`).
- Super Admins can review, inspect, and mark system errors as resolved via `/dashboard/health` without accessing server terminal logs.

### 6.2 Non-Blocking Background Operations
- Email notifications and credentials dispatch use Laravel 11's `defer()` helper to ensure user registration and article publishing return instant responses to the client while emails send asynchronously.
