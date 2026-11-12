import json

for name in ['cheerful-face', 'secret-dua', 'small-deeds']:
    print(f"\n=== {name} ===")
    try:
        data = json.load(open(f'brand/.whisper/full-{name}.json', encoding='utf-8'))
        for seg in data['transcription']:
            t0 = seg['offsets']['from'] / 1000
            t1 = seg['offsets']['to'] / 1000
            print(f"{t0:6.2f}s - {t1:6.2f}s: {seg['text']}")
    except Exception as e:
        print(e)

