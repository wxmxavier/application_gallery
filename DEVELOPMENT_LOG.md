# Development Log - RSIP Application Gallery

## Project: RSIP Application Gallery
## Start Date: 2026-01-30

---

## Session 1: 2026-01-30 - Project Initialization & Core Implementation

### Phase 1: Requirements Analysis & Expert Team Proposal

**Time:** Initial consultation

**Activities:**
1. Reviewed handoff document (`VIDEO_LIBRARY_HANDOFF.md`)
2. Explored RSIP platform architecture:
   - Demo platform (`/demo/`) - React/TypeScript frontend
   - Knowledge Graph (`/knowledge_graph/`) - Python AI backend
   - Database migrations (`/demo/supabase/migrations/`)
3. Analyzed RSIP taxonomy:
   - 3 Application Categories
   - 12+ Task Types
   - 74 Functional Requirements
   - 8 Scene Types
4. Created initial proposal (`EXPERT_TEAM_PROPOSAL.md`)

**Stakeholder Feedback - Critical Design Changes:**
- Rejected robot-brand-centric approach
- Required application-scene-centric design
- Content must align with RSIP platform taxonomy
- Expand sources beyond YouTube to include company websites, news, social media
- Include photos and articles, not just videos

**Deliverable:** Revised proposal (`EXPERT_TEAM_PROPOSAL_V2.md`)

---

### Phase 2: Database Schema Design

**Time:** After proposal approval

**Activities:**
1. Reviewed RSIP migration numbering:
   - `/demo/supabase/migrations/` - highest: 077
   - `/v2/app/supabase/migrations/` - highest: 084
   - Decision: Use 085 for Application Gallery
2. Created migration in Video_Library project folder

**File Created:** `/supabase/migrations/085_application_gallery.sql`

**Tables Created:**
- `application_gallery` - Main content table with RSIP-aligned classification
  - RSIP taxonomy fields: `application_category`, `task_types[]`, `functional_requirements[]`
  - Environment fields: `scene_type`, `environment_setting`, `environment_features`
  - AI analysis: `ai_classification`, `ai_confidence`, `ai_summary`
  - Moderation: `status`, `moderated_by`, `moderated_at`
- `gallery_suggestions` - User-submitted content
- `gallery_crawler_runs` - Crawler execution history

**Indexes Created:**
- Primary filtering: status, category, scene_type, media_type
- GIN indexes for array fields: task_types, functional_requirements, robot_names
- Full-text search on title + description

**RLS Policies:**
- Public: View approved items only
- Admins: Full CRUD access
- Users: View own suggestions, create new suggestions

**Helper Functions:**
- `search_gallery_by_context()` - RSIP context-aware search
- `increment_gallery_view()` - View count tracking
- `get_gallery_filter_options()` - Available filter values

**Status:** Migration applied to Supabase ✅

---

### Phase 3: Crawler Service Implementation

**Time:** After database setup

**Directory Structure Created:**
```
crawler/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── crawlers/
│   │   ├── __init__.py
│   │   ├── youtube_crawler.py
│   │   └── news_crawler.py
│   ├── processors/
│   │   ├── __init__.py
│   │   └── ai_classifier.py
│   └── storage/
│       ├── __init__.py
│       └── supabase_client.py
├── config/
│   └── sources.yaml
├── tests/
├── deployment/
├── Dockerfile
├── requirements.txt
└── .env.example
```

**Files Implemented:**

1. **`config.py`** - Configuration management
   - Environment variable loading
   - YAML configuration parsing
   - Dataclasses for typed configuration

2. **`main.py`** - Entry point
   - `CrawlerOrchestrator` class
   - Async pipeline: crawl → classify → dedupe → store
   - Statistics tracking
   - CLI argument parsing

3. **`crawlers/youtube_crawler.py`** - YouTube API integration
   - Channel crawling (uploads playlist)
   - Search query crawling
   - Video details extraction
   - Duration filtering
   - Rate limiting
   - Quota tracking

4. **`crawlers/news_crawler.py`** - RSS feed aggregation
   - Feed parsing with feedparser
   - Robotics keyword filtering
   - Image extraction (media, enclosures, OG tags)
   - HTML cleaning
   - Date filtering

5. **`processors/ai_classifier.py`** - Gemini AI classification
   - RSIP taxonomy prompt
   - JSON response parsing
   - Validation and cleaning
   - Default classification fallback
   - Confidence scoring

6. **`storage/supabase_client.py`** - Database operations
   - Item existence check (deduplication)
   - Gallery item insertion
   - Crawler run tracking
   - Status updates

7. **`config/sources.yaml`** - Crawl configuration
   - YouTube channels (Boston Dynamics, Universal Robots, KUKA, ABB, FANUC, Agility)
   - Search queries by category
   - News RSS feeds (The Robot Report, IEEE Spectrum)
   - Rate limit settings

8. **`Dockerfile`** - Container configuration
   - Python 3.11 slim base
   - Requirements installation
   - Source code copy

**Dependencies (`requirements.txt`):**
- google-api-python-client
- google-generativeai
- supabase
- feedparser
- beautifulsoup4
- aiohttp, httpx
- pyyaml, python-dotenv
- pydantic
- pytest, pytest-asyncio
- structlog

---

### Phase 4: Frontend Implementation

**Time:** After crawler setup

**Directory Structure Created:**
```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── GalleryPage.tsx
│   │   ├── GalleryCard.tsx
│   │   └── GalleryDetailModal.tsx
│   ├── services/
│   │   └── gallery-service.ts
│   ├── types/
│   │   └── gallery.ts
│   └── hooks/
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
└── .env.example
```

**Files Implemented:**

1. **`types/gallery.ts`** - TypeScript definitions
   - `ApplicationCategory`, `MediaType`, `SourceType` types
   - `GalleryItem` interface with all fields
   - `GalleryFilters` interface
   - `CATEGORY_INFO` and `SCENE_INFO` display constants

2. **`services/gallery-service.ts`** - Supabase API client
   - `getGalleryItems()` - Filtered listing with pagination
   - `getGalleryItem()` - Single item fetch
   - `searchGallery()` - Text search
   - `getFeaturedItems()` - Featured content
   - `getRelatedItems()` - Similar items by tags
   - `incrementViewCount()` - Analytics
   - `getFilterOptions()` - Available filters
   - `submitSuggestion()` - User contributions
   - `getGalleryStats()` - Category counts

3. **`App.tsx`** - Main application
   - URL parameter parsing for deep linking
   - Filter state management
   - URL updates on filter changes

4. **`components/GalleryPage.tsx`** - Main browse page
   - Category cards with counts
   - Search bar
   - Active filter display
   - Responsive grid layout
   - Loading states
   - Empty state
   - Load more pagination

5. **`components/GalleryCard.tsx`** - Content card
   - Thumbnail with media type badge
   - Duration badge for videos
   - Featured badge
   - Title, source, date
   - Category and scene tags
   - Task type badges

6. **`components/GalleryDetailModal.tsx`** - Detail view
   - Embedded video player / image display
   - Description and AI summary
   - Application details sidebar
   - RSIP configuration hints
   - Related items
   - View count tracking

**Configuration:**
- Vite dev server on port 5174
- Tailwind CSS for styling
- TypeScript strict mode
- Path aliases (@/)

---

### Phase 5: Environment Setup & Launch

**Time:** Final setup

**Activities:**
1. Created `.env` file for frontend with Supabase credentials
2. Installed npm dependencies (261 packages)
3. Started development server

**Credentials Source:** `/Users/xwang/Homedevelopment/RSIP/Vercel_env/.env.local`

**Status:** Frontend running at http://localhost:5174/ ✅

---

## Files Created Summary

| File | Purpose | Lines |
|------|---------|-------|
| `CLAUDE.md` | AI assistant guidance | 170 |
| `EXPERT_TEAM_PROPOSAL.md` | Initial proposal (rejected) | ~500 |
| `EXPERT_TEAM_PROPOSAL_V2.md` | Revised proposal (approved) | ~800 |
| `supabase/migrations/085_application_gallery.sql` | Database schema | ~280 |
| `crawler/requirements.txt` | Python dependencies | 18 |
| `crawler/Dockerfile` | Container config | 18 |
| `crawler/.env.example` | Env template | 12 |
| `crawler/config/sources.yaml` | Crawl targets | 85 |
| `crawler/src/config.py` | Configuration | 160 |
| `crawler/src/main.py` | Entry point | 130 |
| `crawler/src/crawlers/youtube_crawler.py` | YouTube crawler | 190 |
| `crawler/src/crawlers/news_crawler.py` | News crawler | 170 |
| `crawler/src/processors/ai_classifier.py` | AI classification | 180 |
| `crawler/src/storage/supabase_client.py` | Database client | 180 |
| `frontend/package.json` | NPM config | 40 |
| `frontend/vite.config.ts` | Vite config | 20 |
| `frontend/tailwind.config.js` | Tailwind config | 10 |
| `frontend/index.html` | HTML entry | 15 |
| `frontend/src/types/gallery.ts` | TypeScript types | 100 |
| `frontend/src/services/gallery-service.ts` | API service | 180 |
| `frontend/src/App.tsx` | Main app | 60 |
| `frontend/src/components/GalleryPage.tsx` | Gallery page | 180 |
| `frontend/src/components/GalleryCard.tsx` | Card component | 120 |
| `frontend/src/components/GalleryDetailModal.tsx` | Detail modal | 220 |

**Total:** ~3,500+ lines of code

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Database | Supabase (PostgreSQL) |
| Crawler | Python 3.11 |
| AI Classification | Google Gemini 1.5 Flash |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite 5 |
| Deployment (planned) | Google Cloud Run (crawler), Vercel (frontend) |

---

## Next Steps

1. [x] Run crawler to populate initial content
2. [ ] Create admin moderation interface
3. [ ] Add RSIP platform integration (View Examples buttons)
4. [ ] Set up Cloud Scheduler for daily crawler runs
5. [ ] Deploy to production

---

## Session 2: 2026-01-31 - SerpAPI Integration & Content Population

### Phase 1: SerpAPI Crawler Implementation

**Activities:**
1. Implemented SerpAPI integration for news and image search
2. Created raw result logging system to enable reprocessing without API calls

**Files Created:**
- `crawler/src/crawlers/serpapi_crawler.py` - SerpAPI news and image search integration
- `crawler/logs/serpapi/*_raw.json` - Raw API response logs for reprocessing

**Results:**
- Successfully crawled news articles and images from SerpAPI
- Raw results saved to JSON files for future reprocessing

### Phase 2: Database Constraint Fix & Reprocessing

**Issue:** Database constraint `application_gallery_source_type_check` didn't allow 'serpapi_news' or 'serpapi_image' source types.

**Solution:** User updated database constraint to include new source types.

**Activities:**
1. Created `reprocess_serpapi_logs.py` script for reprocessing saved results
2. Successfully processed 370 items from log files
3. Added 364 new items to database (6 skipped as duplicates)

**Database Statistics After Crawling:**
| Content Type | Count |
|--------------|-------|
| Videos (YouTube) | 123 |
| Images (SerpAPI) | 194 |
| Articles (SerpAPI) | 170 |
| **Total** | **487** |

---

## Session 3: 2026-02-01 - V2 Integration Design & Gallery UI Redesign

### Phase 1: Gallery Integration Proposals for V2 Platform

**Activities:**
1. Analyzed V2 Story Wizard architecture and integration points
2. Created 3 integration proposals:
   - **Proposal 1:** Gallery at Entrance - Browse examples before starting wizard
   - **Proposal 2:** Contextual Examples in Steps - "See Examples" links per step
   - **Proposal 3:** Help System Integration - Examples in help drawer

**Files Created:**
- `/v2/docs/GALLERY_INTEGRATION_SPECS_V2.md` - Full technical specs for V2 integration
- `/v2/docs/HANDOVER_GALLERY_INTEGRATION.md` - Complete handover document for V2 team

### Phase 2: Gallery UI Redesign Proposals

**Stakeholder Requirements:**
- Better organization by scenario and task types
- Improved visual design
- User management with SSO integration from RSIP

**Activities:**
1. Analyzed current flat gallery organization
2. Created 3 comprehensive UI redesign proposals with wireframes

**Files Created:**
- `/Video_Library/docs/GALLERY_UI_REDESIGN_PROPOSALS.md` - 3 detailed UI proposals

**Proposal Summary:**

| Proposal | Name | Approach | Key Features |
|----------|------|----------|--------------|
| 1 | Task Hub | Task-centric hierarchical | 6 categories → 24 sub-tasks tree |
| 2 | Discovery Hub | Visual discovery-first | Hero carousel, masonry grid, lightbox |
| 3 | Workspace Companion | RSIP-integrated sidebar | Context-aware filtering, mini-preview |

**Decision:** Proceed with **Proposal 2 "Discovery Hub"**

### Phase 3: Discovery Hub Implementation (Complete)

**Architecture Implemented:**
```
frontend/src/
├── components/
│   ├── discovery/
│   │   ├── HeroCarousel.tsx      # Featured video carousel with autoplay
│   │   ├── QuickDiscoverChips.tsx # Category/scene/task filter chips
│   │   ├── ScenarioSlider.tsx    # Horizontal scenario cards
│   │   ├── MasonryGrid.tsx       # Pinterest-style staggered layout
│   │   ├── LightboxViewer.tsx    # Full-screen detail view
│   │   ├── discovery-styles.css  # Custom animations & styles
│   │   └── index.ts              # Component exports
│   ├── GalleryPage.tsx           # Legacy grid view (accessible via ?mode=legacy)
│   └── DiscoveryHomePage.tsx     # New Discovery Hub home
├── types/
│   └── gallery.ts                # Updated with 'image' media type
└── vite-env.d.ts                 # Vite environment types
```

**Key Features Implemented:**

1. **Hero Video Carousel**
   - Auto-playing featured items carousel
   - YouTube video background with mute control
   - Keyboard navigation (arrow keys, spacebar)
   - Progress indicators
   - "Use in RSIP" deep linking button

2. **Quick Discover Chips**
   - 11 filter chips across 3 types (category, scene, task)
   - Multi-select for tasks, single-select for category/scene
   - Active filter count badge
   - Clear all functionality

3. **Scenario Sliders**
   - Category-based horizontal card sliders
   - Smooth scroll navigation
   - "View All" links to filtered grid view
   - 3 sliders: Industrial, Service, Security

4. **Pinterest-style Masonry Grid**
   - Responsive columns (1-5 based on viewport)
   - Varied card heights based on content
   - Featured items get larger cards
   - Hover effects with quick actions

5. **Full-screen Lightbox Viewer**
   - Embedded video player for YouTube content
   - Keyboard navigation between items
   - Fullscreen toggle (F key)
   - Social sharing integration
   - Related items section
   - RSIP integration panel

6. **View Mode Toggle**
   - Discovery mode (default) - immersive browsing
   - Grid mode - traditional filtered view
   - URL persistence (?mode=legacy)

**Build Status:** ✅ Successful (374KB bundle)

**Access URLs:**
- Discovery Hub: `http://localhost:5174/`
- Legacy Grid: `http://localhost:5174/?mode=legacy`
- Filtered View: `http://localhost:5174/?category=industrial_automation`

**Remaining Work for Full Production:**
- [ ] User authentication (SSO with RSIP)
- [ ] User favorites & collections
- [ ] View history tracking
- [ ] Admin moderation interface
- [ ] Deployment to production

---

## Session 4: 2026-02-01 - Classification System V2 Implementation

### Problem Statement

Many gallery items showed basic robot capabilities (walking, demos) rather than real-world applications. Users need to find actual deployment examples to understand configurations, not marketing demos.

### Solution: V2 Classification System

Implemented enhanced classification to distinguish real applications from demos.

### New Classification Dimensions

#### 1. Content Type (Primary Filter)
| Type | Description |
|------|-------------|
| `real_application` | Deployed in actual business operations |
| `pilot_poc` | Trial deployment, proof of concept |
| `case_study` | Documented with results/metrics |
| `tech_demo` | Capability demo, trade show, lab |
| `product_announcement` | New product reveal |
| `tutorial` | How-to content |

#### 2. Educational Value (1-5 Stars)
- 5 = Full case study with metrics
- 4 = Real deployment with details
- 3 = Real application, limited context
- 2 = Demo with some relevance
- 1 = Pure marketing

#### 3. Specific Tasks
Refined from broad types (e.g., `transportation` → `pallet_transport`, `tote_transport`, `cart_towing`)

#### 4. Application Context
- `problem_solved`: labor_shortage, safety_hazard, quality_consistency
- `deployment_scale`: single_unit → multi_site
- `customer_identified`: boolean
- `has_metrics`: boolean

### Files Modified/Created

| File | Change |
|------|--------|
| `crawler/src/processors/ai_classifier.py` | V2 classifier with stricter content type detection |
| `crawler/src/storage/supabase_client.py` | V2 fields support in insert/update |
| `crawler/src/reclassify_existing.py` | Script to re-classify 487 existing items |
| `frontend/src/types/gallery.ts` | V2 types, display info, helpers |
| `frontend/src/services/gallery-service.ts` | V2 filters, quality sorting |
| `supabase/migrations/086_classification_v2.sql` | New columns, indexes, functions |
| `docs/CLASSIFICATION_SYSTEM_V2.md` | Full design documentation |

### Database Changes (Migration 086)

New columns:
- `content_type` VARCHAR(50)
- `deployment_maturity` VARCHAR(50)
- `educational_value` INTEGER (1-5)
- `specific_tasks` TEXT[]
- `application_context` JSONB

New indexes and functions for efficient filtering.

### Frontend Changes

- Default filter: Only show `real_application`, `case_study`, `pilot_poc` with `educational_value >= 3`
- "Include demos" toggle to show all content
- New sort option: "Quality" (by educational value)
- Content type badges on cards
- Star ratings for educational value

### Deployment Status

#### Migration 086 - Applied ✅ (2026-02-02)
- Added columns: `content_type`, `deployment_maturity`, `educational_value`, `specific_tasks`, `application_context`
- Created indexes for efficient filtering
- Added helper functions: `get_gallery_content_stats()`, `search_gallery_v2()`

#### Re-classification Results ✅ (2026-02-02)

| Content Type | Count | Percentage |
|--------------|-------|------------|
| real_application | 357 | 73.3% |
| case_study | 31 | 6.4% |
| tech_demo | 51 | 10.5% |
| product_announcement | 28 | 5.7% |
| tutorial | 16 | 3.3% |
| pilot_poc | 4 | 0.8% |

**Summary:**
- Total items processed: 487
- Errors: 0
- **Quality content (default view):** 392 items (80.5%)
- Demo/Marketing content (hidden by default): 79 items (16.2%)

### Remaining Tasks

1. [x] Update frontend UI components to display content type badges ✅ (2026-02-02)
2. [x] Add star rating display for educational value ✅ (2026-02-02)
3. [x] Separate articles from visual content (tabs) ✅ (2026-02-02)
4. [x] Add "Include Tech Demos" toggle ✅ (2026-02-02)
5. [ ] User authentication (SSO with RSIP)
6. [ ] Admin moderation interface
7. [ ] Deploy to production

### Frontend UI Updates (2026-02-02)

**GalleryCard.tsx:**
- Content type badge (top-left): Shows Real Application, Tech Demo, Case Study, etc.
- Educational value stars (top-right): Displays for items with 3+ stars
- Shows specific_tasks when available, falls back to task_types

**GalleryDetailModal.tsx:**
- Header badges: Content type, educational value stars, deployment maturity
- New "Application Context" section (purple): problem_solved, deployment_scale, customer_identified, has_metrics
- Specific tasks display with indigo styling
- Updated RSIP configuration hints to use specific tasks

### Content Layout Separation (2026-02-02)

**Problem:** Articles mixed with videos/images in Pinterest-style masonry grid didn't fit visually - articles need list-style layout.

**Solution:** Separated content into tabs with different layouts.

**DiscoveryHomePage.tsx Updates:**

1. **View Mode Tabs**
   - "Visual Content" tab: Videos and images in masonry grid layout
   - "Articles" tab: Articles in list-style layout with thumbnails
   - Count badges on each tab

2. **Include Tech Demos Toggle**
   - Orange toggle button to show/hide tech_demo content
   - By default, only quality content (real_application, case_study, pilot_poc with educational_value >= 3) is shown
   - When enabled, includes tech_demo and product_announcement content

3. **ArticleCard Component**
   - Horizontal list layout with thumbnail on left
   - Content type and educational value badges
   - AI summary display
   - Source, date, and view count metadata

**Content Distribution:**
| Type | Count |
|------|-------|
| Videos | 123 |
| Images | 194 |
| Articles | 170 |
| Tech Demos | 51 (50 videos, 1 article) |

**UX Improvements:**
- Articles no longer break the visual flow of the masonry grid
- Tech demos can be explicitly included when users want to see capability demonstrations
- Clear visual separation between visual content and text-based content

---

## Session 5: 2026-02-02 - Social Media Expansion & Legal Compliance Review

### Phase 1: Strict Reclassification

**Problem:** Most content was classified as "real_application" (73%) which was too generous. Many videos showing basic robot capabilities were not actual deployments.

**Solution:** Created stricter V3 classifier with explicit rules:
- Holiday videos, dancing robots → tech_demo
- Trade show demos → tech_demo
- Lab/R&D footage → tech_demo
- Only actual customer deployments → real_application

**Results After Reclassification:**
| Content Type | Before | After |
|--------------|--------|-------|
| tech_demo | 51 (10%) | 295 (63%) |
| real_application | 357 (73%) | 76 (16%) |
| product_announcement | 28 (6%) | 31 (7%) |
| case_study | 31 (6%) | 38 (8%) |
| tutorial | 16 (3%) | 20 (4%) |
| pilot_poc | 4 (1%) | 6 (1%) |

### Phase 2: Social Media Crawler Implementation

**New Crawlers Created:**
- `crawler/src/crawlers/social_crawler.py` - LinkedIn/TikTok via SerpAPI
- `crawler/src/crawl_social.py` - Full crawl, classify, store pipeline
- `crawler/src/crawl_tiktok_expanded.py` - Comprehensive TikTok search

**Database Migration 087:**
- Added source types: linkedin, tiktok, twitter, instagram

**Crawl Results:**
| Platform | Items Crawled |
|----------|---------------|
| LinkedIn | 50 |
| TikTok | 414 |

**Final Gallery Totals: 931 items**
| Source | Count |
|--------|-------|
| TikTok | 414 |
| SerpAPI Images | 174 |
| SerpAPI News | 170 |
| YouTube | 123 |
| LinkedIn | 50 |

### Phase 3: UI/UX Improvements

**Card Design Cleanup:**
- Removed intrusive badges from thumbnails (Video, Real Application)
- Added colored left border to indicate content type:
  - Green = Real Application
  - Blue = Case Study
  - Orange = Tech Demo
  - Purple = Pilot/POC
  - Pink = Product Announcement
  - Cyan = Tutorial
- Content type shown as subtle text below thumbnail
- Clean thumbnails with full visual content visible

**Advanced Filters Added:**
- Environment filter: Warehouse, Manufacturing, Hospital, Hotel, Retail, etc.
- Task filter: Delivery, Inspection, Welding, Palletizing, Assembly, etc.
- Multi-select for task types
- "More Filters" expandable panel
- Active filter chips with remove buttons

### Phase 4: Legal & Compliance Analysis

**Expert Team Review Conducted:**
- Legal Expert (Data Protection & IP)
- Software Architect
- Product Manager
- UI/UX Designer

**Critical Findings (see EXPERT_ANALYSIS_REPORT.md):**

#### GDPR Compliance Gaps (HIGH RISK)
| Issue | Current State | Requirement |
|-------|---------------|-------------|
| Cookie Consent | ❌ None | Must obtain consent BEFORE loading embeds |
| Privacy Policy | ❌ None | Must disclose data recipients |
| Joint Controller | ❌ Not addressed | Site is joint controller with platforms |

#### Copyright/IP Concerns (MEDIUM RISK)
| Issue | Current State | Requirement |
|-------|---------------|-------------|
| Image Hosting | Hotlinking | Should use official embed or license |
| Embedding Rights | Assumed | Must respect "embedding disabled" |
| Takedown Process | ❌ None | Need DMCA procedure |

---

## Compliance TODO List (Prioritized)

### 🔴 P0 - MUST DO Before Public Launch

| # | Task | Owner | Effort | Status |
|---|------|-------|--------|--------|
| 1 | Implement Cookie Consent Management (CMP) | Dev | 2d | ❌ TODO |
| 2 | Create Privacy Policy page | Legal | 1d | ❌ TODO |
| 3 | Create Terms of Service page | Legal | 1d | ❌ TODO |
| 4 | Implement "click-to-load" for YouTube embeds | Dev | 1d | ❌ TODO |
| 5 | Add consent gate to all embed components | Dev | 2d | ❌ TODO |
| 6 | Create DMCA/takedown request form | Dev+Legal | 1d | ❌ TODO |

### 🟠 P1 - SHOULD DO After Launch

| # | Task | Owner | Effort | Status |
|---|------|-------|--------|--------|
| 7 | Implement proper TikTok embed player | Dev | 3d | ❌ TODO |
| 8 | Implement proper LinkedIn embed/preview | Dev | 2d | ❌ TODO |
| 9 | Review SerpAPI image copyright status | Content | 3d | ❌ TODO |
| 10 | Add content moderation queue | Dev+PM | 3d | ❌ TODO |
| 11 | Implement content reporting feature | Dev | 2d | ❌ TODO |

### 🟡 P2 - User Features

| # | Task | Status |
|---|------|--------|
| 12 | User authentication (SSO with RSIP) | ❌ TODO |
| 13 | Favorites/collections | ❌ TODO |
| 14 | View history | ❌ TODO |
| 15 | Admin moderation dashboard | ❌ TODO |

### 🟢 P3 - Future Enhancements

| # | Task | Status |
|---|------|--------|
| 16 | RSIP platform deep integration | ❌ TODO |
| 17 | Multi-language support | ❌ TODO |
| 18 | Analytics dashboard | ❌ TODO |
| 19 | Mobile app | ❌ TODO |

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `crawler/src/crawlers/social_crawler.py` | LinkedIn/TikTok crawler via SerpAPI |
| `crawler/src/crawl_social.py` | Social media crawl pipeline |
| `crawler/src/crawl_tiktok_expanded.py` | Comprehensive TikTok crawler |
| `crawler/src/reclassify_v3.py` | Strict reclassification script |
| `supabase/migrations/087_add_social_source_types.sql` | Add social platform source types |
| `EXPERT_ANALYSIS_REPORT.md` | Legal, architecture, PM, UI analysis |

---

## Lessons Learned

1. **Application-centric design** is more valuable than robot-centric for user education
2. **RSIP taxonomy alignment** ensures consistency across platforms
3. **Migration numbering** must be coordinated across RSIP project folders
4. **Multi-source content** (not just YouTube) provides better coverage
5. **Content type classification** is essential to separate demos from real deployments
6. **GDPR compliance is critical** - embeds require consent before loading in EU
7. **Clean UI trumps information density** - badges covering thumbnails hurt UX
8. **Legal review before launch** - must address compliance before going public

---

## Technology Stack Summary

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Build | Vite 5 |
| Database | Supabase (PostgreSQL) |
| Crawlers | Python 3.11 |
| AI Classification | Google Gemini 2.0 Flash |
| Search API | SerpAPI (Google Search) |
| Video Sources | YouTube, TikTok |
| Social Sources | LinkedIn |
| Deployment (planned) | Vercel (frontend), Cloud Run (crawlers) |

---

## Session 6: 2026-02-03 - GDPR Compliance Implementation (P0 Tasks)

### Overview

Implemented all P0 (critical) compliance tasks from the Expert Analysis Report to meet EU legal requirements before public launch.

### Implementation Summary

#### 1. Consent Infrastructure (Phase 1)

Created foundational consent management system:

| File | Purpose |
|------|---------|
| `frontend/src/types/consent.ts` | TypeScript types for consent state |
| `frontend/src/services/consent-service.ts` | localStorage operations |
| `frontend/src/hooks/useConsent.ts` | React hook for components |
| `frontend/src/contexts/ConsentContext.tsx` | Context provider for app |

**Features:**
- Three consent categories: Essential (required), Analytics, Marketing
- Consent versioning for future re-consent triggers
- localStorage persistence with timestamp
- Context-based state management

#### 2. Consent UI Components (Phase 2)

Built user-facing consent interface:

| Component | Purpose |
|-----------|---------|
| `ConsentBanner.tsx` | Bottom banner on first visit |
| `ConsentSettingsModal.tsx` | Detailed preferences modal |
| `ConsentPlaceholder.tsx` | Generic placeholder for embeds |
| `YouTubeEmbed.tsx` | Consent-gated YouTube wrapper |

**Features:**
- "Accept All" / "Reject Non-Essential" buttons
- Toggle switches for each category
- Platform-specific placeholders with branding
- Individual "Load this video" option

#### 3. Embed Component Updates (Phase 3)

Updated all existing embed components to use consent gates:

| Component | Change |
|-----------|--------|
| `HeroCarousel.tsx` | Replaced iframe with `YouTubeEmbed` |
| `LightboxViewer.tsx` | Replaced iframe with `YouTubeEmbed` |
| `GalleryDetailModal.tsx` | Replaced iframe with `YouTubeEmbed` |

**Key Change:**
- YouTube embeds now use `youtube-nocookie.com` (privacy-enhanced mode)
- All embeds blocked until marketing consent granted
- Users can load individual videos without accepting all cookies

#### 4. Legal Pages (Phase 4)

Created full legal documentation pages:

| Page | URL | Content |
|------|-----|---------|
| Privacy Policy | `?page=privacy` | GDPR-compliant disclosure |
| Terms of Service | `?page=terms` | User obligations, liability |
| DMCA Request | `?page=dmca` | Takedown request form |

**Privacy Policy Sections:**
1. Who We Are
2. Data Collection
3. How We Use Data
4. Third-Party Services (YouTube, TikTok, LinkedIn)
5. Data Transfers
6. Data Retention
7. Your Rights (GDPR)
8. Cookie Policy
9. Children's Privacy
10. Contact Information

#### 5. App Integration (Phase 5)

| Change | Description |
|--------|-------------|
| `App.tsx` | Wrapped with `ConsentProvider`, added legal page routing |
| `DiscoveryHomePage.tsx` | Replaced footer with new `Footer` component |
| `Footer.tsx` | New component with legal links + Cookie Settings |
| `088_dmca_requests.sql` | Database migration for takedown requests |

### Files Created

```
frontend/src/
├── types/consent.ts
├── services/consent-service.ts
├── hooks/useConsent.ts
├── contexts/ConsentContext.tsx
├── components/
│   ├── consent/
│   │   ├── ConsentBanner.tsx
│   │   ├── ConsentSettingsModal.tsx
│   │   ├── ConsentPlaceholder.tsx
│   │   ├── YouTubeEmbed.tsx
│   │   └── index.ts
│   ├── legal/
│   │   ├── LegalPageLayout.tsx
│   │   ├── PrivacyPolicyPage.tsx
│   │   ├── TermsOfServicePage.tsx
│   │   ├── DMCARequestPage.tsx
│   │   └── index.ts
│   └── shared/
│       ├── Footer.tsx
│       └── index.ts
supabase/migrations/
└── 088_dmca_requests.sql
```

### Files Modified

| File | Change |
|------|--------|
| `App.tsx` | Added ConsentProvider, page routing |
| `DiscoveryHomePage.tsx` | Added Footer import, replaced footer |
| `HeroCarousel.tsx` | Added YouTubeEmbed import, replaced iframe |
| `LightboxViewer.tsx` | Added YouTubeEmbed import, replaced iframe |
| `GalleryDetailModal.tsx` | Added YouTubeEmbed import, replaced iframe |
| `gallery-service.ts` | Exported supabase client |
| `index.css` | Added consent banner animations, legal page styles |

### Updated Compliance TODO

| # | Task | Status |
|---|------|--------|
| 1 | Cookie Consent Management (CMP) | ✅ DONE |
| 2 | Privacy Policy page | ✅ DONE |
| 3 | Terms of Service page | ✅ DONE |
| 4 | "Click-to-load" for YouTube embeds | ✅ DONE |
| 5 | Consent gate on all embed components | ✅ DONE |
| 6 | DMCA/takedown request form | ✅ DONE |

### User Flow

1. **First Visit:**
   - Consent banner appears at bottom
   - YouTube embeds show placeholders (not loading)
   - User clicks "Accept All" → Banner hides, embeds load

2. **Reject Flow:**
   - User clicks "Reject Non-Essential" → Banner hides
   - Embeds remain as placeholders
   - "Load this video" buttons allow individual consent

3. **Settings Flow:**
   - "Manage Preferences" opens modal
   - Toggle switches for Analytics and Marketing
   - "Save Preferences" applies changes

4. **Persistence:**
   - Consent stored in localStorage
   - Survives page reload and browser restart
   - Version tracking for future re-consent requirements

### Build Verification

```bash
npm run type-check  # ✅ No errors
npm run dev         # ✅ Server starts on port 5174
```

### Access URLs

| Page | URL |
|------|-----|
| Gallery (main) | `http://localhost:5174/` |
| Privacy Policy | `http://localhost:5174/?page=privacy` |
| Terms of Service | `http://localhost:5174/?page=terms` |
| DMCA Request | `http://localhost:5174/?page=dmca` |

---

## Session 5: 2026-02-03 - P1 Implementation (Enhanced Embeds, Reporting & Moderation)

### Overview

Implemented P1 priority features:
1. TikTok and LinkedIn consent-gated embed components
2. Content reporting feature for users
3. Admin moderation queue dashboard

### Phase 1: Additional Embed Components

**Files Created:**
- `frontend/src/components/consent/TikTokEmbed.tsx` - Consent-gated TikTok video embed
- `frontend/src/components/consent/LinkedInEmbed.tsx` - Consent-gated LinkedIn post embed

**Features:**
- Follow YouTubeEmbed pattern with ConsentPlaceholder
- Support multiple URL formats (TikTok short links, LinkedIn activity URLs)
- Manual load per-video option
- TikTok uses script injection, LinkedIn uses iframe

**Updated:**
- `frontend/src/components/consent/index.ts` - Added exports for new components

### Phase 2: Content Reporting Feature

**Database Migration:**
- `supabase/migrations/089_content_reports.sql`
  - `content_reports` table for user-submitted reports
  - Reason types: inappropriate, copyright, misleading, broken_link, spam, other
  - Status workflow: pending → reviewed/dismissed/action_taken
  - RLS: Anonymous inserts allowed, authenticated reads for admin

**Files Created:**
- `frontend/src/types/moderation.ts` - Types for reports and moderation
- `frontend/src/components/moderation/ReportButton.tsx` - Flag icon button
- `frontend/src/components/moderation/ReportModal.tsx` - Report submission form
- `frontend/src/components/moderation/index.ts` - Barrel export

**Gallery Service Extension:**
- Added `submitContentReport()` to `frontend/src/services/gallery-service.ts`

**Integration:**
- Added ReportButton to:
  - `GalleryCard.tsx` (in source line)
  - `GalleryDetailModal.tsx` (in header)
  - `LightboxViewer.tsx` (in header buttons)

### Phase 3: Admin Moderation Queue

**Files Created:**
- `frontend/src/components/admin/AdminModerationPage.tsx` - Main dashboard with tabs
- `frontend/src/components/admin/ContentQueue.tsx` - Pending content management
- `frontend/src/components/admin/ItemReviewModal.tsx` - Detailed item review
- `frontend/src/components/admin/ReportsQueue.tsx` - User reports management
- `frontend/src/components/admin/index.ts` - Barrel export
- `frontend/src/services/moderation-service.ts` - Admin API functions

**Features:**
- Tab navigation: Content Queue | Reports Queue
- Stats bar with pending counts
- Quick actions: Approve, Reject, Flag, Archive
- Bulk dismiss for reports
- Detailed item review with metadata

**App Integration:**
- Added `?page=admin` route to App.tsx

### Type Updates

**Modified:**
- `frontend/src/types/gallery.ts` - Added optional `status` field to GalleryItem
- `frontend/src/types/moderation.ts` - ModerationItem with required status

### Build Verification

```bash
npm run type-check  # ✅ No errors
npm run build       # ✅ Successful build
```

### Access URLs

| Page | URL |
|------|-----|
| Admin Moderation | `http://localhost:5174/?page=admin` |

### Files Summary

**New Files (11):**
```
frontend/src/
├── components/
│   ├── consent/
│   │   ├── TikTokEmbed.tsx
│   │   └── LinkedInEmbed.tsx
│   ├── moderation/
│   │   ├── ReportButton.tsx
│   │   ├── ReportModal.tsx
│   │   └── index.ts
│   └── admin/
│       ├── AdminModerationPage.tsx
│       ├── ContentQueue.tsx
│       ├── ItemReviewModal.tsx
│       ├── ReportsQueue.tsx
│       └── index.ts
├── services/
│   └── moderation-service.ts
└── types/
    └── moderation.ts
supabase/migrations/
└── 089_content_reports.sql
```

**Modified Files (7):**
```
frontend/src/
├── App.tsx
├── types/gallery.ts
├── services/gallery-service.ts
├── components/
│   ├── consent/index.ts
│   ├── GalleryCard.tsx
│   ├── GalleryDetailModal.tsx
│   └── discovery/LightboxViewer.tsx
```

---

## Session 7: 2026-02-03 - TikTok & Media Linking Fixes

### Overview

Fixed critical issue where TikTok videos and other media content weren't clickable in detail modals. The root cause was that TikTok items have `content_url = null` with the actual TikTok link stored in `source_url`.

### Problem Analysis

**Database Structure for Different Sources:**

| Source | content_url | source_url | media_type |
|--------|-------------|------------|------------|
| YouTube | `youtube.com/embed/...` | `youtube.com/watch?v=...` | video |
| TikTok | `null` | `tiktok.com/@user/video/...` | video |
| LinkedIn | `null` | `linkedin.com/posts/...` | article |
| Images | `image-url.jpg` | `article-url.com/...` | image |

**Root Cause:**
- Code checked `item.media_type === 'video' && item.content_url`
- TikTok items failed this check because `content_url` is null
- Result: Static image displayed instead of clickable video embed

### Fixes Implemented

#### 1. GalleryCard.tsx
- Changed TikTok detection from `content_url` to `source_url`
- Play button on TikTok cards now links directly to TikTok

```typescript
// Before: isTikTokUrl(item.content_url)
// After: isTikTokSource(item.source_url)
```

#### 2. VideoEmbed.tsx
- Added `sourceUrl` prop for TikTok link detection
- Platform detection checks both `contentUrl` and `sourceUrl`
- Links to `sourceUrl` for TikTok items

```typescript
const contentPlatform = detectPlatform(contentUrl);
const sourcePlatform = sourceUrl ? detectPlatform(sourceUrl) : 'unknown';
const platform = sourcePlatform === 'tiktok' ? 'tiktok' : contentPlatform;
const linkUrl = isTikTok && sourceUrl ? sourceUrl : contentUrl;
```

#### 3. GalleryDetailModal.tsx
- Updated condition: `(item.content_url || item.source_url)`
- VideoEmbed receives both URLs
- Fallback image now wrapped in anchor linking to `source_url`

```typescript
// Before: item.media_type === 'video' && item.content_url
// After: item.media_type === 'video' && (item.content_url || item.source_url)
```

#### 4. LightboxViewer.tsx
- Same fallback logic for `hasVideoContent`
- Images/articles now clickable, linking to source

### Content Statistics

| Content Type | Count | Notes |
|--------------|-------|-------|
| Videos | 327 | YouTube (embeddable), TikTok (link only) |
| Images | 69 | Click to open source article |
| Articles | 104 | LinkedIn (50), news sites |
| **TikTok** | **280** | All link to TikTok via source_url |
| **LinkedIn** | **50** | All articles, no videos |

### Behavior Summary

| Content | Card Click | Modal Image Click |
|---------|------------|-------------------|
| YouTube video | Opens modal | Embedded player |
| TikTok video | Opens modal | Opens TikTok in new tab |
| LinkedIn article | Opens modal | Opens LinkedIn in new tab |
| Image | Opens modal | Opens source article in new tab |

### Git Commits

1. `bd8a414` - Fix TikTok video linking: handle null content_url
2. `15e52ca` - Make images and articles clickable to source URL

### Files Modified

| File | Change |
|------|--------|
| `GalleryCard.tsx` | TikTok detection via source_url |
| `VideoEmbed.tsx` | Added sourceUrl prop, dual platform detection |
| `GalleryDetailModal.tsx` | Fallback to source_url, clickable images |
| `LightboxViewer.tsx` | Same fallback logic |

### Lessons Learned

1. **Check actual database values** - Don't assume URL field contains expected data
2. **Different sources have different structures** - TikTok/LinkedIn store URLs differently than YouTube
3. **Fallback patterns** - Use `(primary || fallback)` pattern for optional fields

---

## Session 8: 2026-02-04 - Social Media Expansion & Interview Classification

### Overview

Expanded content crawling to Facebook, X/Twitter, and Instagram. Implemented interview/commentary detection to separate videos showing people speaking from actual robot footage.

### Phase 1: Social Media Crawler Implementation

**Research on Official Embedding:**
- **X/Twitter**: Public oEmbed API (no auth required) - `publish.twitter.com/oembed`
- **Facebook/Instagram**: Requires Meta oEmbed Read with app registration (retired old oEmbed April 2025)

**Files Created:**
| File | Purpose |
|------|---------|
| `crawler/src/crawl_linkedin_media.py` | Dedicated LinkedIn video/image crawler |
| `crawler/src/crawl_social_platforms.py` | Multi-platform crawler (X, Facebook, Instagram) |
| `supabase/migrations/090_add_facebook_source_type.sql` | Add 'facebook' to source_type constraint |

**Crawler Methods Added to `social_crawler.py`:**
- `search_twitter()` - X/Twitter video and post search
- `search_facebook()` - Facebook video search
- `search_instagram()` - Instagram reels and image search
- `_search_google_video()` - Google video search via SerpAPI
- `_search_google_images()` - Google image search via SerpAPI
- `crawl_all_social_platforms()` - Main function to crawl all platforms
- `crawl_linkedin_media()` - LinkedIn-specific video/image crawl

### Phase 2: Content Crawl Results

**LinkedIn Media Crawl:**
- Videos: 59 new items
- Images: 93 new items
- Total: 152 new LinkedIn items

**Social Platforms Crawl:**
| Platform | Found | Stored |
|----------|-------|--------|
| X/Twitter | 93 | 89 (4 non-tweet URLs removed) |
| Facebook | 88 | 88 |
| Instagram | 100 | 100 |

### Phase 3: Twitter Thumbnail Fixes

**Problem:** 25 Twitter items had no thumbnails (showing placeholder).

**Solution:**
1. Used Twitter syndication API to fetch media thumbnails
2. Set default X logo for text-only tweets
3. Removed 4 invalid URLs (profile pages, hashtag pages, communities)
4. Changed 10 text-only tweets to `media_type: article`

### Phase 4: Interview & Comment Classification

**Problem:** Many videos showed people speaking (interviews, commentary, news anchors) rather than robot footage, but were classified as "Real Application" or "Tech Demo".

**Solution:** Created new content type `interview_comment`.

**Migration Created:**
`supabase/migrations/091_add_interview_comment_content_type.sql`

**Detection Criteria:**
- Interviews with executives, founders, experts
- Commentary and reaction videos
- News reports with anchors talking
- Testimonials with people speaking to camera
- Title patterns: "conversation", "interview", "talks", "explains", "Q&A"
- Personal commentary channels

**AI Classification Process:**
1. Batch analysis of 772 videos using Gemini 2.0 Flash
2. Keyword-based detection for interview patterns
3. Source-based detection (news channels, personal accounts)
4. Manual review and false positive correction

**Results:**
- 98 videos classified as `interview_comment`
- Reverted 17 false positives (robot footage with "Future of" titles)

### Phase 5: Frontend Updates

**Files Modified:**
| File | Changes |
|------|---------|
| `frontend/src/types/gallery.ts` | Added `interview_comment` to ContentType, added `facebook`, `instagram`, `tiktok` to SourceType |
| `frontend/src/services/gallery-service.ts` | Added `interview_comment` to stats type |

**Display Configuration:**
```typescript
interview_comment: {
  label: 'Interview & Comment',
  labelZh: '访谈与评论',
  icon: '🎤',
  color: 'bg-orange-100 text-orange-800 border-orange-300',
  description: 'Interviews, commentary, or reactions about robots',
}
```

### Final Content Statistics

**By Source (1,360 total):**
| Source | Count |
|--------|-------|
| TikTok | 414 |
| LinkedIn | 202 |
| SerpAPI Images | 174 |
| SerpAPI News | 170 |
| YouTube | 123 |
| Instagram | 100 |
| X/Twitter | 89 |
| Facebook | 88 |

**By Media Type:**
| Type | Count |
|------|-------|
| Videos | 772 |
| Images | 357 |
| Articles | 231 |

**Video Content Type Distribution:**
| Content Type | Count | % |
|--------------|-------|---|
| Tech Demo | 245 | 31.7% |
| Product Announcement | 241 | 31.2% |
| Real Application | 154 | 19.9% |
| Interview & Comment | 98 | 12.7% |
| Tutorial | 20 | 2.6% |
| Case Study | 13 | 1.7% |
| Pilot/POC | 4 | 0.5% |

### Git Commit

```
b23277a Add social media crawlers and interview_comment content type
```

**Files committed:**
- `crawler/src/crawlers/social_crawler.py`
- `crawler/src/crawl_linkedin_media.py`
- `crawler/src/crawl_social_platforms.py`
- `frontend/src/types/gallery.ts`
- `frontend/src/services/gallery-service.ts`
- `supabase/migrations/090_add_facebook_source_type.sql`
- `supabase/migrations/091_add_interview_comment_content_type.sql`

### Lessons Learned

1. **Official embed APIs have changed** - Meta retired old oEmbed in April 2025, now requires app registration
2. **X/Twitter oEmbed is still public** - No authentication needed for basic embedding
3. **SerpAPI works well for discovery** - Can find social media content without platform-specific APIs
4. **Interview detection needs multiple signals** - Title keywords + source analysis + AI classification
5. **Official channels can have interviews too** - Don't skip company channels entirely when detecting commentary
6. **"Future of X" titles are ambiguous** - Can be either robot demos or commentary, need careful review

---

## Session 9: 2026-02-21 - Taxonomy Alignment & Classification Quality Overhaul

### Overview

Major session addressing taxonomy alignment with RSIP Knowledge Graph, classification quality issues, and gallery usability improvements.

### Phase 1: KG Axis 1 Taxonomy Alignment

**Problem:** Video Library used 3 categories (`industrial_automation`, `service_robotics`, `surveillance_security`) while KG Axis 1 defines 5 (`industrial`, `professional_service`, `personal_service`, `medical`, `specialized_environment`).

**Migrations Created:**
- `093_fix_content_type_unknown.sql` — Fix content_type CHECK constraint (add `unknown`, `interview_comment`)
- `094_expand_application_categories.sql` — Expand from 3 to 5 categories + migrate existing data

**Files Modified (12):**
| File | Changes |
|------|---------|
| `crawler/src/processors/ai_classifier.py` | Categories 3→5, updated prompt, added medical/specialized tasks |
| `crawler/src/storage/supabase_client.py` | Added interview_comment to stats |
| `crawler/src/reclassify_existing.py` | Added --category filter, category tracking in stats/reports |
| `crawler/config/sources.yaml` | All default_category + section keys updated |
| `frontend/src/types/gallery.ts` | ApplicationCategory, CATEGORY_INFO, SPECIFIC_TASK_INFO |
| `frontend/src/services/gallery-service.ts` | Category arrays, stats, fallbacks |
| `frontend/src/components/discovery/QuickDiscoverChips.tsx` | Category filter chips |
| `frontend/src/components/discovery/MasonryGrid.tsx` | interview_comment border color |
| `frontend/src/components/DiscoveryHomePage.tsx` | CATEGORIES constant, icon logic |
| `frontend/src/components/GalleryPage.tsx` | Icon selection logic |

**Reclassification Results (1000 items):**
| Category | Count | % |
|----------|-------|---|
| industrial | 766 | 76.6% |
| professional_service | 137 | 13.7% |
| personal_service | 39 | 3.9% |
| medical | 37 | 3.7% |
| specialized_environment | 21 | 2.1% |

**Commits:** `577e9ed`, `8c852fb`

### Phase 2: Medical & Specialized Task Vocabulary

**Problem:** AI classifier had no medical/specialized task options. Multiply Labs cell therapy video was tagged as "packaging"/"transportation".

**Solution:** Added 15 new specific tasks to classifier prompt, validation, mapping, and frontend:

| Category | New Tasks |
|----------|-----------|
| Medical (9) | surgical_procedure, rehabilitation_therapy, pharmacy_dispensing, lab_automation, sample_handling, cell_therapy, diagnostic_imaging, patient_monitoring, sterilization |
| Specialized (6) | hazardous_inspection, bomb_disposal, underwater_operation, space_operation, nuclear_decommission, firefighting |

**Verification:** Tasks are orthogonal to 7-axis taxonomy (only Axis 1 applies to video classification). TAXONOMY_IMPLEMENTATION_VIDEO_LIBRARY.md explicitly states task alignment with RSIP's 99 tasks is unnecessary.

**Targeted reclassification:** 58 medical+specialized items → 6 reassigned, 52 stayed with corrected task labels.

**Commit:** `40d23b7`

### Phase 3: Transportation Mislabeling Fix

**Root Causes Identified:**
1. `material_handling` mapped to "transportation" but is actually manipulation
2. No `locomotion_demo`, `general_demo`, `entertainment` task types for demo content
3. Prompt JSON example anchored on "transportation" (bias)
4. No Personal Service task section in prompt
5. Standalone crawler scripts had limited task vocabulary

**Fixes Applied:**
| Fix | Detail |
|-----|--------|
| `material_handling` mapping | `transportation` → `manipulation` |
| New specific tasks (7) | `locomotion_demo`, `general_demo`, `research_platform`, `entertainment`, `home_cleaning`, `lawn_mowing`, `personal_assistant` |
| New broad task types (3) | `locomotion`, `entertainment`, `research` |
| Prompt example | Changed from transportation-anchored to manipulation case study |
| Critical rules | Entertainment/dance/costume content → `locomotion_demo`/`entertainment`, NOT industrial tasks |
| Personal Service section | Added to prompt with companion, home_cleaning, lawn_mowing, entertainment |
| Standalone scripts | Updated `crawl_social_platforms.py` and `crawl_tiktok_expanded.py` with new task guidance |
| MasonryGrid | Fixed to prefer `specific_tasks` over `task_types` |

**Reclassification Results (1000 items):**
| Task Type | Before | After |
|-----------|--------|-------|
| transportation | 718 | 153 (-78.7%) |
| manipulation | — | 613 |
| locomotion | 0 | 97 |
| entertainment | 0 | 124 |

**Content Type Distribution After:**
| Type | Count | % |
|------|-------|---|
| real_application | 305 | 30.5% |
| tech_demo | 245 | 24.5% |
| case_study | 172 | 17.2% |
| product_announcement | 169 | 16.9% |
| interview_comment | 56 | 5.6% |
| tutorial | 43 | 4.3% |
| pilot_poc | 10 | 1.0% |

### Phase 4: Content Fixes & Usability

**Sparkles Duplicate Fix:**
- Removed LinkedIn duplicate `c06282e2` ("Meet Sparkles | Boston Dynamics") — wrongly classified as `real_application`/`industrial`/`pallet_transport`
- Added YouTube original `378b16cc` — correctly classified as `tech_demo`/`personal_service`/`companion`, educational_value=1

**Internal ID Display:**
- Added `#xxxxxxxx` (first 8 chars of UUID) to GalleryCard, MasonryGrid GridCard, and GalleryDetailModal
- Subtle monospace, selectable, full UUID in tooltip
- Enables admins and users to reference specific gallery items

**Utility Script:**
- Created `crawler/src/add_single_video.py` for crawling individual YouTube videos by URL

**Commit:** `f638995`

### Git Commits This Session

| Hash | Description |
|------|-------------|
| `577e9ed` | Align taxonomy with KG Axis 1: expand application_category from 3 to 5 values |
| `8c852fb` | Add application_category to reclassification script updates |
| `40d23b7` | Add medical and specialized task vocabulary to classifier and frontend |
| `f638995` | Fix transportation mislabeling, add internal IDs, and expand task vocabulary |

### Lessons Learned

1. **Prompt examples create bias** — The JSON example anchoring on "transportation" caused over-classification
2. **Vocabulary gaps cause misclassification** — Missing medical/entertainment tasks forced AI to pick wrong categories
3. **material_handling is NOT transportation** — A robot moving material is manipulation, not transport
4. **Cross-platform duplicates need deduplication** — LinkedIn reposts of YouTube videos create duplicates
5. **Internal IDs are essential** — Without reference codes, users cannot communicate about specific items
6. **Tasks are orthogonal to taxonomy axes** — They don't need to match the KG 7-axis structure

---

## Session 10: 2026-02-21 - Admin Interface Enhancement (In Progress)

### Overview

Enhancing the existing admin interface to support classification editing, manual content addition, and browse-mode review. Building on existing AdminModerationPage, ContentQueue, ItemReviewModal, and ReportsQueue components.

### Existing Admin Functions (Before Enhancement)

| Function | Component | Status |
|----------|-----------|--------|
| Content moderation queue | ContentQueue.tsx | Exists (approve/reject/flag) |
| Item review modal | ItemReviewModal.tsx | Exists (read-only metadata view) |
| Reports queue | ReportsQueue.tsx | Exists (dismiss/resolve) |
| Moderation stats | moderation-service.ts | Exists (counts) |

### Target Admin Functions (After Enhancement)

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | **Classification Editor** | Edit content_type, category, tasks, scene_type, educational_value for any item | P0 |
| 2 | **Manual URL Addition** | Admin pastes YouTube/article URL → system fetches, classifies, and stores | P0 |
| 3 | **Browse All Content** | Searchable, filterable table of all approved items with inline editing | P0 |
| 4 | **Batch Reclassify** | Select multiple items and trigger AI reclassification | P1 |
| 5 | **Edit History** | Track who changed what and when | P1 |
| 6 | **Duplicate Detection** | Find and merge cross-platform duplicates | P2 |
| 7 | **Admin Lock** | Prevent AI reclassification from overwriting human edits | P1 |
| 8 | **RSIP SSO Integration** | Login via RSIP V2 auth system (shared Supabase) | P1 |

### Implementation Plan

**Phase 1 (Current):** Classification Editor + Manual URL Addition + Browse View
**Phase 2:** Batch operations + Edit history + Admin lock
**Phase 3:** SSO integration + Duplicate detection

---

## Session 8: 2026-02-22 - Cross-Platform Taxonomy Synchronization

### Context

The 3 RSIP platforms (Video Library, V2, Knowledge Graph) share one Supabase database, but taxonomy values had diverged. The `environment_types` table used an old 3-category CHECK constraint, `application_categories` had 10 rows (5 legacy + 5 current), and the Video Library had real data for 6 scene types missing from the canonical DB.

### Changes

#### Migration 098: Platform Sync — Environment Types
- Deleted 5 orphan `application_categories` rows (legacy `industrial_automation`, `service_robotics`, etc.)
- Updated `environment_types.category` CHECK from 3-value (`industrial`/`service`/`special`) to 5-domain taxonomy
- Migrated 14 existing environment_types rows to correct 5-domain values (e.g., `hospital_healthcare`: `service` → `medical`)
- Inserted 6 new environment types: `laboratory_research` (338 items!), `logistics_center`, `restaurant_food_service`, `airport_terminal`, `residential_home`, `entertainment_venue`
- Reclassified `functional_requirements.category_filter` for medical/personal_service requirements

#### Migration 099: Reclassify Gallery Items to 5-Domain
- **Root cause found**: Migration 094 had bulk-mapped all items into only `industrial` and `professional_service`, leaving `medical`, `personal_service`, and `specialized_environment` with 0 items
- V2 team reported the 3 empty domains; analysis confirmed the content existed but was mislabeled
- Used `specific_tasks`, `scene_type`, `task_types`, and title keyword matching to reclassify items
- **Result**: medical: 64, personal_service: 55, specialized_environment: 30 (all were 0 before)

#### Frontend & Classifier Updates
- Added `dbEnvironmentKey` to `SCENE_INFO` — maps Video Library short keys to canonical `environment_types.environment_key` for cross-platform deep linking
- Removed quality filters temporarily: all content types visible, educational value minimum set to 1
- Fixed admin Browse Content editor: inline editor now appears directly below the edited row (was rendering outside the table at the bottom)
- Added 4 entertainment-specific tasks: `stage_performance`, `guided_tour`, `crowd_interaction`, `interactive_exhibit` (to frontend types, classifier prompt, valid list, and broad task mapping)

#### V2 Code Changes (outside this repo)
- Updated `v2/app/src/services/environment-types.ts`: mock data categories to 5-domain, added `laboratory_research`, removed dead `mapLegacyCategoryToTaxonomyDomain()` function
- Created `CROSS_PLATFORM_SYNC_SUMMARY_FOR_V2.md` handoff document for V2 team

### DB State After Migrations

| Table | Count | Notes |
|-------|-------|-------|
| `application_categories` | 5 | Clean: industrial, professional_service, personal_service, medical, specialized_environment |
| `environment_types` | 20 | 14 existing + 6 new, all with 5-domain categories |
| `application_gallery` | 1,450 | 1,361 approved + 89 pending; all 5 domains populated |
| `functional_requirements` | 119 | `category_filter` updated to 5-domain where applicable |

### Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/098_platform_sync_environments.sql` | NEW — environment sync migration |
| `supabase/migrations/099_reclassify_gallery_5_domain.sql` | NEW — gallery reclassification |
| `frontend/src/types/gallery.ts` | `dbEnvironmentKey` in SCENE_INFO, default filters, 4 new tasks |
| `frontend/src/components/admin/BrowseContent.tsx` | Inline editor fix |
| `crawler/src/processors/ai_classifier.py` | 4 new entertainment tasks in prompt, valid list, mapping |
| `CLAUDE.md` | Scene types table, migration numbering |
| `CROSS_PLATFORM_SYNC_SUMMARY_FOR_V2.md` | NEW — V2 team handoff |

---

*Log maintained by development team*
*Last updated: 2026-02-22*
