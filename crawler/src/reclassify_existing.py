"""
Re-classify Existing Gallery Items with V2 Classification System

This script fetches all existing items from the database and re-classifies them
using the enhanced V2 classifier that distinguishes real applications from demos.

Usage:
    python src/reclassify_existing.py [--dry-run] [--limit N] [--batch-size N]

Options:
    --dry-run       Preview changes without updating database
    --limit N       Only process N items (for testing)
    --batch-size N  Process N items per batch (default: 10)
"""
import asyncio
import argparse
import json
from typing import Dict, Any, List
import structlog
from supabase import create_client, Client

from config import get_config
from processors.ai_classifier import RSIPClassifier

logger = structlog.get_logger()


async def fetch_all_items(supabase: Client, limit: int = None) -> List[Dict[str, Any]]:
    """Fetch all approved items from the database"""
    query = supabase.table('application_gallery').select('*').eq('status', 'approved')

    if limit:
        query = query.limit(limit)

    response = query.execute()
    return response.data


async def update_item(supabase: Client, item_id: str, classification: Dict[str, Any], dry_run: bool = False) -> bool:
    """Update an item with new V2 classification"""
    update_data = {
        'content_type': classification.get('content_type', 'unknown'),
        'deployment_maturity': classification.get('deployment_maturity', 'unknown'),
        'educational_value': classification.get('educational_value', 3),
        'specific_tasks': classification.get('specific_tasks', []),
        'application_context': classification.get('application_context', {}),
        'task_types': classification.get('task_types', []),
        'functional_requirements': classification.get('functional_requirements', []),
        'ai_summary': classification.get('summary'),
        'ai_classification': classification,
    }

    # Also update scene_type if provided
    if classification.get('scene_type'):
        update_data['scene_type'] = classification['scene_type']

    if dry_run:
        logger.info("DRY RUN - Would update item",
                   item_id=item_id,
                   content_type=update_data['content_type'],
                   educational_value=update_data['educational_value'])
        return True

    try:
        supabase.table('application_gallery').update(update_data).eq('id', item_id).execute()
        return True
    except Exception as e:
        logger.error("Failed to update item", item_id=item_id, error=str(e))
        return False


async def reclassify_batch(
    classifier: RSIPClassifier,
    supabase: Client,
    items: List[Dict[str, Any]],
    dry_run: bool = False
) -> Dict[str, int]:
    """Re-classify a batch of items"""
    stats = {
        'real_application': 0,
        'pilot_poc': 0,
        'case_study': 0,
        'tech_demo': 0,
        'product_announcement': 0,
        'tutorial': 0,
        'unknown': 0,
        'errors': 0,
        'updated': 0,
    }

    for item in items:
        try:
            # Prepare item for classification
            classify_input = {
                'title': item.get('title', ''),
                'description': item.get('description', ''),
                'source_name': item.get('source_name', 'Unknown'),
                'media_type': item.get('media_type', 'video'),
            }

            # Classify with V2 classifier
            classification = await classifier.classify(classify_input)

            content_type = classification.get('content_type', 'unknown')
            stats[content_type] = stats.get(content_type, 0) + 1

            # Update in database
            if await update_item(supabase, item['id'], classification, dry_run):
                stats['updated'] += 1

            logger.info("Classified item",
                       title=item['title'][:50],
                       content_type=content_type,
                       educational_value=classification.get('educational_value'),
                       deployment_maturity=classification.get('deployment_maturity'))

            # Rate limiting - be nice to the API
            await asyncio.sleep(0.5)

        except Exception as e:
            logger.error("Classification error", title=item.get('title', '')[:50], error=str(e))
            stats['errors'] += 1

    return stats


async def main():
    parser = argparse.ArgumentParser(description='Re-classify gallery items with V2 system')
    parser.add_argument('--dry-run', action='store_true', help='Preview without updating')
    parser.add_argument('--limit', type=int, default=None, help='Limit items to process')
    parser.add_argument('--batch-size', type=int, default=10, help='Batch size')
    args = parser.parse_args()

    config = get_config()

    # Initialize Supabase
    supabase = create_client(config.supabase_url, config.supabase_service_key)

    # Initialize classifier
    classifier = RSIPClassifier(config)

    logger.info("Starting V2 re-classification",
               dry_run=args.dry_run,
               limit=args.limit,
               batch_size=args.batch_size)

    # Fetch all items
    items = await fetch_all_items(supabase, args.limit)
    total_items = len(items)
    logger.info(f"Found {total_items} items to re-classify")

    # Process in batches
    total_stats = {
        'real_application': 0,
        'pilot_poc': 0,
        'case_study': 0,
        'tech_demo': 0,
        'product_announcement': 0,
        'tutorial': 0,
        'unknown': 0,
        'errors': 0,
        'updated': 0,
    }

    for i in range(0, total_items, args.batch_size):
        batch = items[i:i + args.batch_size]
        logger.info(f"Processing batch {i // args.batch_size + 1}/{(total_items + args.batch_size - 1) // args.batch_size}")

        batch_stats = await reclassify_batch(classifier, supabase, batch, args.dry_run)

        # Aggregate stats
        for key in total_stats:
            total_stats[key] += batch_stats.get(key, 0)

        # Log progress
        processed = min(i + args.batch_size, total_items)
        logger.info(f"Progress: {processed}/{total_items} ({processed * 100 // total_items}%)")

    # Final report
    print("\n" + "="*60)
    print("RE-CLASSIFICATION COMPLETE")
    print("="*60)
    print(f"\nTotal items processed: {total_items}")
    print(f"Successfully updated: {total_stats['updated']}")
    print(f"Errors: {total_stats['errors']}")
    print("\nContent Type Distribution:")
    print("-"*40)

    content_types = ['real_application', 'pilot_poc', 'case_study', 'tech_demo',
                     'product_announcement', 'tutorial', 'unknown']

    for ct in content_types:
        count = total_stats.get(ct, 0)
        pct = count * 100 / total_items if total_items > 0 else 0
        bar = "█" * int(pct / 2)
        print(f"  {ct:25} {count:4} ({pct:5.1f}%) {bar}")

    # Quality content summary
    quality_count = total_stats['real_application'] + total_stats['case_study'] + total_stats['pilot_poc']
    demo_count = total_stats['tech_demo'] + total_stats['product_announcement']

    print("\n" + "-"*40)
    print(f"Quality content (real apps + case studies + pilots): {quality_count} ({quality_count * 100 / total_items:.1f}%)")
    print(f"Demo/Marketing content: {demo_count} ({demo_count * 100 / total_items:.1f}%)")

    if args.dry_run:
        print("\n⚠️  DRY RUN - No changes were made to the database")
    else:
        print("\n✅ Database updated successfully")


if __name__ == '__main__':
    asyncio.run(main())
