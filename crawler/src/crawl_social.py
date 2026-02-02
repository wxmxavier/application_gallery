"""
Crawl Social Media - LinkedIn and TikTok
Crawls, classifies, and stores robotics content from social platforms
"""
import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
import google.generativeai as genai

from crawlers.social_crawler import crawl_social_media, SocialContent

load_dotenv()

# Initialize clients
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

CLASSIFICATION_PROMPT = """Classify this robotics content from social media.

Title: {title}
Description: {description}
Platform: {platform}
Author: {author}

Classify according to RSIP taxonomy:

1. application_category: industrial_automation | service_robotics | surveillance_security
2. content_type: real_application | pilot_poc | case_study | tech_demo | product_announcement | tutorial
3. educational_value: 1-5 (5=detailed case study, 1=pure marketing)
4. task_types: Array of relevant tasks like transportation, inspection, manipulation, palletizing, welding, assembly, delivery_service, human_interaction, cleaning, perimeter_patrol, etc.
5. scene_type: warehouse | manufacturing | retail | hospital | office | hotel | outdoor | laboratory
6. ai_summary: One sentence summary of what this content shows

IMPORTANT: Social media content is often promotional. Be strict:
- Most LinkedIn posts are product_announcement or tech_demo
- Most TikTok videos are tech_demo (capability demonstrations)
- Only real_application if showing actual customer deployment

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
    """Classify social media content using Gemini."""
    prompt = CLASSIFICATION_PROMPT.format(
        title=item.title,
        description=item.description[:500] if item.description else '',
        platform=item.platform,
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

    # Map platform to source_type
    source_type_map = {
        'linkedin': 'linkedin',
        'tiktok': 'tiktok'
    }

    record = {
        'title': item.title[:500],
        'description': item.description[:2000] if item.description else None,
        'source_url': item.url,
        'source_name': f"{item.platform.title()} - {item.author}" if item.author else item.platform.title(),
        'source_type': source_type_map.get(item.platform, 'other'),
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
    print("SOCIAL MEDIA CRAWLER - LinkedIn & TikTok")
    print("="*60)

    serpapi_key = os.getenv('SERPAPI_KEY')
    if not serpapi_key:
        print("ERROR: SERPAPI_KEY not found in environment")
        return

    # Crawl both platforms
    results = await crawl_social_media(
        serpapi_key,
        platforms=['linkedin', 'tiktok'],
        max_per_platform=50
    )

    stats = {
        'total_found': 0,
        'classified': 0,
        'stored': 0,
        'duplicates': 0,
        'by_platform': {}
    }

    for platform, items in results.items():
        print(f"\n{'='*40}")
        print(f"Processing {platform.upper()}: {len(items)} items")
        print("="*40)

        stats['total_found'] += len(items)
        stats['by_platform'][platform] = {'found': len(items), 'stored': 0}

        for i, item in enumerate(items):
            print(f"\n[{i+1}/{len(items)}] {item.title[:50]}...")

            # Classify
            classification = await classify_content(item)
            stats['classified'] += 1
            print(f"  Type: {classification.get('content_type')} | Category: {classification.get('application_category')}")

            # Store
            if await store_content(item, classification):
                stats['stored'] += 1
                stats['by_platform'][platform]['stored'] += 1
                print(f"  Stored successfully")
            else:
                stats['duplicates'] += 1

            # Rate limiting
            await asyncio.sleep(0.5)

    # Print summary
    print("\n" + "="*60)
    print("CRAWL COMPLETE")
    print("="*60)
    print(f"Total found: {stats['total_found']}")
    print(f"Classified: {stats['classified']}")
    print(f"Stored: {stats['stored']}")
    print(f"Duplicates skipped: {stats['duplicates']}")
    print("\nBy platform:")
    for platform, data in stats['by_platform'].items():
        print(f"  {platform}: {data['stored']}/{data['found']} stored")


if __name__ == '__main__':
    asyncio.run(main())
