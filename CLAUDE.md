# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RSIP Application Gallery** is a real-world robotics application showcase designed to help users understand what features they need to configure for their own robot applications. It is NOT a robot catalog - it's an educational resource aligned with the RSIP platform taxonomy.

### Core Purpose
> "Show users real-world examples of robot applications to help them understand what features and configurations they need for their own use cases."

### Components
1. **Crawler Service** (`/crawler/`) - Python service that crawls multiple sources (company websites, YouTube, LinkedIn, X, news) and classifies content according to RSIP taxonomy
2. **Frontend App** (`/frontend/`) - React/TypeScript standalone app for browsing applications by scene type, task, and functional requirements
3. **Database Migrations** (`/supabase/migrations/`) - SQL migrations for Supabase (shared with RSIP)

## Commands

### Crawler (Python)
```bash
cd crawler/

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python src/main.py                    # Run crawler
python src/main.py --sources youtube  # YouTube only
python src/main.py --sources news     # News only
pytest tests/                         # Run tests
docker build -t crawler .             # Build Docker image
```

### Frontend (React/TypeScript)
```bash
cd frontend/

npm install
npm run dev                     # Development server (port 5174)
npm run build                   # Production build
npm run build:vite-only         # Build without type check
npm run type-check              # TypeScript check only
```

## RSIP-Aligned Taxonomy

Content is organized by RSIP platform concepts, NOT by robot brand:

### Application Categories (Primary)
- `industrial_automation` - Factory, warehouse, manufacturing
- `service_robotics` - Hospitality, healthcare, delivery
- `surveillance_security` - Patrol, monitoring, access control

### Task Types (Secondary)
- Industrial: `transportation`, `inspection`, `manipulation`, `palletizing`, `welding`, `assembly`
- Service: `delivery_service`, `human_interaction`, `healthcare_assist`, `cleaning`
- Security: `perimeter_patrol`, `threat_detection`, `access_monitoring`

### Functional Requirements (Tags)
74 RSIP-defined requirements including:
- Navigation: `autonomous_navigation`, `obstacle_avoidance`, `precision_positioning`
- Manipulation: `pick_and_place`, `bin_picking_3d`, `kitting_sorting`
- Service: `indoor_delivery`, `hri_multimodal`, `telepresence`

### Scene Types
`warehouse`, `manufacturing`, `retail`, `hospital`, `office`, `hotel`, `outdoor`, `laboratory`

## Database

### Migration Location
`/supabase/migrations/085_application_gallery.sql`

**To apply:** Run the SQL in Supabase Dashboard. This creates:
- `application_gallery` - Main content table with RSIP-aligned classification
- `gallery_suggestions` - User-submitted content
- `gallery_crawler_runs` - Crawler execution history

### Migration Rules (from RSIP)
- Always use `::uuid` casting for UUID columns in SQL
- Never migrate directly - create migration files and apply via Supabase Dashboard
- Keep numbering aligned with RSIP (currently at 085)

## Content Sources

Priority order:
1. **Company websites** - Case studies, press releases (highest reliability)
2. **Industry news** - The Robot Report, IEEE Spectrum, TechCrunch
3. **YouTube** - Official company channels
4. **Social media** - LinkedIn, X/Twitter company accounts

Content types: Videos, Photos, Articles, Case Studies

## RSIP Integration

Deep linking from RSIP platform:
```
/browse?category=industrial_automation&tasks=transportation&requirements=autonomous_navigation
```

Context-aware "View Examples" buttons in RSIP that filter gallery based on user's current configuration.

## Environment Variables

Credentials at `/Users/xwang/Homedevelopment/RSIP/Vercel_env/.env.local`:

### Crawler
```bash
SUPABASE_URL=https://wbtrtckvwtlxfnadrvzo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=     # From Vercel_env
YOUTUBE_API_KEY=               # From Vercel_env
GOOGLE_AI_API_KEY=             # Use GEMINI_API_KEY from Vercel_env
```

### Frontend
```bash
VITE_SUPABASE_URL=https://wbtrtckvwtlxfnadrvzo.supabase.co
VITE_SUPABASE_ANON_KEY=        # From Vercel_env
```

**Critical**: Frontend uses `import.meta.env.VITE_*`, never `process.env`.

## Project Structure

```
Video_Library/
├── CLAUDE.md                           # This file
├── EXPERT_TEAM_PROPOSAL_V2.md          # Design proposal
├── VIDEO_LIBRARY_HANDOFF.md            # Original handoff doc
├── crawler/                            # Python crawler service
│   ├── src/
│   │   ├── main.py                     # Entry point
│   │   ├── config.py                   # Configuration
│   │   ├── crawlers/
│   │   │   ├── youtube_crawler.py      # YouTube API integration
│   │   │   └── news_crawler.py         # RSS feed aggregation
│   │   ├── processors/
│   │   │   └── ai_classifier.py        # Gemini classification
│   │   └── storage/
│   │       └── supabase_client.py      # Database operations
│   ├── config/
│   │   └── sources.yaml                # Crawl targets
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                           # React/TypeScript app
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── GalleryPage.tsx
│   │   │   ├── GalleryCard.tsx
│   │   │   └── GalleryDetailModal.tsx
│   │   ├── services/
│   │   │   └── gallery-service.ts
│   │   └── types/
│   │       └── gallery.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── supabase/
    └── migrations/
        └── 085_application_gallery.sql
```

## Key Design Principles

1. **Application-centric, not robot-centric** - Organize by what robots DO, not what they ARE
2. **RSIP taxonomy alignment** - Use exact RSIP category/task/requirement keys
3. **Educational purpose** - Help users understand configuration options
4. **Multi-source aggregation** - Company sites, news, YouTube, social media
5. **Quality over quantity** - Moderation required before public display

---

## 🚨 MANDATORY DEVELOPMENT RULES

### Database Migration Rules

**⚠️ Agents DO NOT have permission to migrate database directly**

1. **CREATE** migration SQL files in `supabase/migrations/` directory
2. **DOCUMENT** the migration purpose and changes in the file header
3. **INFORM** the user to apply the migration manually via Supabase dashboard
4. **NEVER** attempt to run migrations directly via code or CLI

**Migration File Naming Convention:**
- Format: `XXX_description_of_change.sql` (e.g., `088_dmca_requests.sql`)
- Increment the number sequentially from the last migration
- Current highest: 088

**UUID Casting in SQL:**
```sql
-- ❌ WRONG - Will cause "column is of type uuid but expression is of type text" error
UPDATE table_name SET uuid_column = 'string-value';

-- ✅ CORRECT - Always cast strings to UUID
UPDATE table_name SET uuid_column = 'string-value'::uuid;
```

### Environment Variable Rules

**MANDATORY**: Use a single `.env` file. Never use `.env.local` or other variants.

```bash
# Frontend variables MUST use VITE_ prefix
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# Backend/scripts can use regular env vars
SUPABASE_SERVICE_ROLE_KEY=...
```

**Critical Rule**: Never use `process.env` in frontend code - use `import.meta.env.VITE_*` instead.

### Component Development Rules

1. **Verify component usage** before modifying:
   ```bash
   grep -r "ComponentName" src/
   grep -r "import.*ComponentName" src/
   ```
2. **Follow existing patterns** - Match the code style of neighboring files
3. **Check database schema** before debugging - Compare database columns vs what code expects

### Build & Testing Commands

```bash
npm run type-check              # TypeScript validation (run before commits)
npm run build:vite-only         # Quick build without TypeScript check
npm run build                   # Full production build
npm run dev                     # Development server (port 5174)
```

**Debug builds** (preserves env vars):
```bash
npm run build:vite-only -- --mode development
```

### Troubleshooting

**Blank page in browser:**
- Check for `process.env` usage in client code (forbidden)
- Fix: Use `import.meta.env.VITE_*` pattern instead

**Database connection failed:**
- Verify `.env` file has correct values
- Check Supabase dashboard for service status

**TypeScript errors blocking development:**
```bash
npm run build:vite-only  # Bypass TypeScript errors
```

---

## Current Implementation Status

### ✅ P0 - Completed (GDPR Compliance)
| Task | Status |
|------|--------|
| Cookie Consent Management (CMP) | ✅ Done |
| Privacy Policy page | ✅ Done |
| Terms of Service page | ✅ Done |
| Click-to-load for YouTube embeds | ✅ Done |
| Consent gate on all embed components | ✅ Done |
| DMCA/takedown request form | ✅ Done |

### 🟠 P1 - After Launch (Pending)
| Task | Status |
|------|--------|
| Proper TikTok embed player | ❌ TODO |
| Proper LinkedIn embed/preview | ❌ TODO |
| SerpAPI image copyright review | ❌ TODO |
| Content moderation queue | ❌ TODO |
| Content reporting feature | ❌ TODO |

### 🟡 P2 - User Features (Pending)
| Task | Status |
|------|--------|
| User authentication (SSO with RSIP) | ❌ TODO |
| Favorites/collections | ❌ TODO |
| View history | ❌ TODO |
| Admin moderation dashboard | ❌ TODO |

### 🟢 P3 - Future Enhancements (Pending)
| Task | Status |
|------|--------|
| RSIP platform deep integration | ❌ TODO |
| Multi-language support | ❌ TODO |
| Analytics dashboard | ❌ TODO |

---

## Project Structure (Updated)

```
Video_Library/
├── CLAUDE.md                           # This file
├── DEVELOPMENT_LOG.md                  # Session-by-session development log
├── EXPERT_ANALYSIS_REPORT.md           # Legal, architecture, PM, UI analysis
├── Legal_Rule.md                       # EU embedding legal requirements
├── crawler/                            # Python crawler service
│   ├── src/
│   │   ├── main.py
│   │   ├── crawlers/
│   │   │   ├── youtube_crawler.py
│   │   │   ├── social_crawler.py       # LinkedIn, TikTok via SerpAPI
│   │   │   └── news_crawler.py
│   │   └── processors/
│   │       └── ai_classifier.py        # Gemini 2.0 Flash classification
│   └── requirements.txt
├── frontend/                           # React/TypeScript app
│   ├── src/
│   │   ├── App.tsx                     # Main app with ConsentProvider
│   │   ├── components/
│   │   │   ├── consent/                # GDPR consent components
│   │   │   │   ├── ConsentBanner.tsx
│   │   │   │   ├── ConsentSettingsModal.tsx
│   │   │   │   ├── YouTubeEmbed.tsx    # Consent-gated embed
│   │   │   │   └── ConsentPlaceholder.tsx
│   │   │   ├── legal/                  # Legal pages
│   │   │   │   ├── PrivacyPolicyPage.tsx
│   │   │   │   ├── TermsOfServicePage.tsx
│   │   │   │   └── DMCARequestPage.tsx
│   │   │   ├── shared/
│   │   │   │   └── Footer.tsx          # Footer with legal links
│   │   │   ├── discovery/              # Discovery UI components
│   │   │   │   ├── HeroCarousel.tsx
│   │   │   │   ├── MasonryGrid.tsx
│   │   │   │   └── LightboxViewer.tsx
│   │   │   ├── DiscoveryHomePage.tsx
│   │   │   └── GalleryDetailModal.tsx
│   │   ├── contexts/
│   │   │   └── ConsentContext.tsx      # Consent state management
│   │   ├── hooks/
│   │   │   └── useConsent.ts
│   │   ├── services/
│   │   │   ├── gallery-service.ts
│   │   │   └── consent-service.ts
│   │   └── types/
│   │       ├── gallery.ts
│   │       └── consent.ts
│   └── package.json
└── supabase/
    └── migrations/
        ├── 085_application_gallery.sql
        ├── 087_add_social_source_types.sql
        └── 088_dmca_requests.sql
```
