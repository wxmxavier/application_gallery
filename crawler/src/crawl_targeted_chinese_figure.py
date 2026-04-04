"""
Targeted crawler for:
1. Figure 03 + Melania Trump White House summit (March 2026)
2. Unitree G1 kung fu Spring Festival Gala (Feb 2026)
3. Agibot factory deployment / 10,000 unit milestone
4. Other top Chinese humanoid robots (LimX, XPeng, Fourier, Galbot, Kepler)
"""
import os
import json
import asyncio
import re
from datetime import datetime
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from supabase import create_client
import google.generativeai as genai
from googleapiclient.discovery import build

# Initialize clients
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')
youtube = build("youtube", "v3", developerKey=os.getenv('YOUTUBE_API_KEY'))

CLASSIFICATION_PROMPT = """Classify this robotics video for the RSIP Application Gallery.

Title: {title}
Description: {description}
Channel: {channel}

Classify according to RSIP taxonomy. Return JSON only:

1. application_category: MUST be one of: industrial | professional_service | personal_service | medical | specialized_environment
   - Home robots, companion robots = personal_service
   - Factory/warehouse humanoids = industrial
   - Education, hospitality, service = professional_service
   - Firefighting, hazardous = specialized_environment
   - Surgery, rehab = medical

2. content_type: real_application | pilot_poc | case_study | tech_demo | product_announcement | tutorial | interview_comment

3. educational_value: 1-5
   - 5 = real deployment with metrics/results
   - 4 = real deployment shown in action
   - 3 = detailed demo with context
   - 2 = basic demo or announcement
   - 1 = entertainment only

4. specific_tasks: Array from: locomotion_demo, general_demo, manipulation, inspection, companion, personal_assistant, home_cleaning, entertainment, stage_performance, guided_tour, assembly, transportation, firefighting, hazardous_inspection, research_platform

5. task_types: Broader array from: locomotion, entertainment, manipulation, inspection, human_interaction, delivery_service, cleaning, assembly, research

6. scene_type: One of: warehouse | manufacturing | laboratory | construction | logistics_center | retail | hotel | office | campus | outdoor | restaurant | airport | hospital | residential | entertainment_venue

7. ai_summary: One concise sentence.

IMPORTANT: application_category MUST be exactly one of the 5 values listed. Do NOT use "research", "general", "technology", etc.

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

YOUTUBE_QUERIES = [
    # Figure 03 + Melania Trump White House
    "Figure 03 Melania Trump White House humanoid robot",
    "Figure AI humanoid robot White House summit 2026",
    "Figure 03 robot walks with First Lady",
    "Figure 03 humanoid White House education summit",

    # Unitree Spring Festival Gala
    "Unitree G1 kung fu Spring Festival Gala 2026",
    "Unitree humanoid robot Chinese New Year performance",
    "Unitree G1 robots synchronized kung fu",
    "Unitree H2 Monkey King Spring Festival",
    "Unitree robot Temple of Heaven kung fu",

    # Agibot
    "Agibot humanoid robot factory 2026",
    "Agibot 10000 robots production milestone",
    "Agibot G2 humanoid robot smart manufacturing",
    "智元机器人 Agibot humanoid deployment",

    # Other Chinese humanoid leaders
    "Fourier GR-2 humanoid robot 2026",
    "LimX Dynamics humanoid robot walking 2026",
    "XPeng PX5 humanoid robot Iron",
    "Galbot humanoid robot dexterous manipulation",
    "Kepler humanoid robot Forerunner",
    "UBTECH Walker S NIO factory humanoid",
    "Leju humanoid robot 2026",

    # General Chinese humanoid
    "China humanoid robot factory deployment 2026",
    "Chinese humanoid robot latest 2026",
    "humanoid robot mass production China 2026",
]


async def classify_content(title, description, channel):
    prompt = CLASSIFICATION_PROMPT.format(
        title=title,
        description=description[:500] if description else '',
        channel=channel
    )
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1].split('```')[0]
        result = json.loads(text.strip())

        # Validate category
        valid_cats = ['industrial', 'professional_service', 'personal_service', 'medical', 'specialized_environment']
        if result.get('application_category') not in valid_cats:
            result['application_category'] = 'industrial'

        return result
    except Exception as e:
        print(f'  Classification error: {e}')
        return {
            'application_category': 'industrial',
            'content_type': 'tech_demo',
            'educational_value': 3,
            'specific_tasks': ['locomotion_demo'],
            'task_types': ['locomotion'],
            'scene_type': None,
            'ai_summary': title
        }


def check_exists(external_id):
    result = supabase.table('application_gallery').select('id').eq(
        'source_type', 'youtube'
    ).eq('external_id', external_id).execute()
    return len(result.data) > 0


def parse_duration(d):
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', d)
    if not match:
        return 0
    return int(match.group(1) or 0) * 3600 + int(match.group(2) or 0) * 60 + int(match.group(3) or 0)


async def search_youtube(queries):
    all_results = []
    seen = set()
    for query in queries:
        print(f"  Searching: {query}")
        try:
            resp = youtube.search().list(
                part="snippet", q=query, type="video",
                maxResults=15, order="relevance",
                publishedAfter="2025-06-01T00:00:00Z",
            ).execute()
            for item in resp.get("items", []):
                vid_id = item["id"]["videoId"]
                if vid_id in seen:
                    continue
                seen.add(vid_id)
                s = item["snippet"]
                all_results.append({
                    "video_id": vid_id,
                    "title": s.get("title", ""),
                    "description": s.get("description", ""),
                    "channel": s.get("channelTitle", ""),
                    "published_at": s.get("publishedAt"),
                    "thumbnail": s.get("thumbnails", {}).get("high", {}).get("url"),
                })
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"    Error: {e}")
    print(f"  Total unique: {len(all_results)}")
    return all_results


async def get_details(video_ids):
    details = {}
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i+50]
        try:
            resp = youtube.videos().list(
                part="contentDetails,statistics", id=",".join(batch)
            ).execute()
            for item in resp.get("items", []):
                vid_id = item["id"]
                dur = parse_duration(item.get("contentDetails", {}).get("duration", "PT0S"))
                stats = item.get("statistics", {})
                details[vid_id] = {
                    "duration_seconds": dur,
                    "view_count": int(stats.get("viewCount", 0)),
                }
        except Exception as e:
            print(f"    Details error: {e}")
    return details


async def main():
    print("=" * 60)
    print("TARGETED CRAWL: Figure 03 + Chinese Humanoid Robots")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)

    stats = {'found': 0, 'stored': 0, 'skipped': 0, 'errors': 0, 'dupes': 0}

    print("\n--- YouTube Search ---")
    results = await search_youtube(YOUTUBE_QUERIES)
    stats['found'] = len(results)

    if not results:
        print("No results found!")
        return

    video_ids = [r['video_id'] for r in results]
    details = await get_details(video_ids)

    for i, item in enumerate(results):
        vid_id = item['video_id']
        detail = details.get(vid_id, {})
        duration = detail.get('duration_seconds', 0)

        # Filter: 20s - 45min (more lenient for gala performances)
        if duration < 20 or duration > 2700:
            stats['skipped'] += 1
            continue

        print(f"\n  [{i+1}/{len(results)}] {item['title'][:65]}...")

        if check_exists(vid_id):
            print("    Skipped (duplicate)")
            stats['dupes'] += 1
            continue

        classification = await classify_content(
            item['title'], item['description'], item['channel']
        )
        ct = classification.get('content_type', '?')
        cat = classification.get('application_category', '?')
        tasks = classification.get('specific_tasks', [])
        print(f"    {ct} | {cat} | tasks: {tasks[:3]}")

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
            'application_category': classification.get('application_category', 'industrial'),
            'content_type': classification.get('content_type', 'tech_demo'),
            'educational_value': classification.get('educational_value', 3),
            'task_types': classification.get('task_types', []),
            'specific_tasks': classification.get('specific_tasks', []),
            'scene_type': classification.get('scene_type'),
            'ai_summary': classification.get('ai_summary'),
            'ai_classification': classification,
            'ai_confidence': 0.85,
            'status': 'approved',
        }

        try:
            supabase.table('application_gallery').insert(record).execute()
            stats['stored'] += 1
            print("    Stored ✓")
        except Exception as e:
            err_msg = str(e)
            if 'category_check' in err_msg or 'content_type' in err_msg:
                print(f"    DB constraint error (bad classification): {err_msg[:100]}")
            else:
                print(f"    DB Error: {err_msg[:100]}")
            stats['errors'] += 1

        await asyncio.sleep(0.5)

    print("\n" + "=" * 60)
    print("CRAWL COMPLETE")
    print("=" * 60)
    print(f"  Found: {stats['found']}")
    print(f"  Stored: {stats['stored']}")
    print(f"  Duplicates: {stats['dupes']}")
    print(f"  Skipped (duration): {stats['skipped']}")
    print(f"  Errors: {stats['errors']}")
    print(f"  Finished: {datetime.now().isoformat()}")


if __name__ == '__main__':
    asyncio.run(main())
