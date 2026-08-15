# Coding Standards & Architecture Rules (RULES.md)
## The Filamerian Journals — Engineering Standards, Conventions & Best Practices
**Applies to:** Full Codebase (Frontend React 19 / Backend Laravel 11 / Database PostgreSQL)

---

## 1. Naming Conventions

### 1.1 Frontend (React / TypeScript)
- **Component Files:** PascalCase (e.g. `ArticleCard.tsx`, `DashboardLayout.tsx`, `ConfirmDialog.tsx`).
- **Hook Files:** camelCase prefixed with `use` (e.g. `useSmartPolling.ts`, `useDebounce.ts`).
- **Utility / Service Files:** camelCase (e.g. `api.ts`, `utils.ts`).
- **TypeScript Interfaces / Types:** PascalCase (e.g. `Article`, `User`, `CategoryQuickViewProps`).
- **Constants / Tokens:** UPPER_SNAKE_CASE for global constants (e.g. `API_BASE_URL`, `STORAGE_URL`).

### 1.2 Backend (Laravel / PHP)
- **Controllers:** PascalCase suffixed with `Controller` (e.g. `ArticleController.php`, `AuthController.php`).
- **Models:** Singular PascalCase (e.g. `Article.php`, `Journal.php`, `SystemError.php`).
- **Migrations:** Timestamped snake_case (e.g. `2026_07_20_173340_create_categories_table.php`).
- **Methods:** camelCase (e.g. `getDownloadUrl()`, `toggleStatus()`, `servePdf()`).
- **Database Tables & Columns:** snake_case (e.g. `articles`, `first_name`, `is_approved`, `views_count`).

---

## 2. Architecture & Design Principles

### 2.1 SOLID & Clean Architecture
- **Single Responsibility:** Controllers handle HTTP transport; Business logic and complex queries belong in dedicated Services or Eloquent query scopes.
- **Open/Closed:** Use Spatie permissions and role middleware rather than hardcoded role string checks inside controller methods.
- **Dependency Inversion:** Use Laravel's service container and constructor/method injection for mailers and services.

### 2.2 DRY (Don't Repeat Yourself) & KISS (Keep It Simple, Stupid)
- **Reusable UI Components:** Extract common UI patterns (Modals, Badges, Tables, Skeletons) into `src/components/ui/` rather than duplicating HTML/Tailwind classes across pages.
- **Consistent Response Structures:** Backend endpoints must return standardized JSON payloads (`{ data: ..., message: ... }`).

---

## 3. Frontend & TypeScript Standards

1. **Strict Type Safety:**
   - Avoid `any` types wherever possible. Declare explicit TypeScript interfaces for all API response payloads.
   - Use Zod schemas (`zodResolver`) for all form validation to guarantee compile-time and runtime type alignment.
2. **State Management & Data Fetching:**
   - Prefer React Context for global app states (`SettingsContext`, `ThemeContext`).
   - Use debouncing on user inputs (`useDebounce`) to prevent spamming search and filter endpoints.
3. **Hardware-Accelerated Micro-Animations:**
   - Use CSS transitions or Framer Motion with hardware-accelerated transforms (`transform`, `opacity`). Never animate expensive layout properties like `height`, `width`, or `margin`.

---

## 4. Backend & Database Standards

1. **SQL Injection Prevention:**
   - ALWAYS use Eloquent query builder or PDO parameter bindings (`?`).
   - NEVER interpolate raw string variables into `DB::raw()` or `whereRaw()` statements.
2. **Safe Schema Migrations for PostgreSQL:**
   - Set `public $withinTransaction = false;` on migrations that alter existing table schemas or inspect columns to avoid PostgreSQL `25P02: In failed sql transaction` errors.
   - Check column existence via `Schema::hasColumn()` before issuing `ALTER TABLE` statements.
3. **Graceful Error Handling & Fallbacks:**
   - Always wrap third-party API calls (e.g. email sending, R2 storage) in `try-catch` blocks to prevent single-service hiccups from crashing user transactions.

---

## 5. Deployment & Git Workflow Rules

All repository commits and branch pushes must adhere to the following flag rules:

### Branch Push Target Flags:
- **`--dev` / `--Dev`**: Push changes to `dev` branch ONLY.
- **`--staging` / `--Staging`**: Push changes to `dev` ➔ merge and push to `staging`.
- **`--prod` / `--Prod` / `--main`**: Push changes to `dev` ➔ `staging` ➔ `main` (Production).
- **`--dont` / `--nopush` / (No flag specified)**: Build and commit locally, but DO NOT push to remote.

### Commit Message Convention:
Follow the Conventional Commits format:
- `feat(scope): ...` for new features.
- `fix(scope): ...` for bug fixes.
- `refactor(scope): ...` for architectural improvements without functionality changes.
- `security(scope): ...` for authentication and security enhancements.
- `docs(scope): ...` for documentation updates.
