"""
Targeted crawler for Home Service Robots and Fire Emergency Robots.

Searches YouTube and TikTok (via SerpAPI) for content in these two focus areas.
"""
import os
import json
import asyncio
import re
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

# YouTube API
from googleapiclient.discovery import build
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY) if YOUTUBE_API_KEY else None

# ---- Search Queries ----

YOUTUBE_QUERIES = {
    "personal_service": [
        # Home service robots
        "home service robot cleaning cooking",
        "domestic robot household chores",
        "home robot vacuum mop real deployment",
        "robot lawn mower autonomous",
        "home companion robot elderly care",
        "home care robot assistant elderly",
        "personal assistant robot home",
        "Samsung Ballie home robot",
        "Amazon Astro robot home",
        "Roborock robot home cleaning",
        "iRobot Roomba autonomous home",
        "LG CLOi home robot",
        "Ecovacs Deebot home robot",
        "robot butler home service",
        "home automation robot AI assistant",
        "domestic humanoid robot home",
        "robot folding laundry home",
        "robot cooking kitchen home",
        "smart home robot daily life",
        "Aeolus robot home service",
    ],
    "specialized_environment": [
        # Fire emergency robots
        "firefighting robot deployment",
        "fire emergency robot rescue",
        "fire robot real deployment building",
        "firefighting robot Colossus",
        "fire rescue robot drone",
        "wildfire robot autonomous",
        "fire detection robot patrol",
        "fire suppression robot industrial",
        "disaster rescue robot earthquake fire",
        "hazardous firefighting robot deployment",
        "Thermite robot firefighting",
        "Shark Robotics Colossus fire",
        "fire department robot deployment",
        "firefighting drone thermal",
        "robotic fire extinguisher autonomous",
        "search rescue robot fire building",
        "first responder robot fire emergency",
        "industrial fire robot refinery",
        "forest fire robot wildfire suppression",
        "Howe and Howe Thermite RS3 firefighting",
    ],
}

TIKTOK_QUERIES = [
    # Home service
    'site:tiktok.com home robot cleaning',
    'site:tiktok.com domestic robot household',
    'site:tiktok.com robot vacuum smart home',
    'site:tiktok.com home assistant robot',
    'site:tiktok.com companion robot elderly',
    'site:tiktok.com robot butler home',
    'site:tiktok.com robot cooking kitchen',
    'site:tiktok.com lawn mowing robot',
    'site:tiktok.com Samsung Ballie robot',
    'site:tiktok.com Amazon Astro robot',
    # Fire emergency
    'site:tiktok.com firefighting robot',
    'site:tiktok.com fire rescue robot',
    'site:tiktok.com fire emergency drone robot',
    'site:tiktok.com wildfire robot',
    'site:tiktok.com disaster rescue robot',
]

CLASSIFICATION_PROMPT = """Classify this robotics video for RSIP Application Gallery.

Title: {title}
Description: {description}
Source: {source}

Classify according to RSIP taxonomy:

1. application_category: One of: industrial | professional_service | personal_service | medical | specialized_environment
   - Home robots (cleaning, cooking, companion, lawn mowing) = personal_service
   - Firefighting/rescue robots = specialized_environment

2. content_type: real_application | pilot_poc | case_study | tech_demo | product_announcement | tutorial | interview_comment
   - Actual deployment in real homes/fire scenes = real_application
   - Product demos, trade shows = tech_demo
   - New product reveals = product_announcement
   - People talking about robots = interview_comment

3. educational_value: 1-5 (5=detailed case study with metrics, 1=pure entertainment)

4. specific_tasks: Array from:
   Home service: home_cleaning, lawn_mowing, personal_assistant, entertainment, companion
   Fire/emergency: firefighting, hazardous_inspection, search_rescue
   General: locomotion_demo, general_demo, manipulation, inspection

5. task_types: Broader categories array from:
   cleaning, delivery_service, human_interaction, entertainment, locomotion, inspection, research

6. scene_type: residential | outdoor | manufacturing | warehouse | entertainment_venue | construction | hospital

7. ai_summary: One concise sentence summary

Respond with JSON only:
{{
  "application_category": "...",
  "content_type": "...",
  "educational_value": 3,
  "specific_tasks": ["..."],
  "task_types": ["..."],
  "scene_type": "...",
  "ai_summary": "..."
}}
"""


async def classify_content(title: str, description: str, source: str = "") -> dict:
    """Classify content using Gemini."""
    prompt = CLASSIFICATION_PROMPT.format(
        title=title,
        description=description[:500] if description else '',
        source=source
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
            'application_category': 'personal_service',
            'content_type': 'tech_demo',
            'educational_value': 2,
            'specific_tasks': [],
            'task_types': [],
            'scene_type': None,
            'ai_summary': title
        }


def check_exists_by_url(url: str) -> bool:
    """Check if source_url already exists."""
    result = supabase.table('application_gallery').select('id').eq('source_url', url).execute()
    return len(result.data) > 0


def check_exists_by_external(source_type: str, external_id: str) -> bool:
    """Check if source_type + external_id already exists."""
    result = supabase.table('application_gallery').select('id').eq(
        'source_type', source_type
    ).eq('external_id', external_id).execute()
    return len(result.data) > 0


def extract_youtube_id(url: str) -> str:
    patterns = [
        r'(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return ""


# ---- YouTube Search ----

async def search_youtube(queries: dict) -> list:
    """Search YouTube for videos matching queries."""
    if not youtube:
        print("WARNING: No YOUTUBE_API_KEY - skipping YouTube search")
        return []

    all_results = []
    seen_ids = set()

    for category, query_list in queries.items():
        for query in query_list:
            print(f"  YouTube search: {query}")
            try:
                request = youtube.search().list(
                    part="snippet",
                    q=query,
                    type="video",
                    maxResults=15,
                    order="relevance",
                    videoDuration="medium",  # 4-20 min
                    publishedAfter="2024-01-01T00:00:00Z",
                )
                response = request.execute()

                for item in response.get("items", []):
                    vid_id = item["id"]["videoId"]
                    if vid_id in seen_ids:
                        continue
                    seen_ids.add(vid_id)

                    snippet = item["snippet"]
                    all_results.append({
                        "video_id": vid_id,
                        "title": snippet.get("title", ""),
                        "description": snippet.get("description", ""),
                        "channel": snippet.get("channelTitle", ""),
                        "published_at": snippet.get("publishedAt"),
                        "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url"),
                        "default_category": category,
                    })

                await asyncio.sleep(0.3)

            except Exception as e:
                print(f"    Error: {e}")

    print(f"  YouTube: Found {len(all_results)} unique videos")
    return all_results


async def get_video_details(video_ids: list) -> dict:
    """Get duration and stats for videos."""
    details = {}
    # Batch in groups of 50
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i+50]
        try:
            request = youtube.videos().list(
                part="contentDetails,statistics",
                id=",".join(batch)
            )
            response = request.execute()
            for item in response.get("items", []):
                vid_id = item["id"]
                duration_str = item.get("contentDetails", {}).get("duration", "PT0S")
                # Parse ISO 8601 duration
                seconds = parse_duration(duration_str)
                stats = item.get("statistics", {})
                details[vid_id] = {
                    "duration_seconds": seconds,
                    "view_count": int(stats.get("viewCount", 0)),
                    "like_count": int(stats.get("likeCount", 0)),
                }
        except Exception as e:
            print(f"    Details error: {e}")
    return details


def parse_duration(duration_str: str) -> int:
    """Parse ISO 8601 duration to seconds."""
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


# ---- TikTok Search (via SerpAPI) ----

async def search_tiktok(queries: list) -> list:
    """Search TikTok via SerpAPI Google search."""
    if not SERPAPI_KEY:
        print("WARNING: No SERPAPI_KEY - skipping TikTok search")
        return []

    all_results = []
    seen_urls = set()

    async with httpx.AsyncClient(timeout=30.0) as client:
        for query in queries:
            print(f"  TikTok search: {query}")
            for search_type in [None, 'vid']:
                params = {
                    'api_key': SERPAPI_KEY,
                    'engine': 'google',
                    'q': query,
                    'num': 30,
                }
                if search_type:
                    params['tbm'] = search_type

                try:
                    response = await client.get('https://serpapi.com/search', params=params)
                    data = response.json()
                    results = data.get('organic_results', []) + data.get('video_results', [])

                    for item in results:
                        url = item.get('link', '')
                        if 'tiktok.com' in url and '/video/' in url and url not in seen_urls:
                            seen_urls.add(url)
                            all_results.append({
                                'title': item.get('title', ''),
                                'url': url,
                                'snippet': item.get('snippet', ''),
                                'thumbnail': item.get('thumbnail'),
                            })
                except Exception as e:
                    print(f"    Error: {e}")
                await asyncio.sleep(0.3)

    print(f"  TikTok: Found {len(all_results)} unique videos")
    return all_results


# ---- Main Pipeline ----

async def main():
    print("=" * 60)
    print("TARGETED CRAWL: Home Service + Fire Emergency Robots")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)

    stats = {'yt_found': 0, 'yt_stored': 0, 'yt_skipped': 0, 'yt_errors': 0,
             'tt_found': 0, 'tt_stored': 0, 'tt_skipped': 0, 'tt_errors': 0}

    # ---- Phase 1: YouTube ----
    print("\n--- PHASE 1: YouTube Search ---")
    yt_results = await search_youtube(YOUTUBE_QUERIES)
    stats['yt_found'] = len(yt_results)

    if yt_results:
        # Get video details (duration, view count)
        video_ids = [r['video_id'] for r in yt_results]
        details = await get_video_details(video_ids)

        for i, item in enumerate(yt_results):
            vid_id = item['video_id']
            detail = details.get(vid_id, {})
            duration = detail.get('duration_seconds', 0)

            # Filter: 30s - 30min
            if duration < 30 or duration > 1800:
                stats['yt_skipped'] += 1
                continue

            print(f"\n  [{i+1}/{len(yt_results)}] {item['title'][:60]}...")

            # Check duplicate
            if check_exists_by_external('youtube', vid_id):
                print("    Skipped (duplicate)")
                stats['yt_skipped'] += 1
                continue

            # Classify
            classification = await classify_content(
                item['title'], item['description'], item['channel']
            )
            print(f"    {classification.get('content_type')} | {classification.get('application_category')} | tasks: {classification.get('specific_tasks')}")

            # Build record
            record = {
                'title': item['title'][:500],
                'description': item['description'][:2000] if item['description'] else None,
                'source_url': f"https://www.youtube.com/watch?v={vid_id}",
                'content_url': f"https://www.youtube.com/embed/{vid_id}",
                'source_name': item['channel'],
                'source_type': 'youtube',
                'external_id': vid_id,
                'media_type': 'video',
                'thumbnail_url': item.get('thumbnail'),
                'published_at': item.get('published_at'),
                'duration_seconds': duration,
                'view_count': detail.get('view_count', 0),
                'application_category': classification.get('application_category', 'personal_service'),
                'content_type': classification.get('content_type', 'tech_demo'),
                'educational_value': classification.get('educational_value', 2),
                'task_types': classification.get('task_types', []),
                'specific_tasks': classification.get('specific_tasks', []),
                'scene_type': classification.get('scene_type'),
                'ai_summary': classification.get('ai_summary'),
                'ai_classification': classification,
                'ai_confidence': 0.8,
                'status': 'approved',
            }

            try:
                supabase.table('application_gallery').insert(record).execute()
                stats['yt_stored'] += 1
                print("    Stored ✓")
            except Exception as e:
                print(f"    DB Error: {e}")
                stats['yt_errors'] += 1

            await asyncio.sleep(0.5)

    # ---- Phase 2: TikTok ----
    print("\n--- PHASE 2: TikTok Search ---")
    tt_results = await search_tiktok(TIKTOK_QUERIES)
    stats['tt_found'] = len(tt_results)

    for i, item in enumerate(tt_results):
        print(f"\n  [{i+1}/{len(tt_results)}] {item['title'][:60]}...")

        if check_exists_by_url(item['url']):
            print("    Skipped (duplicate)")
            stats['tt_skipped'] += 1
            continue

        classification = await classify_content(item['title'], item['snippet'], 'TikTok')
        print(f"    {classification.get('content_type')} | {classification.get('application_category')}")

        author = 'TikTok'
        if '/@' in item['url']:
            parts = item['url'].split('/@')
            if len(parts) > 1:
                author = f"TikTok - @{parts[1].split('/')[0]}"

        record = {
            'title': item['title'][:500],
            'description': item['snippet'][:2000] if item['snippet'] else None,
            'source_url': item['url'],
            'source_name': author,
            'source_type': 'tiktok',
            'media_type': 'video',
            'thumbnail_url': item.get('thumbnail'),
            'application_category': classification.get('application_category', 'personal_service'),
            'content_type': classification.get('content_type', 'tech_demo'),
            'educational_value': classification.get('educational_value', 2),
            'task_types': classification.get('task_types', []),
            'specific_tasks': classification.get('specific_tasks', []),
            'scene_type': classification.get('scene_type'),
            'ai_summary': classification.get('ai_summary'),
            'ai_classification': classification,
            'ai_confidence': 0.7,
            'status': 'approved',
        }

        try:
            supabase.table('application_gallery').insert(record).execute()
            stats['tt_stored'] += 1
            print("    Stored ✓")
        except Exception as e:
            print(f"    DB Error: {e}")
            stats['tt_errors'] += 1

        await asyncio.sleep(0.5)

    # ---- Summary ----
    print("\n" + "=" * 60)
    print("CRAWL COMPLETE")
    print("=" * 60)
    print(f"\nYouTube:")
    print(f"  Found: {stats['yt_found']}")
    print(f"  Stored: {stats['yt_stored']}")
    print(f"  Skipped: {stats['yt_skipped']}")
    print(f"  Errors: {stats['yt_errors']}")
    print(f"\nTikTok:")
    print(f"  Found: {stats['tt_found']}")
    print(f"  Stored: {stats['tt_stored']}")
    print(f"  Skipped: {stats['tt_skipped']}")
    print(f"  Errors: {stats['tt_errors']}")
    print(f"\nTotal new items: {stats['yt_stored'] + stats['tt_stored']}")
    print(f"Finished: {datetime.now().isoformat()}")


if __name__ == '__main__':
    asyncio.run(main())
