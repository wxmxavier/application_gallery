"""
Expanded TikTok Crawler - More comprehensive search
"""
import os
import json
import asyncio
import httpx
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
import google.generativeai as genai

load_dotenv()

# Initialize clients
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

SERPAPI_KEY = os.getenv('SERPAPI_KEY')

CLASSIFICATION_PROMPT = """Classify this TikTok robotics video.

Title: {title}
Description: {description}

Classify according to RSIP taxonomy:

1. application_category: industrial_automation | service_robotics | surveillance_security
2. content_type: real_application | pilot_poc | case_study | tech_demo | product_announcement | tutorial
3. educational_value: 1-5 (5=detailed case study, 1=entertainment only)
4. task_types: Array like transportation, inspection, manipulation, palletizing, welding, assembly, delivery_service, human_interaction, cleaning, perimeter_patrol
5. scene_type: warehouse | manufacturing | retail | hospital | office | hotel | outdoor | laboratory
6. ai_summary: One sentence summary

IMPORTANT for TikTok:
- Most TikTok videos are tech_demo or tutorial
- Dancing/entertainment robots = tech_demo, educational_value: 1-2
- Factory tours showing real operations = real_application
- Product showcases = product_announcement

Respond with JSON only:
{{
  "application_category": "...",
  "content_type": "...",
  "educational_value": 1-5,
  "task_types": ["..."],
  "scene_type": "...",
  "ai_summary": "..."
}}
"""


async def search_tiktok_comprehensive():
    """Search TikTok with many queries."""
    queries = [
        # General robotics
        'site:tiktok.com robot factory',
        'site:tiktok.com warehouse robot',
        'site:tiktok.com industrial robot arm',
        'site:tiktok.com Boston Dynamics',
        'site:tiktok.com robot dog spot',
        'site:tiktok.com cobot collaborative robot',
        'site:tiktok.com AMR autonomous mobile robot',
        # Specific applications
        'site:tiktok.com robot welding',
        'site:tiktok.com robot palletizing',
        'site:tiktok.com delivery robot',
        'site:tiktok.com robot restaurant waiter',
        'site:tiktok.com robot hotel service',
        'site:tiktok.com cleaning robot roomba commercial',
        'site:tiktok.com security robot patrol',
        'site:tiktok.com robot inspection',
        # Brands
        'site:tiktok.com FANUC robot',
        'site:tiktok.com KUKA robot',
        'site:tiktok.com ABB robotics',
        'site:tiktok.com Universal Robots cobot',
        'site:tiktok.com Amazon robot warehouse Kiva',
        'site:tiktok.com Tesla robot Optimus',
        'site:tiktok.com Figure AI robot',
        'site:tiktok.com Agility Robotics Digit',
        # Popular/trending
        'site:tiktok.com robotics automation',
        'site:tiktok.com humanoid robot',
        'site:tiktok.com robot arm pick place',
        'site:tiktok.com autonomous forklift',
        'site:tiktok.com robot assembly line',
        'site:tiktok.com surgical robot',
        'site:tiktok.com agriculture robot farming',
        'site:tiktok.com construction robot',
    ]

    all_results = []
    seen_urls = set()

    async with httpx.AsyncClient(timeout=30.0) as client:
        for query in queries:
            print(f'Searching: {query}')

            for search_type in [None, 'vid']:
                params = {
                    'api_key': SERPAPI_KEY,
                    'engine': 'google',
                    'q': query,
                    'num': 50,
                }
                if search_type:
                    params['tbm'] = search_type

                try:
                    response = await client.get('https://serpapi.com/search', params=params)
                    data = response.json()

                    results = data.get('organic_results', []) + data.get('video_results', [])

                    for item in results:
                        url = item.get('link', '')
                        # Only include actual video URLs, not discover/profile pages
                        if 'tiktok.com' in url and '/video/' in url and url not in seen_urls:
                            seen_urls.add(url)
                            all_results.append({
                                'title': item.get('title', ''),
                                'url': url,
                                'snippet': item.get('snippet', ''),
                                'thumbnail': item.get('thumbnail'),
                            })

                except Exception as e:
                    print(f'  Error: {e}')

                await asyncio.sleep(0.3)

    print(f'\nFound {len(all_results)} unique TikTok videos')
    return all_results


async def classify_content(title: str, description: str) -> dict:
    """Classify content using Gemini."""
    prompt = CLASSIFICATION_PROMPT.format(
        title=title,
        description=description[:500] if description else ''
    )

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1].split('```')[0]

        return json.loads(text.strip())
    except Exception as e:
        print(f'  Classification error: {e}')
        return {
            'application_category': 'industrial_automation',
            'content_type': 'tech_demo',
            'educational_value': 2,
            'task_types': [],
            'scene_type': None,
            'ai_summary': title
        }


def check_exists(url: str) -> bool:
    """Check if URL already exists."""
    result = supabase.table('application_gallery').select('id').eq('source_url', url).execute()
    return len(result.data) > 0


def extract_author(url: str) -> str:
    """Extract TikTok username from URL."""
    try:
        if '/@' in url:
            parts = url.split('/@')
            if len(parts) > 1:
                return '@' + parts[1].split('/')[0]
    except:
        pass
    return 'TikTok'


async def main():
    print("="*60)
    print("EXPANDED TIKTOK CRAWLER")
    print("="*60)

    # Search
    results = await search_tiktok_comprehensive()

    stats = {'found': len(results), 'stored': 0, 'skipped': 0, 'errors': 0}

    print(f"\nProcessing {len(results)} videos...")

    for i, item in enumerate(results):
        print(f"\n[{i+1}/{len(results)}] {item['title'][:50]}...")

        # Check duplicate
        if check_exists(item['url']):
            print("  Skipped (duplicate)")
            stats['skipped'] += 1
            continue

        # Classify
        classification = await classify_content(item['title'], item['snippet'])
        print(f"  Type: {classification.get('content_type')} | Category: {classification.get('application_category')}")

        # Store
        author = extract_author(item['url'])
        record = {
            'title': item['title'][:500],
            'description': item['snippet'][:2000] if item['snippet'] else None,
            'source_url': item['url'],
            'source_name': f"TikTok - {author}",
            'source_type': 'tiktok',
            'media_type': 'video',
            'thumbnail_url': item.get('thumbnail'),
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
            stats['stored'] += 1
            print("  Stored")
        except Exception as e:
            print(f"  Error: {e}")
            stats['errors'] += 1

        await asyncio.sleep(0.5)

    print("\n" + "="*60)
    print("COMPLETE")
    print("="*60)
    print(f"Found: {stats['found']}")
    print(f"Stored: {stats['stored']}")
    print(f"Skipped (duplicates): {stats['skipped']}")
    print(f"Errors: {stats['errors']}")


if __name__ == '__main__':
    asyncio.run(main())
