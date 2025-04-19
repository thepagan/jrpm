import requests
import time
import json
from tqdm import tqdm

DEEPL_API_KEY = '98b198c1-4bed-48ea-be62-8643819f4428:fx'  # Replace with your real key
ENDPOINTS = {
    "lines": "http://localhost:5050/api/lines",
    "stations": "http://localhost:5050/api/stations"
}

SQL_FILE = "translations.sql"

def deepl_translate(text, target_lang='EN'):
    if not text:
        return ''
    try:
        response = requests.post(
            'https://api-free.deepl.com/v2/translate',
            data={
                'auth_key': DEEPL_API_KEY,
                'text': text,
                'source_lang': 'JA',
                'target_lang': target_lang
            }
        )
        response.raise_for_status()
        result = response.json()
        translated = result['translations'][0]['text']
        # print(f"🈶 Translated: {text} → {translated}")
        return translated
    except Exception as e:
        print(f"❌ Error translating '{text}': {e}")
        return ''

def process(endpoint_key, endpoint_url):
    sql_statements = []
    unmatched_count = 0
    response = requests.get(endpoint_url)
    response.raise_for_status()
    data = response.json()
    print(f"Retrieved {len(data['features'])} features from {endpoint_key}")
    print("First feature for inspection:")
    print(json.dumps(data["features"][0], indent=2, ensure_ascii=False))

    fields = ["n02_003", "n02_004"]
    if endpoint_key == "stations":
        fields.append("n02_005")

    # Collect all unique JP phrases
    all_jp_phrases = set()
    for feature in data["features"]:
        props = feature["properties"]
        for field in fields:
            jp_text = props.get(field)
            if jp_text:
                all_jp_phrases.add(jp_text)

    print(f"Translating {len(all_jp_phrases)} unique phrases for {endpoint_key}...")
    print(f"📝 Total unique phrases to translate for {endpoint_key}: {len(all_jp_phrases)}")

    jp_to_translated = {}
    for jp in tqdm(all_jp_phrases, desc=f"Translating {endpoint_key}", unit="phrase"):
        en = deepl_translate(jp)
        if en:
            jp_to_translated[jp] = en.replace("'", "''")
        time.sleep(0.1)

    for feature in data["features"]:
        props = feature["properties"]
        if endpoint_key == "lines":
            id_ = props.get("ogc_fid")
        elif endpoint_key == "stations":
            id_ = props.get("gid")
        if not id_:
            continue

        updates = []
        for field in fields:
            jp_text = props.get(field)
            if jp_text and jp_text not in jp_to_translated:
                print(f"⚠️ No translation found for {field} in id {id_}: '{jp_text}'")
                unmatched_count += 1
            en_text = jp_to_translated.get(jp_text)
            if en_text:
                updates.append(f"{field}_en = '{en_text}'")

        if updates:
            print(f"{endpoint_key} id {id_} → {updates}")
            sql = f"UPDATE {endpoint_key} SET {', '.join(updates)} WHERE id = '{id_}';"
            sql_statements.append(sql)
            print(sql)

    return sql_statements, unmatched_count

# Run processing
print("Starting translation process...")
grouped_sql = {}
unmatched_totals = {}
for key, url in ENDPOINTS.items():
    statements, unmatched = process(key, url)
    grouped_sql[key] = statements
    unmatched_totals[key] = unmatched

# Write SQL file
with open(SQL_FILE, "w", encoding="utf-8") as f:
    f.write("-- Add missing _en columns if they do not exist\n")
    f.write("ALTER TABLE lines ADD COLUMN IF NOT EXISTS n02_003_en TEXT;\n")
    f.write("ALTER TABLE lines ADD COLUMN IF NOT EXISTS n02_004_en TEXT;\n")
    f.write("ALTER TABLE stations ADD COLUMN IF NOT EXISTS n02_003_en TEXT;\n")
    f.write("ALTER TABLE stations ADD COLUMN IF NOT EXISTS n02_004_en TEXT;\n")
    f.write("ALTER TABLE stations ADD COLUMN IF NOT EXISTS n02_005_en TEXT;\n\n")

    for table, statements in grouped_sql.items():
        print(f"Writing {len(statements)} updates for {table}...")
        f.write(f"-- Updates for {table}\n")
        f.write("\n".join(statements))
        f.write("\n\n")

print(f"✅ SQL file created: {SQL_FILE}")
total_updates = sum(len(statements) for statements in grouped_sql.values())
print("📋 Translation Summary")
for table, statements in grouped_sql.items():
    print(f"  {table}: {len(statements)} update statements")
print(f"  Total: {total_updates} update statements across all tables")
print("🚫 Unmatched Fields Summary")
for table, count in unmatched_totals.items():
    print(f"  {table}: {count} unmatched fields")
print(f"  Total unmatched: {sum(unmatched_totals.values())}")
