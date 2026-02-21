# V2 Taxonomy Alignment: Recommendation for the V2 Team

**Date**: 2026-02-21
**From**: Video Library team
**Re**: Aligning migration 087 with migration 094 (single-column approach)

---

## Summary

Both teams independently implemented the 3→5 category expansion for `application_gallery`, but used conflicting approaches:

| | Migration 087 (V2) | Migration 094 (Video Library) |
|---|---|---|
| **Strategy** | Dual-column: add `taxonomy_domain`, keep `application_category` with old values | Single-column: rename values inside `application_category` |
| **DB result** | Two columns, branching logic in every query | One column, clean vocabulary |

**Decision**: Keep the 094 single-column approach. It is simpler to maintain long-term — one column, one vocabulary, no fallback logic, no ambiguity over which column is the source of truth.

**Current DB state** (after 094 applied):
- `application_category` = new 5 values (`industrial`, `professional_service`, `personal_service`, `medical`, `specialized_environment`)
- `taxonomy_domain` = stale values from 087 mapping (will be dropped by migration 095)

---

## What the V2 team needs to change

### 1. Database: Drop migration 087 artifacts

Migration 095 (already prepared in `Video_Library/supabase/migrations/095_drop_taxonomy_domain.sql`) will:
- Drop the `chk_taxonomy_domain` constraint
- Drop the `idx_gallery_taxonomy_domain` index
- Drop the `taxonomy_domain` column

**Apply 095 only after V2 code changes are deployed.**

### 2. Mapping disagreement: `surveillance_security`

| Source | `surveillance_security` maps to |
|---|---|
| Migration 087 | `specialized_environment` |
| Migration 094 | `professional_service` |

**Resolution**: `professional_service` is correct. Security patrol, facility inspection, and access monitoring are professional services. `specialized_environment` is reserved for defense, hazardous environments, space, and underwater — categories with few or no items currently.

### 3. TypeScript type changes

**File: `services/gallery-service.ts`**

```typescript
// BEFORE (old 3 values)
export type ApplicationCategory = 'industrial_automation' | 'service_robotics' | 'surveillance_security';

// AFTER (new 5 values — matches DB after migration 094)
export type ApplicationCategory =
  | 'industrial'
  | 'professional_service'
  | 'personal_service'
  | 'medical'
  | 'specialized_environment';
```

**Remove** the `TaxonomyDomain` type entirely — it is now identical to `ApplicationCategory`.

**Remove** the `taxonomy_domain` field from `GalleryItem` and `GalleryFilters` interfaces.

**Remove** both mapping functions:
- `mapLegacyCategoryToTaxonomyDomain()` — no longer needed
- `mapTaxonomyDomainToLegacyCategory()` — no longer needed

**Remove** the `getByTaxonomyDomain()` method and its fallback logic. Replace with direct `getItems({ category: domain })`.

**Simplify** query logic:
```typescript
// BEFORE (branching)
if (filters.taxonomy_domain) {
  query = query.eq('taxonomy_domain', filters.taxonomy_domain);
} else if (filters.category) {
  query = query.eq('application_category', filters.category);
}

// AFTER (direct)
if (filters.category) {
  query = query.eq('application_category', filters.category);
}
```

### 4. Config changes

**File: `config/gallery-config.ts`**

Replace `CATEGORY_INFO` keys with new values. Remove the `taxonomyDomain` field from each entry (redundant — the key IS the domain now):

```typescript
export const CATEGORY_INFO: Record<ApplicationCategory, {
  label: string;
  labelZh: string;
  icon: string;
  colorClass: string;
  description: string;
  descriptionZh: string;
}> = {
  industrial: {
    label: 'Industrial',
    labelZh: '工业',
    icon: '🏭',
    colorClass: 'category-industrial',
    description: 'Manufacturing, assembly, and production robotics',
    descriptionZh: '制造、装配和生产机器人',
  },
  professional_service: {
    label: 'Professional Service',
    labelZh: '专业服务',
    icon: '🤖',
    colorClass: 'category-service',
    description: 'Delivery, hospitality, cleaning, security, agriculture, education',
    descriptionZh: '配送、酒店、清洁、安防、农业、教育机器人',
  },
  personal_service: {
    label: 'Personal Service',
    labelZh: '个人服务',
    icon: '🏠',
    colorClass: 'category-personal',
    description: 'Domestic, companion, and entertainment robots',
    descriptionZh: '家用、陪伴和娱乐机器人',
  },
  medical: {
    label: 'Medical',
    labelZh: '医疗',
    icon: '🏥',
    colorClass: 'category-medical',
    description: 'Surgical, rehabilitation, pharmacy, and diagnostic robots',
    descriptionZh: '手术、康复、药房和诊断机器人',
  },
  specialized_environment: {
    label: 'Specialized',
    labelZh: '特种环境',
    icon: '🛡️',
    colorClass: 'category-security',
    description: 'Defense, hazardous, space, and underwater robots',
    descriptionZh: '国防、危险环境、太空和水下机器人',
  },
};
```

**Remove** `TAXONOMY_DOMAIN_INFO` entirely — its content is now merged into `CATEGORY_INFO`.

**Update** `GALLERY_STATS_FALLBACK`:
```typescript
export const GALLERY_STATS_FALLBACK = {
  total: 487,
  videos: 123,
  images: 194,
  articles: 170,
  categories: {
    industrial: 200,
    professional_service: 287,  // former service_robotics + surveillance_security
    personal_service: 0,
    medical: 0,
    specialized_environment: 0,
  },
};
```

### 5. Component changes

**File: `components/gallery/ExamplesDrawer.tsx`** (lines 195-210)

Remove the dual-column branching:

```typescript
// BEFORE — branching between taxonomy_domain and application_category
const domainInfo = item.taxonomy_domain
  ? TAXONOMY_DOMAIN_INFO[item.taxonomy_domain as keyof typeof TAXONOMY_DOMAIN_INFO]
  : null;
const catInfo = CATEGORY_INFO[item.application_category];
const info = domainInfo || catInfo;

// AFTER — direct lookup
const info = CATEGORY_INFO[item.application_category];
```

**File: `components/workspace/EnhancedLeftPanel.tsx`**

This file has heavy usage of old category keys in switch statements, ternary chains, and inline styles. All `'industrial_automation'`, `'service_robotics'`, `'surveillance_security'` references need updating to the new 5-value vocabulary. Consider extracting the color/icon logic into a lookup map to avoid long ternary chains for 5 values.

**File: `components/workspace/EnhancedModeUIv2Working.tsx`**

Contains filter matching logic and inline category color maps using old keys — same treatment as EnhancedLeftPanel.

### 6. Other files with old category references

| File | Lines | What to change |
|---|---|---|
| `types/scene-configuration.ts` | 1126, 1146, 1166 | `applicationCategory` values in type defaults |
| `services/hierarchical-tasks.ts` | 80, 94, 108 | `categoryKey` values |
| `services/environment-types.ts` | 272 | Comment referencing taxonomy_domain |
| `components/workspace/EnhancedModeUIv2Improved.tsx` | 1137 | Category-to-scene mapping |

---

## Deployment order

1. **V2 team**: Update all code to use new `ApplicationCategory` values, remove `taxonomy_domain` references
2. **V2 team**: Deploy updated code (queries will read `application_category` with new values — works immediately since 094 is already applied)
3. **Both teams**: Apply migration 095 to drop the `taxonomy_domain` column

Step 3 can be done any time after step 2. The column is harmless while it exists — it just shouldn't be queried anymore.

---

## Quick reference: value mapping

| Old value (pre-094) | New value (post-094) |
|---|---|
| `industrial_automation` | `industrial` |
| `service_robotics` | `professional_service` |
| `surveillance_security` | `professional_service` |
| *(new)* | `personal_service` |
| *(new)* | `medical` |
| *(new)* | `specialized_environment` |
