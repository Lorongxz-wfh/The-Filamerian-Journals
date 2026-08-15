# Design System Documentation (DESIGN.md)
## The Filamerian Journals — Visual Identity, Tokens & UI/UX Standards
**Institution:** Filamer Christian University  
**Design Philosophy:** Academic Prestige, Editorial Legibility & High-Density Utility  

---

## 1. Brand Identity & Art Direction
The visual identity of **The Filamerian Journals** reflects the heritage, academic prestige, and dignity of Filamer Christian University. It avoids fleeting SaaS trends, flashy gradients, and generic "AI slop" in favor of an **authoritative, editorial print aesthetic**.

### Core Visual Tenets:
1. **Academic Dignity:** Deep university navy balanced with gold accents and crisp paper-white surfaces.
2. **Typographic Hierarchy:** Classical serif display typography for journal headers coupled with high-legibility geometric sans-serif for UI density.
3. **Structured Clarity:** Crisp, subtle border dividers (`#d4d4d4`), structured tables, and compact data-dense metadata badges.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Theme Color Tokens (Tailwind CSS v4 & CSS Variables)

```css
:root {
  /* Brand Palette */
  --primary: #002d72;      /* Deep Filamer Navy Blue */
  --secondary: #fdb515;    /* Filamer Academic Gold / Ochre */
  
  /* Surface & Base */
  --background: #ffffff;   /* Pure White */
  --surface: #f8f8f7;      /* Warm Architectural Paper White */
  --foreground: #1a1a1a;   /* Deep Charcoal Body Text */
  
  /* Borders & Muted */
  --border: #d4d4d4;       /* Subtle Architectural Border */
  --muted: #6b7280;        /* Neutral Slate Secondary Text */
}

/* Dark Mode Theme Tokens */
.dark {
  --primary: #60a5fa;      /* Readable Light Navy/Blue */
  --secondary: #fdb515;    /* Retained Gold */
  --background: #0f172a;   /* Slate 900 */
  --surface: #1e293b;      /* Slate 800 */
  --foreground: #f1f5f9;   /* Crisp Slate 100 */
  --border: #334155;       /* Slate 700 */
  --muted: #94a3b8;        /* Slate 400 */
}
```

### 2.2 Semantic Color Mapping

| Token Name | Hex Value | Intended Purpose |
| :--- | :--- | :--- |
| `primary` | `#002d72` | Header bars, primary action buttons, key university titles, active sidebar accents |
| `secondary` | `#fdb515` | Gold insignia, hover highlights, active badges, bookmark indicators |
| `background` | `#ffffff` | Primary application viewport canvas |
| `surface` | `#f8f8f7` | Table rows, card backings, modal containers, dropdown panels |
| `border` | `#d4d4d4` | Fine line dividers, table borders, input field outlines |
| `muted` | `#6b7280` | Subtitles, helper text, timestamps, DOI identifiers |

---

## 3. Typography Scale & Font Stack

The typography system is constrained to **3 specialized font families**:

```css
--font-display: "Cinzel", serif;
--font-sans: "Plus Jakarta Sans", sans-serif;
--font-mono: "Geist Mono", monospace;
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ CINZEL (SERIF)                                                         │
│ Usage: Page H1/H2 Headings, University Wordmarks, Publication Titles   │
│ Rule: Regular/Medium weight ONLY (Never overly bolded)                 │
├────────────────────────────────────────────────────────────────────────┤
│ PLUS JAKARTA SANS (SANS-SERIF)                                         │
│ Usage: Article Abstracts, UI Labels, Dashboard Tables, Body Text       │
│ Rule: Optimal line-height (1.6) for dense academic reading             │
├────────────────────────────────────────────────────────────────────────┤
│ GEIST MONO (MONOSPACE)                                                 │
│ Usage: DOIs, Volume/Issue Numbers, ISSNs, Dates, System Health Logs    │
│ Rule: Tabular numbers enabled for perfect numeric alignment            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Spacing, Grid & Layout System

- **Max Container Width:** `max-w-[1536px]` (`.container-custom`) with responsive horizontal padding (`px-6 lg:px-12`).
- **Sharp Geometry:** Minimal border radius values to mirror print publications:
  - `radius-sm`: `2px` (Badges, small tags)
  - `radius-md`: `4px` (Inputs, buttons, table containers)
  - `radius-lg`: `6px` (Modal windows, preview cards)
- **Spacing Scale:** Standard 4px grid (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px).

---

## 5. Component Design Standards

### 5.1 Dashboard Tables
- Hover row state: `hover:bg-primary/5 cursor-pointer transition-colors duration-150`.
- Dense, tabular data presentation with monospace tracking for dates and volume IDs.
- Fixed header rows with subtle borders.

### 5.2 Modals & Quick-View Slide-Overs
- Modals appear with a backdrop overlay (`bg-black/50 backdrop-blur-xs`).
- Smooth entry animation (`opacity-100 scale-100` via Framer Motion / CSS transitions).
- Structured information architecture with tabs for Metadata, Abstract, Authors, and PDF Preview.

### 5.3 Loading & Skeleton States
- Isolated loading spinners are banned in favor of structured animated pulse skeletons (`animate-pulse`) matching the exact wireframe geometry of loading cards and tables.

---

## 6. Prohibited Anti-Patterns (Banned UI Tropes)
- ❌ **No Gradient Keyword Fills:** Text headers must use solid, high-contrast typography.
- ❌ **No Purple-on-Dark Aesthetics:** No violet/neon glows on dark theme backgrounds.
- ❌ **No Over-Nested Cards:** Cards nested inside cards nested inside cards are strictly disallowed.
- ❌ **No Arbitrary Radii:** Maintain sharp, uniform architectural corner radiuses (2px–6px).
