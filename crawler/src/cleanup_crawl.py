"""Clean up misclassified items from the 2026-04-03 home/fire crawl."""
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from supabase import create_client

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Get all items from this crawl
result = supabase.table('application_gallery').select('id, title').gte('created_at', '2026-04-03T00:00:00').execute()
all_items = {i['id']: i['title'] for i in result.data}
print(f"Total items from crawl: {len(all_items)}")

# Items to DELETE
delete_ids = [
    # Factory tours / non-robot manufacturing videos
    '695efc2f', '25dc8d4a', '9c9111fc', '6d74f99b', '9365644b',
    '7daac34b', '07dd55d3', 'f889f236', '4281c7a0', 'ed111d53',
    '28aa0909', 'd6207656', 'b79781b0', '9c080b22',
    # Non-robot misc
    'def99f58',  # Fire hydrant plumbing SOP
    'e77b6c0c',  # Robocar Poli cartoon
    'b2a78926',  # Robot vacuum fire hazard (anti-robot safety warning)
    'b99586f8',  # Protect Go AI enterprise (IoT, not robot)
    # Military/war content (not fire emergency)
    '85fb5aa9',  # slaughterbots WW3
    '391063c4',  # humanoid robots Ukraine
    'eeea346d',  # China's Secret Robot Army
    '0c27851f',  # Ukraine robot army kill
    '1662025d',  # Ukraine humanoid soldiers
    'dfa1a193',  # AI fighter drone warfare
    'b5bb432b',  # France robots Ukraine war
    # Arduino sensor-only projects (no actual robot)
    '53eae3b9',  # CO2 extinguisher sensor
    'fa5feed9',  # fire smoke detection alarm
    '0cfe422a',  # river flooding alarm model
    '623b106f',  # fire extinguisher without arduino
    # Non-robotics tech content
    '20e0aefd',  # YOLO26 ML tutorial
    '5422874c',  # OpenClaw coding agents
    'b5cfe9d0',  # What is a Digital Twin
    'c87436fa',  # China remote control bulldozers
    'ca0e1deb',  # Mega Machines heavy equipment
]

deleted = 0
not_found = 0
for short_id in delete_ids:
    matched = [fid for fid in all_items if fid.startswith(short_id)]
    if matched:
        full_id = matched[0]
        title = all_items[full_id][:60]
        supabase.table('application_gallery').delete().eq('id', full_id).execute()
        deleted += 1
        print(f'  DELETED: {short_id} - {title}')
    else:
        not_found += 1
        print(f'  NOT FOUND: {short_id}')

print(f'\nDeleted: {deleted}')
print(f'Not found: {not_found}')
print(f'Remaining from crawl: {len(all_items) - deleted}')
