# Cross-Platform Taxonomy Sync — Summary for V2 Team

**Date**: 2026-02-21
**Author**: Video Library team (via Claude Code)
**Migration**: `098_platform_sync_environments.sql`

---

## Why This Was Done

The three RSIP platforms (Video Library, V2, Knowledge Graph) share one Supabase database, but their taxonomy values had diverged:

- **`application_categories`** had 10 rows (5 legacy + 5 current) — should be exactly 5
- **`environment_types.category`** still used the old 3-value CHECK (`industrial`/`service`/`special`) instead of the 5-domain taxonomy that migration 097 established everywhere else
- **`environment_types`** had 14 rows but was missing 6 scenes that the Video Library had real classified data for (notably `laboratory_research` with 338 items — the single most common scene in the gallery)
- **`functional_requirements.category_filter`** had some rows that could be reclassified to `medical` or `personal_service` now that the 5-domain taxonomy exists

---

## What the Migration Does

### 1. Cleans `application_categories` (10 rows → 5)

Deletes 5 orphan legacy rows that coexist with the current 5 after migration 097:

```
DELETED: industrial_automation, service_robotics, surveillance_security, aerial, underwater
KEPT:    industrial, professional_service, personal_service, medical, specialized_environment
```

### 2. Updates `environment_types.category` to 5-domain

Drops the old `CHECK (category IN ('industrial', 'service', 'special'))` and replaces with:

```sql
CHECK (category IN ('industrial', 'professional_service', 'personal_service', 'medical', 'specialized_environment'))
```

Migrates existing rows:

| environment_key | old category | new category |
|----------------|-------------|-------------|
| warehouse_logistics | industrial | industrial |
| manufacturing_floor | industrial | industrial |
| construction_site | industrial | industrial |
| mining_facility | industrial | industrial |
| agricultural_farm | industrial | industrial |
| **hospital_healthcare** | **service** | **medical** |
| hotel_hospitality | service | professional_service |
| retail_shopping | service | professional_service |
| office_corporate | service | professional_service |
| educational_campus | service | professional_service |
| outdoor_public | special | professional_service |
| hazardous_nuclear | special | specialized_environment |
| underwater_marine | special | specialized_environment |
| fire_emergency | special | specialized_environment |

### 3. Adds 6 new environment types

| environment_key | category | Gallery items |
|----------------|----------|--------------|
| `laboratory_research` | industrial | 338 |
| `logistics_center` | industrial | 20 |
| `restaurant_food_service` | professional_service | 17 |
| `airport_terminal` | professional_service | 4 |
| `residential_home` | personal_service | 7 |
| `entertainment_venue` | personal_service | 0 |

All inserts use `ON CONFLICT (environment_key) DO NOTHING` so they're safe to re-run.

### 4. Reclassifies some `functional_requirements.category_filter`

Moves medical-related requirements (e.g., `sterile_operation`, `surgical_precision`) from `industrial`/`professional_service` → `medical`, and home-related requirements (e.g., `voice_control`, `home_navigation`) → `personal_service`.

---

## What Was Changed in V2 Code

One file was modified directly: **`v2/app/src/services/environment-types.ts`**

| Change | Detail |
|--------|--------|
| Mock data: `hospital_healthcare.category` | `'service'` → `'medical'` |
| Mock data: `hazardous_nuclear.category` | `'special'` → `'specialized_environment'` |
| Mock data: added `laboratory_research` | New entry (id `env-15`, category `industrial`) |
| Removed `mapLegacyCategoryToTaxonomyDomain()` | Was never imported anywhere — pure dead code after migration 097 |

---

## What the V2 Team Should Do

### Required

1. **Review and apply migration 098** in Supabase Dashboard SQL Editor
   - Prerequisite: migration 097 must have already been applied
   - The migration is idempotent — safe to re-run

2. **Review the V2 code change** to `environment-types.ts`
   - The mock data now matches what the DB will contain after migration 098
   - If the DB is live and already serving the V2 app, the mock data is only a fallback — the real data comes from Supabase queries

### Recommended

3. **Check `getGroupedEnvironmentTypes()` consumers** in V2 UI
   - After migration, environments will be grouped by 5 categories instead of 3
   - If V2 has hardcoded group headers like "Industrial", "Service", "Special" — update them to: Industrial, Professional Service, Personal Service, Medical, Specialized Environment
   - If it dynamically reads group keys from data, no change needed

4. **Verify any V2 components that filter by `category`**
   - `getEnvironmentTypesByCategory('service')` will return 0 rows after migration
   - Should be updated to `getEnvironmentTypesByCategory('professional_service')` etc.
   - Search for: `category.*service`, `category.*special` in V2 frontend code

5. **New environments auto-appear** in V2
   - Since V2 reads from `environment_types` table, the 6 new rows will show up automatically in the environment picker
   - You may want to add icons/images for them in the V2 UI

### Optional (future)

6. **Remove `TAXONOMY_MIGRATION_SPEC.md` references** to `mapLegacyCategoryToTaxonomyDomain` — the function no longer exists
7. **Consider adding `dbEnvironmentKey` cross-referencing** if V2 ever needs to deep-link to Video Library gallery filtered by scene

---

## Cross-Reference: DB State After Migration 098

```
application_categories:  5 rows  (industrial, professional_service, personal_service, medical, specialized_environment)
environment_types:      20 rows  (5 industrial, 6 professional_service, 2 personal_service, 1 medical, 3 specialized_environment + 3 uncategorized industrial)
unified_task_types:    123 rows  (already 5-domain from migration 097)
functional_requirements: 119 rows (category_filter updated to 5-domain)
```
