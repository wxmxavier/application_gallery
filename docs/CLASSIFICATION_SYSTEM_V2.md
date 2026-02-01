# Classification System V2 - Refined Labeling Methodology

## Problem Statement

The current gallery contains many videos showing basic robot capabilities (walking, moving, demos) rather than real-world applications. Users need to find **actual deployment examples** to understand what configurations they need, not marketing demos.

**Current Issues:**
1. No distinction between "demo" vs "real deployment"
2. No indication of deployment maturity (prototype vs production)
3. No business context (what problem does it solve?)
4. Low educational value content mixed with high-value case studies

---

## Proposed Classification Dimensions

### 1. CONTENT TYPE (NEW - Primary Filter)

| Type | Code | Description | Example |
|------|------|-------------|---------|
| **Real Application** | `real_application` | Deployed in actual business setting, solving real problems | "AMR fleet delivering parts at BMW factory" |
| **Pilot/POC** | `pilot_poc` | Trial deployment, proof of concept | "Testing delivery robots in hospital corridor" |
| **Case Study** | `case_study` | Documented deployment with results/metrics | "How Amazon reduced picking time by 40%" |
| **Tech Demo** | `tech_demo` | Capability demonstration, trade show, lab | "Spot robot dancing at CES" |
| **Product Announcement** | `product_announcement` | New product reveal, features showcase | "Introducing our new welding robot" |
| **Tutorial/Educational** | `tutorial` | How-to, integration guide, training | "How to configure AMR navigation" |

**UI Treatment:**
- Default filter: Show only `real_application`, `pilot_poc`, `case_study`
- "Include demos" toggle to show all content
- Visual badge indicating content type

---

### 2. DEPLOYMENT MATURITY (NEW)

| Level | Code | Indicators |
|-------|------|------------|
| **Production** | `production` | Running 24/7, multiple units, customer named |
| **Pilot** | `pilot` | Limited deployment, testing phase, evaluation |
| **Prototype** | `prototype` | R&D stage, lab environment, pre-commercial |
| **Concept** | `concept` | Simulation, rendering, planned capability |
| **Unknown** | `unknown` | Cannot determine from content |

---

### 3. APPLICATION CONTEXT (NEW)

```typescript
interface ApplicationContext {
  // Business problem addressed
  problem_solved?: string;  // e.g., "labor shortage", "quality consistency", "safety hazard"

  // Deployment scale
  deployment_scale?: 'single_unit' | 'small_fleet' | 'large_fleet' | 'facility_wide' | 'multi_site';

  // Integration level
  integration_level?: 'standalone' | 'semi_integrated' | 'fully_integrated';

  // Customer/site identified
  customer_identified: boolean;
  site_identified: boolean;

  // Results mentioned
  has_metrics: boolean;  // ROI, efficiency gains, etc.
  has_testimonial: boolean;  // Customer quotes
}
```

---

### 4. EDUCATIONAL VALUE SCORE (NEW)

Score 1-5 based on how useful this content is for RSIP users planning their own deployments:

| Score | Criteria |
|-------|----------|
| **5** | Full case study with metrics, integration details, lessons learned |
| **4** | Real deployment with good technical details shown |
| **3** | Real application visible but limited context |
| **2** | Capability demo with some application relevance |
| **1** | Pure marketing/entertainment, no practical value |

**UI Treatment:**
- Star rating displayed on cards
- Filter by minimum score (default: 3+)

---

### 5. REFINED TASK CLASSIFICATION

Current task types are too generic. Add specificity:

#### Industrial Tasks (Refined)
| Current | Refined Options |
|---------|-----------------|
| `transportation` | `pallet_transport`, `tote_transport`, `cart_towing`, `conveyor_loading`, `dock_to_stock` |
| `manipulation` | `machine_tending`, `assembly_insertion`, `screw_driving`, `cable_routing`, `surface_finishing` |
| `palletizing` | `case_palletizing`, `bag_palletizing`, `mixed_sku_palletizing`, `depalletizing` |
| `inspection` | `visual_inspection`, `dimensional_measurement`, `defect_detection`, `weld_inspection` |

#### Service Tasks (Refined)
| Current | Refined Options |
|---------|-----------------|
| `delivery_service` | `room_delivery`, `medication_delivery`, `food_delivery`, `mail_delivery`, `supply_replenishment` |
| `cleaning` | `floor_scrubbing`, `vacuum_cleaning`, `disinfection`, `window_cleaning`, `pool_cleaning` |
| `human_interaction` | `reception_greeting`, `wayfinding`, `information_kiosk`, `telepresence`, `companion` |

---

## Updated AI Classifier Prompt

```python
CLASSIFICATION_PROMPT_V2 = """
Analyze this robotics content and classify it for the RSIP Application Gallery.

CONTENT:
Title: {title}
Description: {description}
Source: {source_name}
Media Type: {media_type}

CLASSIFICATION TASKS:

1. CONTENT_TYPE (most important - choose one):
   - real_application: Robot deployed in actual business, solving real problems
   - pilot_poc: Trial deployment, proof of concept, evaluation phase
   - case_study: Documented deployment with results/metrics
   - tech_demo: Capability demonstration, trade show, lab demo, controlled environment
   - product_announcement: New product reveal, features showcase
   - tutorial: How-to, integration guide, training content

   INDICATORS for real_application:
   - Named customer or facility
   - Production environment visible (not a lab/showroom)
   - Multiple units working together
   - Integration with existing systems visible
   - Workers interacting naturally (not staged)

   INDICATORS for tech_demo:
   - Trade show booth visible
   - Lab/showroom environment
   - Narrator explaining features
   - "Demo", "showcase", "capability" in title
   - No business context

2. DEPLOYMENT_MATURITY:
   - production: Running in real operations, customer named
   - pilot: Limited/trial deployment
   - prototype: R&D, lab stage
   - concept: Simulation, rendering, future capability
   - unknown: Cannot determine

3. APPLICATION_CATEGORY (choose one):
   - industrial_automation
   - service_robotics
   - surveillance_security

4. SPECIFIC_TASK (be specific, choose 1-3):
   Industrial: pallet_transport, tote_transport, machine_tending, assembly_insertion,
              case_palletizing, depalletizing, visual_inspection, weld_inspection,
              screw_driving, material_handling, bin_picking, kitting
   Service: room_delivery, medication_delivery, floor_scrubbing, disinfection,
           reception_greeting, wayfinding, telepresence, inventory_scanning
   Security: perimeter_patrol, intrusion_detection, access_verification, remote_monitoring

5. SCENE_TYPE: warehouse, manufacturing, retail, hospital, office, hotel,
               outdoor, laboratory, construction, logistics_center, airport, restaurant

6. APPLICATION_CONTEXT:
   - problem_solved: What business problem? (e.g., "labor shortage", "safety hazard", "quality consistency")
   - deployment_scale: single_unit | small_fleet | large_fleet | facility_wide | multi_site
   - customer_identified: true/false
   - has_metrics: true/false (ROI, efficiency numbers mentioned?)

7. EDUCATIONAL_VALUE (1-5):
   5 = Full case study with metrics and lessons learned
   4 = Real deployment with good technical details
   3 = Real application but limited context
   2 = Demo with some application relevance
   1 = Pure marketing, no practical value for users

8. FUNCTIONAL_REQUIREMENTS (demonstrated capabilities):
   autonomous_navigation, obstacle_avoidance, slam, fleet_management,
   pick_and_place, bin_picking_3d, force_control, vision_guided,
   object_detection, barcode_scanning, ai_inference,
   human_detection, safety_rated, collaborative

Return JSON:
{{
  "content_type": "real_application",
  "deployment_maturity": "production",
  "application_category": "industrial_automation",
  "specific_tasks": ["pallet_transport", "dock_to_stock"],
  "scene_type": "warehouse",
  "application_context": {{
    "problem_solved": "labor shortage in night shift",
    "deployment_scale": "large_fleet",
    "customer_identified": true,
    "has_metrics": true
  }},
  "educational_value": 4,
  "functional_requirements": ["autonomous_navigation", "fleet_management"],
  "environment": {{
    "setting": "indoor",
    "human_presence": "collaborative"
  }},
  "summary": "Fleet of 50 AMRs handling pallet transport at BMW's Leipzig plant, integrated with WMS",
  "relevance_score": 0.95
}}

CRITICAL RULES:
- Be STRICT about content_type. Most YouTube videos are tech_demo, not real_application
- real_application requires EVIDENCE of actual business deployment
- Trade show demos are ALWAYS tech_demo, even if impressive
- If you see a lab/showroom environment, it's tech_demo
- Relevance score should reflect educational value for someone planning a deployment
"""
```

---

## Frontend Filter Updates

### 1. New Primary Filter Bar

```
[Content Type ▼] [Application ▼] [Task ▼] [Scene ▼] [Min Quality: ★★★☆☆]

☑ Real Deployments  ☑ Case Studies  ☑ Pilots  ☐ Tech Demos  ☐ Product News
```

### 2. Card Badge System

```
┌─────────────────────────────────────┐
│ [PRODUCTION] [★★★★☆]               │  <- Content type + quality
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │         Thumbnail               │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ AMR Fleet at BMW Leipzig            │
│ Industrial > Pallet Transport       │
│ 🏭 Warehouse  👥 Collaborative      │
│ "50 AMRs, 24/7 operation, WMS..."   │
└─────────────────────────────────────┘
```

### 3. Detail View Enhancements

```
APPLICATION CONTEXT
├── Problem Solved: Labor shortage, night shift coverage
├── Deployment Scale: Large fleet (50+ units)
├── Integration: WMS, ERP connected
└── Results: 40% productivity increase (mentioned)

WHAT YOU CAN LEARN
├── Fleet coordination in high-traffic areas
├── Integration with warehouse management systems
└── 24/7 operation considerations

RSIP CONFIGURATION HINTS
├── Category: Industrial Automation
├── Primary Task: Pallet Transport
├── Key Requirements: Fleet Management, WMS Integration
└── [→ Start Similar Configuration in RSIP]
```

---

## Database Schema Updates

```sql
-- Add new columns to application_gallery
ALTER TABLE application_gallery ADD COLUMN IF NOT EXISTS
  content_type VARCHAR(50) DEFAULT 'unknown';

ALTER TABLE application_gallery ADD COLUMN IF NOT EXISTS
  deployment_maturity VARCHAR(50) DEFAULT 'unknown';

ALTER TABLE application_gallery ADD COLUMN IF NOT EXISTS
  educational_value INTEGER DEFAULT 3 CHECK (educational_value BETWEEN 1 AND 5);

ALTER TABLE application_gallery ADD COLUMN IF NOT EXISTS
  specific_tasks TEXT[] DEFAULT '{}';

ALTER TABLE application_gallery ADD COLUMN IF NOT EXISTS
  application_context JSONB DEFAULT '{}';

-- Add indexes for new filters
CREATE INDEX IF NOT EXISTS idx_gallery_content_type ON application_gallery(content_type);
CREATE INDEX IF NOT EXISTS idx_gallery_educational_value ON application_gallery(educational_value);
CREATE INDEX IF NOT EXISTS idx_gallery_deployment_maturity ON application_gallery(deployment_maturity);

-- Add content type constraint
ALTER TABLE application_gallery ADD CONSTRAINT gallery_content_type_check
  CHECK (content_type IN ('real_application', 'pilot_poc', 'case_study',
                          'tech_demo', 'product_announcement', 'tutorial', 'unknown'));
```

---

## Migration Strategy for Existing Content

### Phase 1: Re-classify Existing Items
1. Export all 487 existing items
2. Run through new classifier with V2 prompt
3. Review items flagged as `tech_demo` with high confidence
4. Bulk update database

### Phase 2: Quality Threshold
1. Default view: `content_type IN ('real_application', 'case_study', 'pilot_poc') AND educational_value >= 3`
2. "Show all content" toggle reveals everything
3. Low-quality items (educational_value < 3) marked but not deleted

### Phase 3: Source Prioritization
Adjust crawler to prioritize sources with higher real-application content:
- **Tier 1** (prioritize): Company case study pages, industry news with deployment stories
- **Tier 2** (normal): Official YouTube channels
- **Tier 3** (reduce): General YouTube search, social media

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| % Real Applications | ~20% (estimated) | 60%+ in default view |
| Avg Educational Value | Unknown | 3.5+ in default view |
| User bounce rate | Unknown | Reduce by 30% |
| "Start in RSIP" clicks | Unknown | Track and increase |

---

## Implementation Priority

1. **High**: Update AI classifier prompt (immediate impact)
2. **High**: Add content_type filter to frontend
3. **Medium**: Add educational_value scoring and display
4. **Medium**: Re-classify existing content
5. **Low**: Detailed application_context fields
6. **Low**: Refined task taxonomy

---

## Appendix: Content Type Decision Tree

```
Is robot shown in actual business operation?
├── YES: Is customer/facility named?
│   ├── YES: Are metrics/results mentioned?
│   │   ├── YES → case_study
│   │   └── NO → real_application
│   └── NO: Does it look like production environment?
│       ├── YES → real_application
│       └── NO: Is it explicitly a trial/test?
│           ├── YES → pilot_poc
│           └── NO → tech_demo
└── NO: Is it a product launch/announcement?
    ├── YES → product_announcement
    └── NO: Is it educational/how-to content?
        ├── YES → tutorial
        └── NO → tech_demo
```
