"""
Crawl Social Platforms - X/Twitter, Facebook, Instagram
Searches for robotics video and image content via SerpAPI
"""
import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
import google.generativeai as genai

from crawlers.social_crawler import crawl_all_social_platforms, SocialContent

load_dotenv()

# Initialize clients
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

CLASSIFICATION_PROMPT = """Classify this robotics content from {platform}.

Title: {title}
Description: {description}
Media Type: {media_type}
Author: {author}

Classify according to RSIP taxonomy:

1. application_category: industrial_automation | service_robotics | surveillance_security
2. content_type: real_application | pilot_poc | case_study | tech_demo | product_announcement | tutorial
3. educational_value: 1-5 (5=detailed case study with metrics, 1=pure marketing/entertainment)
4. task_types: Array of relevant tasks like transportation, inspection, manipulation, palletizing, welding, assembly, delivery_service, human_interaction, cleaning, perimeter_patrol, bin_picking, kitting, etc.
5. scene_type: warehouse | manufacturing | retail | hospital | office | hotel | outdoor | laboratory
6. ai_summary: One sentence summary of what this content shows

IMPORTANT CLASSIFICATION RULES:
- Social media content is often promotional - be strict about content_type
- product_announcement: New product reveals, feature announcements
- tech_demo: Capability demonstrations, trade shows, lab footage, viral videos
- real_application: ONLY if clearly showing actual customer deployment
- case_study: Must show results, metrics, or detailed implementation
- Videos of robots dancing, doing stunts = tech_demo (educational_value: 1-2)
- Factory/warehouse deployment footage with context = real_application

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
    """Classify social content using Gemini."""
    platform_name = {
        'twitter': 'X/Twitter',
        'facebook': 'Facebook',
        'instagram': 'Instagram'
    }.get(item.platform, item.platform)

    prompt = CLASSIFICATION_PROMPT.format(
        platform=platform_name,
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
    # Normalize Twitter URLs
    normalized_url = url.replace('twitter.com', 'x.com')

    result = supabase.table('application_gallery').select('id').eq('source_url', url).execute()
    if result.data:
        return True

    # Also check normalized URL for Twitter
    if normalized_url != url:
        result = supabase.table('application_gallery').select('id').eq('source_url', normalized_url).execute()
        if result.data:
            return True

    return False


async def store_content(item: SocialContent, classification: dict) -> bool:
    """Store classified content in database."""
    if check_exists(item.url):
        print(f"  Skipping duplicate: {item.title[:40]}...")
        return False

    # Normalize Twitter URLs to use x.com
    url = item.url.replace('twitter.com', 'x.com') if item.platform == 'twitter' else item.url

    # Map platform names
    source_type = item.platform
    if source_type == 'twitter':
        source_type = 'twitter'  # Keep as twitter for DB consistency

    source_name_map = {
        'twitter': 'X/Twitter',
        'facebook': 'Facebook',
        'instagram': 'Instagram'
    }

    record = {
        'title': item.title[:500],
        'description': item.description[:2000] if item.description else None,
        'source_url': url,
        'source_name': f"{source_name_map.get(item.platform, item.platform)} - {item.author}" if item.author else source_name_map.get(item.platform, item.platform),
        'source_type': source_type,
        'media_type': item.media_type,
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
        'status': 'approved',
    }

    try:
        supabase.table('application_gallery').insert(record).execute()
        return True
    except Exception as e:
        print(f"  Storage error: {e}")
        return False


async def main():
    print("="*60)
    print("SOCIAL PLATFORMS CRAWLER - X/Twitter, Facebook, Instagram")
    print("="*60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    serpapi_key = os.getenv('SERPAPI_KEY')
    if not serpapi_key:
        print("ERROR: SERPAPI_KEY not found in environment")
        return

    # Crawl all platforms
    results = await crawl_all_social_platforms(
        serpapi_key,
        max_per_platform=100
    )

    stats = {
        'total_found': 0,
        'classified': 0,
        'stored': 0,
        'duplicates': 0,
        'errors': 0,
        'by_platform': {}
    }

    for platform, items in results.items():
        print(f"\n{'='*60}")
        print(f"Processing {platform.upper()}: {len(items)} items")
        print("="*60)

        stats['total_found'] += len(items)
        stats['by_platform'][platform] = {'found': len(items), 'stored': 0, 'duplicates': 0}

        for i, item in enumerate(items):
            print(f"\n[{i+1}/{len(items)}] {item.title[:50]}...")
            print(f"  URL: {item.url[:60]}...")
            print(f"  Media: {item.media_type}")

            # Classify
            try:
                classification = await classify_content(item)
                stats['classified'] += 1
                print(f"  Type: {classification.get('content_type')} | Category: {classification.get('application_category')}")
                print(f"  Educational Value: {classification.get('educational_value')}/5")

                # Store
                if await store_content(item, classification):
                    stats['stored'] += 1
                    stats['by_platform'][platform]['stored'] += 1
                    print(f"  ✓ Stored successfully")
                else:
                    stats['duplicates'] += 1
                    stats['by_platform'][platform]['duplicates'] += 1

            except Exception as e:
                print(f"  ✗ Error: {e}")
                stats['errors'] += 1

            # Rate limiting
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
    print(f"Errors: {stats['errors']}")
    print("\nBy platform:")
    for platform, data in stats['by_platform'].items():
        print(f"  {platform}: {data['stored']}/{data['found']} stored ({data['duplicates']} duplicates)")

    # Save stats to log
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    stats_file = os.path.join(log_dir, f'social_platforms_crawl_{timestamp}.json')
    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2)
    print(f"\nStats saved to: {stats_file}")


if __name__ == '__main__':
    asyncio.run(main())
