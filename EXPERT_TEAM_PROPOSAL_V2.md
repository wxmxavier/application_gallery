# Video Library & Crawler - Expert Team Analysis & Design Proposal (V2)

**Project:** RSIP Real-World Application Gallery
**Date:** 2026-01-30
**Version:** 2.0 (Revised based on stakeholder feedback)
**Status:** Proposal - Pending Approval

---

## Fundamental Design Philosophy Change

### Previous Approach (V1) - REJECTED
- Organized by robot brand/type
- Focus on "what robots exist"
- Generic video categorization

### New Approach (V2) - APPLICATION-CENTRIC
- Organized by **application scene** and **task type**
- Focus on "what can robots DO in real-world scenarios"
- Content aligned with RSIP platform taxonomy
- **Purpose**: Help users understand what features they need to configure for their own robot applications

---

## 1. Core Purpose & Value Proposition

### 1.1 Primary Purpose

> **"Show users real-world examples of robot applications to help them understand what features and configurations they need for their own use cases."**

The gallery is NOT a robot catalog. It is an **educational and inspirational resource** that:
1. Demonstrates what robots can accomplish in specific scenarios
2. Shows the environment, tasks, and functional requirements in action
3. Helps users map their needs to RSIP configuration options
4. Bridges the gap between abstract features and concrete applications

### 1.2 User Journey Integration

```
USER JOURNEY:

1. User enters RSIP to configure a robot application
   ↓
2. User selects application category (Industrial/Service/Security)
   ↓
3. User sees "View Real-World Examples" link
   ↓
4. Opens Application Gallery filtered to their category
   ↓
5. Browses photos/videos of similar applications
   ↓
6. Sees tagged: Tasks performed, Environment features, Functional requirements
   ↓
7. Returns to RSIP with better understanding of what to configure
   ↓
8. Completes scene definition with confidence
```

---

## 2. RSIP-Aligned Taxonomy

### 2.1 Primary Organization: Application Categories

| Category | Key | Description | Example Content |
|----------|-----|-------------|-----------------|
| **Industrial Automation** | `industrial_automation` | Factory, warehouse, manufacturing | AGV in warehouse, robotic arm assembly line |
| **Service Robotics** | `service_robotics` | Hospitality, healthcare, delivery | Hotel delivery robot, hospital assistant |
| **Surveillance & Security** | `surveillance_security` | Patrol, monitoring, access control | Security patrol robot, perimeter monitoring |

### 2.2 Secondary Organization: Task Types

Aligned with RSIP's unified task types:

**Industrial Automation:**
- `transportation` - Material transport, logistics
- `inspection` - Visual inspection, NDT, quality control
- `manipulation` - Pick & place, assembly, welding
- `palletizing` - Stacking, depalletizing

**Service Robotics:**
- `delivery_service` - Indoor/outdoor delivery
- `human_interaction` - Reception, guidance, telepresence
- `healthcare_assist` - Patient care, medication delivery
- `cleaning` - Floor cleaning, sanitization

**Surveillance & Security:**
- `perimeter_patrol` - Autonomous patrol routes
- `threat_detection` - Anomaly detection, intrusion
- `access_monitoring` - Entry/exit monitoring

### 2.3 Functional Requirement Tags

Content will be tagged with RSIP functional requirements (74 total):

**Navigation & Mobility:**
- `autonomous_navigation`, `obstacle_avoidance`, `precision_positioning`
- `outdoor_logistics_transport`, `elevator_integration`

**Manipulation:**
- `pick_and_place`, `bin_picking_3d`, `kitting_sorting`
- `screwdriving_precision`, `adhesive_dispensing`

**Inspection & Quality:**
- `quality_inspection`, `3d_scanning_metrology`, `thermal_inspection`
- `ultrasonic_ndt`, `acoustic_vibration`

**Service & Interaction:**
- `hri_multimodal`, `telepresence`, `visitor_reception`
- `indoor_delivery`, `hotel_room_service`

### 2.4 Environment Feature Tags

Based on RSIP environment properties:

| Feature | Values | Why It Matters |
|---------|--------|----------------|
| **Setting** | indoor, outdoor, mixed | Affects navigation, weatherproofing |
| **Lighting** | natural, artificial, low-light, variable | Affects vision systems |
| **Floor Type** | smooth, rough, multi-level, ramps | Affects mobility requirements |
| **Human Presence** | high-traffic, low-traffic, collaborative | Affects safety requirements |
| **Temperature** | controlled, variable, extreme | Affects hardware selection |
| **Cleanliness** | cleanroom, standard, dusty, wet | Affects IP rating needs |

### 2.5 Scene Type Tags

Aligned with RSIP preset scenes:

- `warehouse` - Smart Warehouse / 智能仓库
- `manufacturing` - Manufacturing Floor / 生产车间
- `retail` - Retail Store / 零售商店
- `hospital` - Hospital Ward / 医院病房
- `office` - Office Building / 办公大楼
- `hotel` - Hospitality / 酒店服务
- `outdoor` - Outdoor/Logistics / 户外物流
- `laboratory` - Research Lab / 研究实验室

---

## 3. Content Sources (Expanded)

### 3.1 Source Priority Matrix

| Priority | Source Type | Content Type | Reliability | Volume |
|----------|-------------|--------------|-------------|--------|
| **1** | Robotics Company Websites | Photos, Videos, Case Studies | High | Medium |
| **2** | Company News/Press Releases | Photos, Articles | High | Medium |
| **3** | Industry News Sites | Articles, Photos | Medium-High | High |
| **4** | YouTube (Official Channels) | Videos | Medium-High | High |
| **5** | LinkedIn (Company Pages) | Photos, Videos, Articles | Medium | Medium |
| **6** | X/Twitter (Official Accounts) | Photos, Short Videos | Medium | High |
| **7** | Research Publications | Papers with Images | High | Low |

### 3.2 Company Website Sources

**Industrial Automation:**
```
ABB Robotics:         abbfr/robotics/case-studies
KUKA:                 kuka.com/applications
FANUC:                fanucamerica.com/solutions
Universal Robots:     universal-robots.com/case-stories
Omron:                industrial.omron.com/applications
MiR:                  mobile-industrial-robots.com/case-studies
```

**Service Robotics:**
```
Boston Dynamics:      bostondynamics.com/solutions
Softbank Robotics:    softbankrobotics.com/case-studies
Bear Robotics:        bearrobotics.ai/case-studies
Relay Robotics:       relayrobotics.com/case-studies
Pudu Robotics:        pudurobotics.com/case-studies
```

**Security & Inspection:**
```
Knightscope:          knightscope.com/case-studies
Cobalt Robotics:      cobaltrobotics.com
ANYbotics:            anybotics.com/case-studies
Spot (BD):            bostondynamics.com/spot/applications
```

### 3.3 News & Media Sources

**Industry Publications:**
```
The Robot Report:     therobotreport.com
Robotics Business Review: roboticsbusinessreview.com
IEEE Spectrum Robotics: spectrum.ieee.org/robotics
Automation World:     automationworld.com
```

**Tech News:**
```
TechCrunch Robotics:  techcrunch.com/tag/robotics
Wired:                wired.com/tag/robots
MIT Technology Review: technologyreview.com/topic/robots
```

### 3.4 Social Media Sources

**LinkedIn Company Pages:**
- Follow official robotics company pages
- Monitor #robotics #automation #industry40 hashtags
- Capture case study announcements

**X/Twitter Accounts:**
- @BostonDynamics, @ABOROBOTICS, @kaborobotics
- @UniversalRobots, @FANABOROBOTICS, @MiR_Robots
- Hashtags: #robotics #automation #warehouse #manufacturing

### 3.5 Content Types

| Type | Format | Storage | Display |
|------|--------|---------|---------|
| **Video** | MP4/WebM embed | YouTube/Vimeo embed URL | Embedded player |
| **Photo** | JPG/PNG/WebP | Supabase Storage or external URL | Image gallery |
| **Article** | HTML/Markdown | Link + summary | Card with excerpt |
| **Case Study** | PDF/HTML | Link + key points | Detailed card |

---

## 4. Content Analysis & Labeling Strategy

### 4.1 The Challenge

Content from various sources needs to be tagged with RSIP-aligned attributes:
- Application category
- Task types
- Functional requirements
- Environment features
- Scene type

### 4.2 Multi-Layer Analysis Approach

```
CONTENT ANALYSIS PIPELINE:

Layer 1: Metadata Extraction (Automatic)
├── Title, description, tags from source
├── Company/brand identification
├── Publication date
└── Media type detection

Layer 2: AI-Powered Classification (Semi-Automatic)
├── Gemini API analysis of text + thumbnail
├── Map to RSIP taxonomy
├── Confidence scoring (0-1)
└── Flag low-confidence items for review

Layer 3: Manual Curation (Human Review)
├── Review AI classifications
├── Add missing tags
├── Verify application relevance
└── Approve for public display
```

### 4.3 AI Classification Prompt (Revised for RSIP)

```python
RSIP_CLASSIFICATION_PROMPT = """
Analyze this robotics content and classify it according to the RSIP platform taxonomy.

CONTENT:
Title: {title}
Description: {description}
Source: {source_name}
Media Type: {media_type}

CLASSIFY INTO:

1. APPLICATION_CATEGORY (choose one):
   - industrial_automation: Factory, warehouse, manufacturing applications
   - service_robotics: Hospitality, healthcare, delivery, assistance
   - surveillance_security: Patrol, monitoring, access control

2. TASK_TYPES (choose 1-3 most relevant):
   Industrial: transportation, inspection, manipulation, palletizing, welding, assembly
   Service: delivery_service, human_interaction, healthcare_assist, cleaning
   Security: perimeter_patrol, threat_detection, access_monitoring

3. FUNCTIONAL_REQUIREMENTS (choose 1-5 most demonstrated):
   Navigation: autonomous_navigation, obstacle_avoidance, precision_positioning
   Manipulation: pick_and_place, bin_picking_3d, kitting_sorting
   Inspection: quality_inspection, thermal_inspection, 3d_scanning
   Service: indoor_delivery, hri_multimodal, telepresence

4. ENVIRONMENT_FEATURES:
   Setting: indoor | outdoor | mixed
   Human_presence: high_traffic | low_traffic | collaborative | none
   Floor_type: smooth | rough | multi_level
   Lighting: natural | artificial | variable | low_light

5. SCENE_TYPE (choose one):
   warehouse, manufacturing, retail, hospital, office, hotel, outdoor, laboratory

Return JSON:
{
  "application_category": "...",
  "task_types": ["...", "..."],
  "functional_requirements": ["...", "..."],
  "environment": {
    "setting": "...",
    "human_presence": "...",
    "floor_type": "...",
    "lighting": "..."
  },
  "scene_type": "...",
  "relevance_score": 0.85,
  "confidence": {
    "application": 0.9,
    "tasks": 0.8,
    "requirements": 0.7
  },
  "summary": "One sentence describing the application demonstrated"
}
"""
```

### 4.4 Video Frame Analysis (Future Enhancement)

For video content, we can enhance classification by:

```python
# Frame extraction for visual analysis
async def analyze_video_frames(video_url: str) -> dict:
    # Extract key frames (thumbnail, 25%, 50%, 75%)
    frames = extract_key_frames(video_url, count=4)

    # Send frames to Gemini Vision API
    visual_analysis = await gemini_vision.analyze(
        frames,
        prompt="""
        Analyze these video frames from a robotics demonstration.
        Identify:
        - Type of robot visible (arm, mobile, humanoid, etc.)
        - Environment setting (warehouse, office, hospital, etc.)
        - Tasks being performed (picking, inspection, delivery, etc.)
        - Visible equipment and infrastructure
        """
    )

    return visual_analysis
```

### 4.5 Manual Labeling Interface

For Phase 1, provide admin interface for manual tagging:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CONTENT LABELING INTERFACE                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Thumbnail/Preview]              METADATA                              │
│                                   Title: Warehouse AGV System Demo      │
│                                   Source: KUKA Robotics                 │
│                                   Type: Video (3:45)                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  APPLICATION CATEGORY:            AI Suggestion: industrial_automation  │
│  ○ Industrial Automation  ● Service Robotics  ○ Surveillance/Security  │
│                                                                          │
│  TASK TYPES (select all that apply):                                    │
│  ☑ transportation  ☐ inspection  ☐ manipulation  ☐ palletizing         │
│  ☐ delivery_service  ☐ human_interaction  ☐ cleaning                   │
│                                                                          │
│  FUNCTIONAL REQUIREMENTS:                                                │
│  ☑ autonomous_navigation  ☑ obstacle_avoidance  ☐ precision_positioning│
│  ☐ pick_and_place  ☐ quality_inspection  ☑ fleet_management            │
│                                                                          │
│  ENVIRONMENT:                                                            │
│  Setting: [Indoor ▼]  Human Presence: [Low Traffic ▼]                   │
│  Floor: [Smooth ▼]    Lighting: [Artificial ▼]                          │
│                                                                          │
│  SCENE TYPE: [Warehouse ▼]                                              │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  [Skip]  [Save as Draft]  [Reject]  [Approve & Publish]                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Revised Database Schema

### 5.1 Primary Table: `application_gallery`

```sql
CREATE TABLE application_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content identification
  external_id VARCHAR(255),
  source_type VARCHAR(50) NOT NULL
    CHECK (source_type IN ('company_website', 'news', 'youtube', 'linkedin',
                           'twitter', 'research', 'case_study', 'other')),
  source_url TEXT NOT NULL,
  source_name VARCHAR(255),           -- Company or publication name

  -- Content metadata
  title VARCHAR(500) NOT NULL,
  title_zh VARCHAR(500),              -- Chinese translation
  description TEXT,
  description_zh TEXT,
  media_type VARCHAR(50) NOT NULL
    CHECK (media_type IN ('video', 'photo', 'article', 'case_study', 'gallery')),
  thumbnail_url TEXT,
  content_url TEXT,                   -- Embed URL or image URL
  duration_seconds INTEGER,           -- For videos
  published_at TIMESTAMP WITH TIME ZONE,

  -- RSIP-ALIGNED CLASSIFICATION (Core Change)
  application_category VARCHAR(50) NOT NULL
    CHECK (application_category IN ('industrial_automation', 'service_robotics',
                                     'surveillance_security')),
  task_types TEXT[] DEFAULT '{}',     -- RSIP task type keys
  functional_requirements TEXT[] DEFAULT '{}',  -- RSIP requirement keys
  scene_type VARCHAR(50),             -- warehouse, manufacturing, retail, etc.

  -- Environment features
  environment_setting VARCHAR(50)     -- indoor, outdoor, mixed
    CHECK (environment_setting IN ('indoor', 'outdoor', 'mixed')),
  environment_features JSONB DEFAULT '{}',  -- Detailed environment properties

  -- Robot identification (secondary, not primary organization)
  robot_names TEXT[] DEFAULT '{}',
  robot_types TEXT[] DEFAULT '{}',    -- arm, mobile, humanoid, etc.
  manufacturers TEXT[] DEFAULT '{}',

  -- AI analysis results
  ai_classification JSONB,            -- Full AI response
  ai_confidence JSONB,                -- Per-field confidence scores
  ai_summary TEXT,
  ai_summary_zh TEXT,

  -- Moderation
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'archived')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,

  -- Crawl tracking
  crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  crawler_source VARCHAR(100),
  crawler_run_id VARCHAR(100),

  -- Engagement
  view_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  featured_order INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(source_type, external_id)
);

-- Indexes optimized for RSIP-aligned queries
CREATE INDEX idx_gallery_category ON application_gallery(application_category);
CREATE INDEX idx_gallery_task_types ON application_gallery USING GIN(task_types);
CREATE INDEX idx_gallery_requirements ON application_gallery USING GIN(functional_requirements);
CREATE INDEX idx_gallery_scene_type ON application_gallery(scene_type);
CREATE INDEX idx_gallery_environment ON application_gallery(environment_setting);
CREATE INDEX idx_gallery_status ON application_gallery(status);
CREATE INDEX idx_gallery_media_type ON application_gallery(media_type);
CREATE INDEX idx_gallery_featured ON application_gallery(featured, featured_order);

-- Full-text search
CREATE INDEX idx_gallery_search ON application_gallery
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### 5.2 Helper Function: Search by RSIP Context

```sql
-- Search gallery based on user's RSIP configuration context
CREATE OR REPLACE FUNCTION search_gallery_by_context(
  p_category VARCHAR,
  p_task_types TEXT[],
  p_requirements TEXT[],
  p_scene_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS SETOF application_gallery AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM application_gallery
  WHERE status = 'approved'
    AND application_category = p_category
    AND (p_task_types IS NULL OR task_types && p_task_types)
    AND (p_requirements IS NULL OR functional_requirements && p_requirements)
    AND (p_scene_type IS NULL OR scene_type = p_scene_type)
  ORDER BY
    -- Prioritize by relevance (more matching tags = higher)
    COALESCE(array_length(task_types & p_task_types, 1), 0) +
    COALESCE(array_length(functional_requirements & p_requirements, 1), 0) DESC,
    featured DESC,
    view_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. RSIP Integration Design

### 6.1 Integration Points in RSIP

```
RSIP SCENE DEFINITION FLOW:

Step 1: Select Application Category
┌─────────────────────────────────────────────────────────────────┐
│  Choose your application type:                                   │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Industrial  │ │   Service    │ │  Security    │            │
│  │  Automation  │ │   Robotics   │ │  & Patrol    │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  [📷 View Real-World Examples] ← Links to Application Gallery   │
└─────────────────────────────────────────────────────────────────┘

Step 2: Select Task Types
┌─────────────────────────────────────────────────────────────────┐
│  What tasks will your robot perform?                             │
│                                                                  │
│  ☑ Transportation    ☐ Inspection    ☐ Manipulation             │
│                                                                  │
│  [📷 See Transportation Examples] ← Filtered gallery link       │
└─────────────────────────────────────────────────────────────────┘

Step 3: Configure Functional Requirements
┌─────────────────────────────────────────────────────────────────┐
│  Select required capabilities:                                   │
│                                                                  │
│  ☑ Autonomous Navigation    ☑ Obstacle Avoidance                │
│  ☐ Precision Positioning    ☐ Fleet Management                  │
│                                                                  │
│  [📷 See Examples with These Features] ← Filtered by requirements│
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 URL Structure for Deep Linking

```
Base URL: https://gallery.rsip-platform.com

Deep Links from RSIP:

By Category:
/browse?category=industrial_automation
/browse?category=service_robotics

By Task Type:
/browse?category=industrial_automation&tasks=transportation,inspection

By Functional Requirements:
/browse?category=service_robotics&tasks=delivery_service&requirements=autonomous_navigation,obstacle_avoidance

By Scene Type:
/browse?scene=warehouse
/browse?scene=hospital&category=service_robotics

Combined (from RSIP context):
/browse?category=industrial_automation&tasks=transportation&requirements=autonomous_navigation,fleet_management&scene=warehouse
```

### 6.3 Context-Aware "View Examples" Component

```typescript
// In RSIP platform - contextual gallery link
interface GalleryLinkProps {
  category?: ApplicationCategory;
  taskTypes?: string[];
  requirements?: string[];
  sceneType?: string;
}

const ViewExamplesButton: React.FC<GalleryLinkProps> = ({
  category,
  taskTypes,
  requirements,
  sceneType
}) => {
  const buildGalleryUrl = () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (taskTypes?.length) params.set('tasks', taskTypes.join(','));
    if (requirements?.length) params.set('requirements', requirements.join(','));
    if (sceneType) params.set('scene', sceneType);
    return `${GALLERY_URL}/browse?${params}`;
  };

  return (
    <a
      href={buildGalleryUrl()}
      target="_blank"
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
    >
      <CameraIcon className="w-4 h-4" />
      View Real-World Examples
    </a>
  );
};
```

---

## 7. Crawler Architecture (Revised)

### 7.1 Multi-Source Crawler Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONTENT AGGREGATION SERVICE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ Website Crawler  │  │ Social Crawler   │  │ News Aggregator  │      │
│  │                  │  │                  │  │                  │      │
│  │ • Company sites  │  │ • LinkedIn API   │  │ • RSS feeds      │      │
│  │ • Case studies   │  │ • Twitter API    │  │ • News APIs      │      │
│  │ • Press releases │  │ • YouTube API    │  │ • Google News    │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           │                     │                     │                 │
│           └─────────────────────┼─────────────────────┘                 │
│                                 ▼                                        │
│                    ┌─────────────────────────┐                          │
│                    │   Content Normalizer    │                          │
│                    │   • Extract metadata    │                          │
│                    │   • Detect media type   │                          │
│                    │   • Download thumbnails │                          │
│                    └────────────┬────────────┘                          │
│                                 ▼                                        │
│                    ┌─────────────────────────┐                          │
│                    │   RSIP Classifier       │                          │
│                    │   (Gemini API)          │                          │
│                    │   • Category mapping    │                          │
│                    │   • Task identification │                          │
│                    │   • Requirement tagging │                          │
│                    │   • Environment analysis│                          │
│                    └────────────┬────────────┘                          │
│                                 ▼                                        │
│                    ┌─────────────────────────┐                          │
│                    │   Quality Filter        │                          │
│                    │   • Relevance > 0.6     │                          │
│                    │   • Not duplicate       │                          │
│                    │   • Has valid media     │                          │
│                    └────────────┬────────────┘                          │
│                                 ▼                                        │
│                    ┌─────────────────────────┐                          │
│                    │   Supabase Storage      │                          │
│                    │   (status = 'pending')  │                          │
│                    └─────────────────────────┘                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Crawler Configuration

```yaml
# config/sources.yaml

company_websites:
  - name: "Boston Dynamics"
    base_url: "https://bostondynamics.com"
    case_studies_path: "/solutions"
    press_path: "/resources/press-releases"
    default_category: "industrial_automation"
    priority: 1

  - name: "Universal Robots"
    base_url: "https://www.universal-robots.com"
    case_studies_path: "/case-stories"
    default_category: "industrial_automation"
    priority: 1

  - name: "Bear Robotics"
    base_url: "https://www.bearrobotics.ai"
    case_studies_path: "/case-studies"
    default_category: "service_robotics"
    priority: 1

social_media:
  youtube:
    channels:
      - id: "UC7vVhkEfw4nOGp8TyDk7RcQ"  # Boston Dynamics
        name: "Boston Dynamics"
        default_category: "industrial_automation"
      - id: "UCqGn1f0O7c4qAFbWjNxNS3A"  # Universal Robots
        name: "Universal Robots"
        default_category: "industrial_automation"
    search_queries:
      - query: "warehouse robot automation"
        category: "industrial_automation"
        tasks: ["transportation"]
      - query: "hospital delivery robot"
        category: "service_robotics"
        tasks: ["healthcare_assist", "delivery_service"]

  linkedin:
    company_pages:
      - "boston-dynamics"
      - "universal-robots"
      - "kuka"
    hashtags:
      - "#robotics"
      - "#warehouseautomation"
      - "#servicerobots"

  twitter:
    accounts:
      - "@BostonDynamics"
      - "@UniversalRobots"
    hashtags:
      - "#robotics"
      - "#automation"

news_sources:
  rss_feeds:
    - name: "The Robot Report"
      url: "https://www.therobotreport.com/feed/"
      priority: 1
    - name: "IEEE Spectrum Robotics"
      url: "https://spectrum.ieee.org/feeds/topic/robotics"
      priority: 1
```

### 7.3 Scheduled Crawl Strategy

```yaml
# Crawl schedule (Cloud Scheduler)

daily_crawl:
  time: "02:00 UTC"
  sources:
    - youtube_channels      # New videos from followed channels
    - youtube_search        # Search queries
    - news_rss              # News articles

weekly_crawl:
  time: "Sunday 04:00 UTC"
  sources:
    - company_websites      # Case studies (less frequent updates)
    - linkedin_company      # Company posts

on_demand:
  trigger: "manual or webhook"
  sources:
    - specific_url          # Admin-submitted URL for processing
```

---

## 8. Frontend Design (Application-Centric)

### 8.1 Browse Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RSIP Application Gallery            [🔍 Search]  [+ Suggest Content]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  BROWSE BY APPLICATION                                                   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │   🏭 Industrial  │ │   🤖 Service     │ │   🛡️ Security   │        │
│  │   Automation     │ │   Robotics       │ │   & Surveillance │        │
│  │   (847 items)    │ │   (423 items)    │ │   (156 items)    │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  FILTER BY:                                                              │
│  Task: [All ▼]  Scene: [All ▼]  Media: [All ▼]  Environment: [All ▼]   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  FEATURED APPLICATIONS                                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │
│  │ [📷 Photo]      │ │ [▶️ Video]      │ │ [📄 Case Study] │           │
│  ├─────────────────┤ ├─────────────────┤ ├─────────────────┤           │
│  │ Warehouse AGV   │ │ Hospital Delivery│ │ Factory QC      │           │
│  │ Fleet System    │ │ Robot in Action │ │ Inspection      │           │
│  │                 │ │                 │ │                 │           │
│  │ 📍 Warehouse    │ │ 📍 Hospital     │ │ 📍 Manufacturing│           │
│  │ 🎯 Transport    │ │ 🎯 Delivery     │ │ 🎯 Inspection   │           │
│  │ ⚙️ Navigation   │ │ ⚙️ HRI          │ │ ⚙️ Vision       │           │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘           │
│                                                                          │
│  [Load More...]                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Content Card Design

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │         [Thumbnail/Preview]         ││  ← Photo or Video thumbnail
│  │                                     ││
│  │  📷 Photo  │  ▶️ 3:45              ││  ← Media type badge
│  └─────────────────────────────────────┘│
│                                         │
│  Autonomous Warehouse Navigation        │  ← Title
│  ────────────────────────────────────── │
│  AGV system handling 500+ daily         │  ← Description (2 lines)
│  shipments in temperature-controlled... │
│  ────────────────────────────────────── │
│  📍 Warehouse  •  🏢 KUKA              │  ← Scene + Source
│  ────────────────────────────────────── │
│  DEMONSTRATES:                          │
│  🎯 transportation  autonomous_nav     │  ← Task + Requirements
│  ⚙️ fleet_management  obstacle_avoid   │
│  ────────────────────────────────────── │
│  ENVIRONMENT:                           │
│  🏠 Indoor  👥 Low Traffic  💡 Artificial│ ← Environment tags
└─────────────────────────────────────────┘
```

### 8.3 Detail Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [←]                                                           [✕]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                     ││
│  │                    [Video Player / Image Gallery]                   ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Autonomous Warehouse Navigation System                                  │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                          │
│  This demonstration shows a fleet of 12 AGVs operating in a            │
│  temperature-controlled warehouse, handling over 500 shipments daily... │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  APPLICATION DETAILS                     RSIP CONFIGURATION HINTS       │
│  ┌────────────────────────────┐         ┌────────────────────────────┐ │
│  │ Category: Industrial Auto  │         │ To build similar:          │ │
│  │ Scene: Warehouse           │         │                            │ │
│  │ Tasks:                     │         │ 1. Select "Industrial"     │ │
│  │   • Transportation         │         │ 2. Choose "Transportation" │ │
│  │   • Fleet coordination     │         │ 3. Enable:                 │ │
│  │                            │         │    ✓ Autonomous navigation │ │
│  │ Requirements:              │         │    ✓ Fleet management      │ │
│  │   • autonomous_navigation  │         │    ✓ Obstacle avoidance    │ │
│  │   • fleet_management       │         │                            │ │
│  │   • obstacle_avoidance     │         │ [Open in RSIP →]           │ │
│  │   • auto_docking           │         │                            │ │
│  └────────────────────────────┘         └────────────────────────────┘ │
│                                                                          │
│  ENVIRONMENT                             SOURCE                         │
│  ┌────────────────────────────┐         ┌────────────────────────────┐ │
│  │ Setting: Indoor            │         │ KUKA Robotics              │ │
│  │ Floor: Smooth concrete     │         │ Case Study • 2025-12-15    │ │
│  │ Lighting: Artificial       │         │                            │ │
│  │ Human presence: Low        │         │ [Visit Original →]         │ │
│  │ Temperature: Controlled    │         │                            │ │
│  └────────────────────────────┘         └────────────────────────────┘ │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  SIMILAR APPLICATIONS                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ [thumb]  │ │ [thumb]  │ │ [thumb]  │ │ [thumb]  │                   │
│  │ AGV...   │ │ AMR...   │ │ Fleet... │ │ Ware...  │                   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Plan (Revised)

### Phase 1: Foundation (Days 1-3)
- [ ] Apply revised database schema
- [ ] Create RSIP-aligned taxonomy reference tables
- [ ] Set up development environments
- [ ] Design manual labeling interface

### Phase 2: Manual Content Seeding (Days 4-7)
- [ ] Curate 50-100 high-quality examples manually
- [ ] Cover all 3 application categories
- [ ] Cover top 10 task types
- [ ] Create labeling guidelines document
- [ ] Build admin labeling interface

### Phase 3: Crawler Development (Days 8-14)
- [ ] Website crawler for company case studies
- [ ] YouTube crawler with RSIP classification
- [ ] News/RSS aggregator
- [ ] Social media monitor (LinkedIn, X)
- [ ] AI classification pipeline with Gemini

### Phase 4: Frontend Development (Days 15-21)
- [ ] Application-centric browse page
- [ ] Filter by RSIP taxonomy
- [ ] Content detail modal with "RSIP hints"
- [ ] Responsive design
- [ ] RSIP deep-link integration

### Phase 5: Integration & Polish (Days 22-25)
- [ ] RSIP "View Examples" buttons
- [ ] Context-aware filtering
- [ ] Performance optimization
- [ ] Documentation

---

## 10. Key Differences from V1

| Aspect | V1 (Rejected) | V2 (Proposed) |
|--------|---------------|---------------|
| **Primary Organization** | Robot brand/type | Application scene/task |
| **Taxonomy** | Generic video tags | RSIP-aligned (categories, tasks, requirements) |
| **Purpose** | "Show cool robots" | "Help users configure their applications" |
| **Content Sources** | YouTube only | Company sites, news, social, case studies |
| **Media Types** | Video only | Photos, videos, articles, case studies |
| **User Value** | Entertainment | Educational/Configurational |
| **RSIP Integration** | Generic links | Context-aware deep linking |

---

## 11. Approval Request

### Decisions Required:

1. **Application-Centric Approach** - Agree with organizing by application scene rather than robot brand?

2. **RSIP Taxonomy Alignment** - Confirm using RSIP's 3 categories, 12+ task types, 74 functional requirements?

3. **Multi-Source Strategy** - Approve expanded sources (company sites, social media, news)?

4. **Manual Seeding Phase** - Accept starting with 50-100 manually curated items before automation?

5. **"RSIP Configuration Hints"** - Include guidance in detail view showing how to configure similar applications?

---

**Awaiting your confirmation to proceed with implementation.**
