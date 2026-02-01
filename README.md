# RSIP Application Gallery

Real-world robotics application showcase to help users understand what features they need for their own robot configurations.

## Overview

The RSIP Application Gallery is a standalone web application that aggregates and displays real-world robotics applications from multiple sources (company websites, YouTube, news, social media). Content is automatically classified according to the RSIP platform taxonomy, making it easy for users to find relevant examples when configuring their own robotic systems.

### Key Features

- **Application-Centric Organization** - Content organized by what robots DO, not what they ARE
- **RSIP Taxonomy Alignment** - Same categories, tasks, and requirements as RSIP platform
- **Multi-Source Aggregation** - Videos, photos, articles from YouTube, news, company websites
- **AI-Powered Classification** - Automatic tagging using Google Gemini
- **Deep Linking** - Filter gallery based on RSIP configuration context
- **Moderation Workflow** - Admin approval required before public display

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION GALLERY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐       ┌─────────────────────┐         │
│  │   CRAWLER SERVICE   │       │   FRONTEND APP      │         │
│  │   (Python)          │       │   (React/TypeScript)│         │
│  │                     │       │                     │         │
│  │  • YouTube API      │       │  • Browse/Search    │         │
│  │  • News RSS         │       │  • Filter by RSIP   │         │
│  │  • Gemini AI        │       │  • Detail View      │         │
│  └──────────┬──────────┘       └──────────┬──────────┘         │
│             │                              │                    │
│             └──────────────┬───────────────┘                    │
│                            ▼                                    │
│             ┌─────────────────────────────┐                    │
│             │      SUPABASE DATABASE      │                    │
│             │   (Shared with RSIP)        │                    │
│             └─────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Access to RSIP Supabase project

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with Supabase credentials

# Start development server
npm run dev
```

Access at: http://localhost:5174/

### Crawler Setup

```bash
cd crawler

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with API keys

# Run crawler
python src/main.py
```

## Project Structure

```
Video_Library/
├── README.md                    # This file
├── CLAUDE.md                    # AI assistant guidance
├── DEVELOPMENT_LOG.md           # Development history
├── docs/
│   ├── ADMIN_MANUAL.md         # Administrator guide
│   └── USER_MANUAL.md          # End-user guide
├── crawler/                     # Python crawler service
│   ├── src/
│   │   ├── main.py             # Entry point
│   │   ├── config.py           # Configuration
│   │   ├── crawlers/           # Source-specific crawlers
│   │   ├── processors/         # AI classification
│   │   └── storage/            # Database operations
│   ├── config/
│   │   └── sources.yaml        # Crawl targets
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                    # React/TypeScript app
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── services/           # API client
│   │   └── types/              # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
└── supabase/
    └── migrations/
        └── 085_application_gallery.sql
```

## RSIP Taxonomy

Content is classified according to RSIP platform concepts:

### Application Categories
| Category | Description |
|----------|-------------|
| `industrial_automation` | Factory, warehouse, manufacturing |
| `service_robotics` | Hospitality, healthcare, delivery |
| `surveillance_security` | Patrol, monitoring, access control |

### Task Types
- **Industrial:** transportation, inspection, manipulation, palletizing, welding, assembly
- **Service:** delivery_service, human_interaction, healthcare_assist, cleaning
- **Security:** perimeter_patrol, threat_detection, access_monitoring

### Scene Types
warehouse, manufacturing, retail, hospital, office, hotel, outdoor, laboratory

## Environment Variables

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Crawler (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
YOUTUBE_API_KEY=your-youtube-api-key
GOOGLE_AI_API_KEY=your-gemini-api-key
```

## Deep Linking

The gallery supports URL-based filtering for RSIP integration:

```
/browse?category=industrial_automation
/browse?category=service_robotics&tasks=delivery_service
/browse?category=industrial_automation&tasks=transportation&requirements=autonomous_navigation
/browse?scene=warehouse
/browse?search=welding+robot
```

## Content Sources

| Priority | Source | Content Type |
|----------|--------|--------------|
| 1 | Company Websites | Case studies, press releases |
| 2 | Industry News | Articles, announcements |
| 3 | YouTube | Official channel videos |
| 4 | Social Media | LinkedIn, X posts |

## Development

### Run Tests

```bash
# Frontend
cd frontend && npm test

# Crawler
cd crawler && pytest tests/
```

### Build for Production

```bash
# Frontend
cd frontend && npm run build

# Crawler Docker image
cd crawler && docker build -t gallery-crawler .
```

## Deployment

- **Frontend:** Vercel or Netlify
- **Crawler:** Google Cloud Run (scheduled job)
- **Database:** Supabase (shared with RSIP)

## Documentation

- [Admin Manual](docs/ADMIN_MANUAL.md) - For administrators managing content
- [User Manual](docs/USER_MANUAL.md) - For end users browsing the gallery
- [Development Log](DEVELOPMENT_LOG.md) - Project history

## License

Proprietary - RSIP Platform

## Contact

RSIP Development Team
