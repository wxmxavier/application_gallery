"""
Reclassify V3 - Stricter classification for all content
Focuses on distinguishing real deployments from demos/marketing
"""
import os
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client
import google.generativeai as genai

load_dotenv()

# Initialize clients
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

STRICT_CLASSIFICATION_PROMPT = """You are a STRICT classifier for robotics content. Your job is to distinguish REAL WORLD DEPLOYMENTS from demos, marketing, and promotional content.

CLASSIFICATION RULES - BE STRICT:

## content_type (MOST IMPORTANT - be conservative):

**real_application** - ONLY use if ALL of these are true:
- Shows robot in ACTUAL customer/business environment (not lab, not trade show, not company HQ)
- Performing REAL work tasks (not just walking around, not just a demo)
- Clear evidence of production deployment (uniforms, real products, actual facility)
- Customer/location is identifiable or implied

**pilot_poc** - Use if:
- Trial deployment at customer site
- Testing phase mentioned
- "Pilot program" or "proof of concept" language

**case_study** - Use if:
- Detailed documentation of deployment
- Mentions specific results, metrics, ROI
- Customer testimonial or interview

**tech_demo** - Use for ANY of these (BE AGGRESSIVE with this category):
- Robot capability demonstration (walking, running, dancing, stunts)
- Trade show or conference footage
- Lab or R&D environment
- Company headquarters demo
- Product feature showcase without real deployment
- "Look what our robot can do" content
- Holiday/entertainment videos (dancing robots, etc.)
- No clear customer or business use case
- Generic promotional imagery

**product_announcement** - Use if:
- New product launch
- Feature updates
- Press release style content

**tutorial** - Use if:
- How-to content
- Training material
- Setup guides

## MEDIA TYPE SPECIFIC RULES:

**For IMAGES from search results:**
- Most promotional/stock images should be tech_demo
- Only real_application if clearly showing actual deployment with context
- Product shots, renders, marketing images = tech_demo or product_announcement

**For VIDEOS:**
- Holiday videos (Christmas, Halloween) = tech_demo (educational_value: 1)
- Robot parkour, dancing, stunts = tech_demo
- "Day in the life" at customer site = real_application
- Customer testimonials = case_study

## educational_value (1-5):
- 5: Full case study with ROI/metrics, customer identified, detailed process
- 4: Real deployment with good context, customer visible
- 3: Real application but limited details
- 2: Demo with some educational value about capabilities
- 1: Pure marketing, entertainment, or promotional content

Analyze this content and respond with ONLY valid JSON:

Title: {title}
Description: {description}
Source: {source_name}
Media Type: {media_type}
Current Classification: {current_content_type}

Respond with JSON only:
{{
  "content_type": "real_application|pilot_poc|case_study|tech_demo|product_announcement|tutorial",
  "educational_value": 1-5,
  "reasoning": "brief explanation"
}}
"""


async def reclassify_item(item: dict) -> dict:
    """Reclassify a single item with stricter rules."""
    prompt = STRICT_CLASSIFICATION_PROMPT.format(
        title=item.get('title', ''),
        description=(item.get('description') or item.get('ai_summary') or '')[:500],
        source_name=item.get('source_name', ''),
        media_type=item.get('media_type', ''),
        current_content_type=item.get('content_type', 'unknown')
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
        return {
            'content_type': result.get('content_type', 'tech_demo'),
            'educational_value': min(5, max(1, int(result.get('educational_value', 2)))),
            'reasoning': result.get('reasoning', '')
        }
    except Exception as e:
        print(f"  Error classifying {item['id']}: {e}")
        return None


async def main():
    # Get all approved items
    print("Fetching all approved items...")
    result = supabase.table('application_gallery').select(
        'id, title, description, ai_summary, source_name, media_type, content_type, educational_value'
    ).eq('status', 'approved').execute()

    items = result.data
    print(f"Found {len(items)} items to reclassify")

    # Track changes
    changes = {
        'total': 0,
        'content_type_changed': 0,
        'educational_changed': 0,
        'by_type': {}
    }

    # Process in batches
    batch_size = 10
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        print(f"\nProcessing batch {i//batch_size + 1}/{(len(items) + batch_size - 1)//batch_size}...")

        for item in batch:
            result = await reclassify_item(item)
            if result:
                changes['total'] += 1

                old_type = item.get('content_type')
                new_type = result['content_type']
                old_edu = item.get('educational_value')
                new_edu = result['educational_value']

                if old_type != new_type:
                    changes['content_type_changed'] += 1
                    print(f"  {item['title'][:40]}... {old_type} -> {new_type}")

                if old_edu != new_edu:
                    changes['educational_changed'] += 1

                # Track by type
                if new_type not in changes['by_type']:
                    changes['by_type'][new_type] = 0
                changes['by_type'][new_type] += 1

                # Update database
                supabase.table('application_gallery').update({
                    'content_type': new_type,
                    'educational_value': new_edu
                }).eq('id', item['id']).execute()

        # Rate limiting
        await asyncio.sleep(1)

    # Print summary
    print("\n" + "="*50)
    print("RECLASSIFICATION COMPLETE")
    print("="*50)
    print(f"Total processed: {changes['total']}")
    print(f"Content type changed: {changes['content_type_changed']}")
    print(f"Educational value changed: {changes['educational_changed']}")
    print("\nNew distribution:")
    for t, c in sorted(changes['by_type'].items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")


if __name__ == '__main__':
    asyncio.run(main())
