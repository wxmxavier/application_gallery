"""
Crawl LinkedIn Videos and Images
Searches for robotics video and image content on LinkedIn via SerpAPI
"""
import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
import google.generativeai as genai

from crawlers.social_crawler import crawl_linkedin_media, SocialContent

load_dotenv()

# Initialize clients
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

CLASSIFICATION_PROMPT = """Classify this robotics content from LinkedIn.

Title: {title}
Description: {description}
Media Type: {media_type}
Author: {author}

Classify according to RSIP taxonomy:

1. application_category: industrial_automation | service_robotics | surveillance_security
2. content_type: real_application | pilot_poc | case_study | tech_demo | product_announcement | tutorial
3. educational_value: 1-5 (5=detailed case study with metrics, 1=pure marketing)
4. task_types: Array of relevant tasks like transportation, inspection, manipulation, palletizing, welding, assembly, delivery_service, human_interaction, cleaning, perimeter_patrol, bin_picking, kitting, etc.
5. scene_type: warehouse | manufacturing | retail | hospital | office | hotel | outdoor | laboratory
6. ai_summary: One sentence summary of what this content shows

IMPORTANT CLASSIFICATION RULES:
- LinkedIn content is often promotional - be strict about content_type
- product_announcement: New product reveals, feature announcements
- tech_demo: Capability demonstrations, trade shows, lab footage
- real_application: ONLY if clearly showing actual customer deployment
- case_study: Must show results, metrics, or detailed implementation
- Videos showing robot capabilities without customer context = tech_demo
- Images of robots at trade shows or labs = tech_demo

Respond with JSON only:
{{
  "application_category": "...",
  "content_type": "...",
  "educational_value": 1-5,
  "task_types": ["...", "..."],
  "scene_type": "...",
  "ai_summary": "..."
}}
"""


async def classify_content(item: SocialContent) -> dict:
    """Classify LinkedIn content using Gemini."""
    prompt = CLASSIFICATION_PROMPT.format(
        title=item.title,
        description=item.description[:500] if item.description else '',
        media_type=item.media_type,
        author=item.author or 'Unknown'
    )

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Extract JSON
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1].split('```')[0]

        result = json.loads(text.strip())
        return result
    except Exception as e:
        print(f"  Classification error: {e}")
        return {
            'application_category': 'industrial_automation',
            'content_type': 'tech_demo',
            'educational_value': 2,
            'task_types': [],
            'scene_type': None,
            'ai_summary': item.description[:200] if item.description else item.title
        }


def check_exists(url: str) -> bool:
    """Check if URL already exists in database."""
    result = supabase.table('application_gallery').select('id').eq('source_url', url).execute()
    return len(result.data) > 0


async def store_content(item: SocialContent, classification: dict) -> bool:
    """Store classified content in database."""
    if check_exists(item.url):
        print(f"  Skipping duplicate: {item.title[:40]}...")
        return False

    record = {
        'title': item.title[:500],
        'description': item.description[:2000] if item.description else None,
        'source_url': item.url,
        'source_name': f"LinkedIn - {item.author}" if item.author else 'LinkedIn',
        'source_type': 'linkedin',
        'media_type': item.media_type,  # 'video' or 'image'
        'thumbnail_url': item.thumbnail_url,
        'published_at': item.published_at,
        'application_category': classification.get('application_category', 'industrial_automation'),
        'content_type': classification.get('content_type', 'tech_demo'),
        'educational_value': classification.get('educational_value', 2),
        'task_types': classification.get('task_types', []),
        'scene_type': classification.get('scene_type'),
        'ai_summary': classification.get('ai_summary'),
        'ai_classification': classification,
        'ai_confidence': 0.7,
        'status': 'approved',  # Auto-approve for now
    }

    try:
        supabase.table('application_gallery').insert(record).execute()
        return True
    except Exception as e:
        print(f"  Storage error: {e}")
        return False


async def main():
    print("="*60)
    print("LINKEDIN MEDIA CRAWLER - Videos & Images")
    print("="*60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    serpapi_key = os.getenv('SERPAPI_KEY')
    if not serpapi_key:
        print("ERROR: SERPAPI_KEY not found in environment")
        return

    # Crawl LinkedIn videos and images
    results = await crawl_linkedin_media(
        serpapi_key,
        max_videos=100,
        max_images=100
    )

    stats = {
        'total_found': 0,
        'classified': 0,
        'stored': 0,
        'duplicates': 0,
        'by_type': {'videos': {'found': 0, 'stored': 0}, 'images': {'found': 0, 'stored': 0}}
    }

    for media_type, items in results.items():
        print(f"\n{'='*50}")
        print(f"Processing {media_type.upper()}: {len(items)} items")
        print("="*50)

        stats['total_found'] += len(items)
        stats['by_type'][media_type]['found'] = len(items)

        for i, item in enumerate(items):
            print(f"\n[{i+1}/{len(items)}] {item.title[:50]}...")
            print(f"  URL: {item.url[:60]}...")

            # Classify
            classification = await classify_content(item)
            stats['classified'] += 1
            print(f"  Type: {classification.get('content_type')} | Category: {classification.get('application_category')}")
            print(f"  Educational Value: {classification.get('educational_value')}/5")

            # Store
            if await store_content(item, classification):
                stats['stored'] += 1
                stats['by_type'][media_type]['stored'] += 1
                print(f"  ✓ Stored successfully")
            else:
                stats['duplicates'] += 1

            # Rate limiting - be gentle with SerpAPI
            await asyncio.sleep(0.5)

    # Print summary
    print("\n" + "="*60)
    print("CRAWL COMPLETE")
    print("="*60)
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTotal found: {stats['total_found']}")
    print(f"Classified: {stats['classified']}")
    print(f"Stored: {stats['stored']}")
    print(f"Duplicates skipped: {stats['duplicates']}")
    print("\nBy media type:")
    for media_type, data in stats['by_type'].items():
        print(f"  {media_type}: {data['stored']}/{data['found']} stored")

    # Save stats to log
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    stats_file = os.path.join(log_dir, f'linkedin_media_crawl_{timestamp}.json')
    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2)
    print(f"\nStats saved to: {stats_file}")


if __name__ == '__main__':
    asyncio.run(main())
