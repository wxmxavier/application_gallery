# Administrator Manual - RSIP Application Gallery

## Overview

This manual covers administration tasks for the RSIP Application Gallery, including content moderation, crawler management, and system configuration.

---

## 1. Content Moderation

### Moderation Workflow

All content enters the gallery with `status = 'pending'` and must be approved before public display.

**Status Values:**
| Status | Description |
|--------|-------------|
| `pending` | Awaiting moderation |
| `approved` | Visible to public |
| `rejected` | Hidden, with reason |
| `archived` | Previously approved, now hidden |

### Approving Content

Using Supabase Dashboard:

1. Navigate to **Table Editor** → `application_gallery`
2. Filter by `status = 'pending'`
3. Review each item:
   - Check `title`, `description`, `thumbnail_url`
   - Verify `ai_classification` accuracy
   - Confirm `application_category` and `task_types` are correct
4. Update `status` to `approved`
5. Optionally set `is_featured = true` for highlighted content

### SQL Moderation Queries

```sql
-- View pending items
SELECT id, title, source_type, application_category, ai_confidence, created_at
FROM application_gallery
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Approve item
UPDATE application_gallery
SET status = 'approved',
    moderated_by = auth.uid(),
    moderated_at = NOW()
WHERE id = 'item-uuid-here';

-- Reject with reason
UPDATE application_gallery
SET status = 'rejected',
    moderation_notes = 'Not relevant to robotics applications',
    moderated_by = auth.uid(),
    moderated_at = NOW()
WHERE id = 'item-uuid-here';

-- Bulk approve high-confidence items
UPDATE application_gallery
SET status = 'approved',
    moderated_at = NOW()
WHERE status = 'pending'
  AND ai_confidence >= 0.85
  AND application_category IS NOT NULL;
```

### Correcting AI Classification

If the AI misclassified content:

```sql
UPDATE application_gallery
SET application_category = 'service_robotics',
    task_types = ARRAY['delivery_service', 'human_interaction'],
    scene_type = 'retail',
    moderation_notes = 'Corrected category from industrial to service'
WHERE id = 'item-uuid-here';
```

---

## 2. Crawler Management

### Running the Crawler

```bash
cd crawler

# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Full crawl (all sources)
python src/main.py

# YouTube only
python src/main.py --source youtube

# News only
python src/main.py --source news

# Dry run (no database writes)
python src/main.py --dry-run
```

### Crawler Configuration

Edit `crawler/config/sources.yaml`:

```yaml
youtube:
  enabled: true
  channels:
    - id: "UC7vVhkEfw4nOGp8TyDk7RcQ"  # Boston Dynamics
      name: "Boston Dynamics"
      priority: 1
    # Add new channels here

  search_queries:
    industrial_automation:
      - "warehouse robot automation"
      - "industrial robot arm"
    # Add new queries here

news:
  enabled: true
  feeds:
    - url: "https://therobotreport.com/feed/"
      name: "The Robot Report"
    # Add new feeds here

rate_limits:
  youtube_requests_per_day: 10000
  news_requests_per_minute: 30
```

### Adding New Content Sources

1. **New YouTube Channel:**
   ```yaml
   youtube:
     channels:
       - id: "CHANNEL_ID_HERE"
         name: "Company Name"
         priority: 2
   ```

2. **New Search Query:**
   ```yaml
   youtube:
     search_queries:
       service_robotics:
         - "hospital delivery robot"
   ```

3. **New RSS Feed:**
   ```yaml
   news:
     feeds:
       - url: "https://example.com/rss"
         name: "Example News"
         category_hint: "industrial_automation"
   ```

### Monitoring Crawler Runs

```sql
-- View recent crawler runs
SELECT id, source_type, status, items_found, items_new,
       items_classified, started_at, completed_at
FROM gallery_crawler_runs
ORDER BY started_at DESC
LIMIT 10;

-- Check for failed runs
SELECT * FROM gallery_crawler_runs
WHERE status = 'failed'
ORDER BY started_at DESC;
```

### Troubleshooting Crawler Issues

**No new items found:**
- Check API quotas (YouTube: 10,000 units/day)
- Verify RSS feeds are still active
- Review `items_found` vs `items_new` (duplicates are normal)

**Classification failures:**
- Check Gemini API key validity
- Review `ai_confidence` values (low values indicate poor matches)
- Check `error_details` in crawler_runs table

---

## 3. User Suggestions

### Reviewing Suggestions

Users can submit content suggestions that require admin review.

```sql
-- View pending suggestions
SELECT id, url, title, suggested_category, submitter_notes,
       submitted_by, created_at
FROM gallery_suggestions
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Accept suggestion (creates gallery item)
-- 1. First create the gallery item manually or via crawler
-- 2. Then update suggestion status:
UPDATE gallery_suggestions
SET status = 'accepted',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_notes = 'Added to gallery'
WHERE id = 'suggestion-uuid';

-- Reject suggestion
UPDATE gallery_suggestions
SET status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_notes = 'Already exists in gallery'
WHERE id = 'suggestion-uuid';
```

---

## 4. Featured Content

### Managing Featured Items

Featured items appear prominently in the gallery header.

```sql
-- View current featured items
SELECT id, title, application_category, is_featured
FROM application_gallery
WHERE is_featured = true AND status = 'approved';

-- Feature an item
UPDATE application_gallery
SET is_featured = true
WHERE id = 'item-uuid';

-- Unfeature an item
UPDATE application_gallery
SET is_featured = false
WHERE id = 'item-uuid';
```

**Best Practices:**
- Limit to 3-6 featured items
- Rotate featured content monthly
- Feature diverse categories
- Prioritize high-quality, recent content

---

## 5. Analytics

### Content Statistics

```sql
-- Items by category
SELECT application_category, COUNT(*) as count
FROM application_gallery
WHERE status = 'approved'
GROUP BY application_category;

-- Items by source
SELECT source_type, COUNT(*) as count
FROM application_gallery
WHERE status = 'approved'
GROUP BY source_type;

-- Most viewed items
SELECT id, title, view_count, application_category
FROM application_gallery
WHERE status = 'approved'
ORDER BY view_count DESC
LIMIT 20;

-- Content added over time
SELECT DATE_TRUNC('week', created_at) as week,
       COUNT(*) as items_added
FROM application_gallery
GROUP BY week
ORDER BY week DESC;
```

### Crawler Performance

```sql
-- Average items per run by source
SELECT source_type,
       AVG(items_found) as avg_found,
       AVG(items_new) as avg_new,
       AVG(items_classified) as avg_classified
FROM gallery_crawler_runs
WHERE status = 'completed'
GROUP BY source_type;
```

---

## 6. Database Maintenance

### Cleanup Operations

```sql
-- Remove old rejected items (> 30 days)
DELETE FROM application_gallery
WHERE status = 'rejected'
  AND moderated_at < NOW() - INTERVAL '30 days';

-- Archive low-view items (> 1 year, < 10 views)
UPDATE application_gallery
SET status = 'archived'
WHERE status = 'approved'
  AND created_at < NOW() - INTERVAL '1 year'
  AND view_count < 10;

-- Clean up old crawler runs (keep 90 days)
DELETE FROM gallery_crawler_runs
WHERE started_at < NOW() - INTERVAL '90 days';
```

### Backup Recommendations

- **Daily:** Supabase automatic backups
- **Weekly:** Export approved items as JSON
- **Before major changes:** Manual backup via Supabase dashboard

---

## 7. Deployment

### Frontend Deployment (Vercel)

1. Connect GitHub repository to Vercel
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy from main branch

### Crawler Deployment (Google Cloud Run)

```bash
cd crawler

# Build Docker image
docker build -t gcr.io/PROJECT_ID/gallery-crawler .

# Push to registry
docker push gcr.io/PROJECT_ID/gallery-crawler

# Deploy to Cloud Run
gcloud run deploy gallery-crawler \
  --image gcr.io/PROJECT_ID/gallery-crawler \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --timeout 900

# Set up Cloud Scheduler (daily at 2 AM)
gcloud scheduler jobs create http crawler-daily \
  --schedule="0 2 * * *" \
  --uri="https://gallery-crawler-xxx.run.app" \
  --http-method=POST
```

---

## 8. Security

### Access Control

The gallery uses Supabase Row Level Security (RLS):

| Role | Permissions |
|------|-------------|
| Anonymous | View approved items only |
| Authenticated | View approved + own suggestions |
| Admin | Full CRUD on all tables |

### Admin Role Assignment

```sql
-- Grant admin role (via Supabase Auth)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

### API Key Security

- **YouTube API Key:** Restrict to YouTube Data API only
- **Gemini API Key:** Restrict to Generative Language API
- **Supabase Service Role:** Never expose in frontend code

---

## 9. Troubleshooting

### Common Issues

**"No items displayed in gallery"**
- Check if items have `status = 'approved'`
- Verify Supabase connection in browser console
- Test with: `SELECT COUNT(*) FROM application_gallery WHERE status = 'approved'`

**"Crawler fails with quota error"**
- YouTube API has 10,000 units/day limit
- Reduce `max_results` in config
- Space out crawler runs

**"AI classification returning null"**
- Check Gemini API key
- Review error logs for rate limiting
- Fallback to manual classification

**"Slow gallery loading"**
- Check database indexes exist
- Reduce initial page size
- Enable Supabase connection pooling

---

## Contact

For technical support, contact the RSIP Development Team.
