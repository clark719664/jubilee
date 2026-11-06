"""Applies every safety fix to raw translations, then writes them for install.py.

    python finish.py <results-dir> <ingredients.json> <output-dir>

Machine translation got allergens dangerously wrong in testing (sesame became ginger, peanuts became
corn), so allergen words come from the hand-checked overrides.json, and ingredient lines keep the
English beside the translation so a parent can check them.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = {
    'latin': r'[A-Za-zÀ-ɏ]', 'cyrillic': r'[Ѐ-ӿ]', 'arabic': r'[؀-ۿ]', 'devanagari': r'[ऀ-ॣ०-ॿ]',
    'bengali': r'[ঀ-৿]', 'han': r'[一-鿿]',
}
OWN = {'es': 'latin', 'fr': 'latin', 'pt': 'latin', 'id': 'latin', 'ru': 'cyrillic', 'ar': 'arabic', 'ur': 'arabic', 'hi': 'devanagari', 'bn': 'bengali', 'zh': 'han'}
VERB_LAST = {'hi', 'bn', 'ur'}
HAND = {
    'hi': {'Surprise!': 'आश्चर्य!'}, 'bn': {'Back': 'পেছনে'}, 'zh': {'World': '世界'}, 'ur': {'Stickers': 'اسٹیکر', 'Play': 'کھیلیں', 'Undo': 'واپس کریں', 'Play now': 'ابھی کھیلیں!'},
}
FOUND = {
    'es': '{n} de {total} encontrados', 'zh': '已找到 {n} / {total}', 'hi': '{total} में से {n} मिले', 'ar': 'تم العثور على {n} من {total}',
    'fr': '{n} sur {total} trouvés', 'bn': '{total}টির মধ্যে {n}টি পাওয়া গেছে', 'pt': '{n} de {total} encontrados', 'ru': 'Найдено {n} из {total}',
    'ur': '{total} میں سے {n} ملے', 'id': '{n} dari {total} ditemukan',
}


# "Sleeps" is the app's own word for nights left, and machine translation can't guess that.
SLEEPS = {
    'es': ('noches', 'noche', '{sleeps} para {name}', 'en {n} noches', '{n} noches para {name}'),
    'zh': ('个晚上', '个晚上', '{sleeps}后就是{name}', '{n} 个晚上后', '再过 {n} 个晚上就是{name}'),
    'hi': ('रातें', 'रात', '{sleeps} {name} तक', '{n} रातों में', '{name} तक {n} रातें'),
    'ar': ('ليالٍ', 'ليلة', '{sleeps} حتى {name}', 'بعد {n} ليالٍ', '{n} ليالٍ حتى {name}'),
    'fr': ('nuits', 'nuit', '{sleeps} avant {name}', 'dans {n} nuits', '{n} nuits avant {name}'),
    'bn': ('রাত', 'রাত', '{sleeps} বাকি, {name} পর্যন্ত', '{n} রাত পরে', '{name} পর্যন্ত {n} রাত'),
    'pt': ('noites', 'noite', '{sleeps} até {name}', 'em {n} noites', '{n} noites até {name}'),
    'ru': ('ночей', 'ночь', '{sleeps} до праздника {name}', 'через {n} ночей', '{n} ночей до праздника {name}'),
    'ur': ('راتیں', 'رات', '{name} تک {sleeps}', '{n} راتوں میں', '{name} تک {n} راتیں'),
    'id': ('malam', 'malam', '{sleeps} lagi menuju {name}', 'dalam {n} malam', '{n} malam lagi menuju {name}'),
}


def foreign(code, text):
    """True when text uses a script from neither its own language nor a kept name in Latin letters."""
    own = OWN[code]
    return any(re.search(p, text) for name, p in SCRIPTS.items() if name not in (own, 'latin'))


def main():
    src, ingredient_file, out = sys.argv[1:4]
    over = json.load(open(os.path.join(HERE, 'overrides.json'), encoding='utf-8'))
    items = set(json.load(open(ingredient_file, encoding='utf-8')))
    os.makedirs(out, exist_ok=True)
    for code in OWN:
        raw = json.load(open(f'{src}/{code}.json', encoding='utf-8'))
        done = {}
        dropped = 0
        for k, v in raw.items():
            if '\n' not in k and '\n' in v:
                v = v.strip().split('\n')[-1].strip()
            if k[-1:] not in '.!?…' and v[-1:] in '.。।۔':
                v = v[:-1].rstrip()
            if foreign(code, v) or not v or len(v) > len(k) * 4 + 30:
                dropped += 1
                continue
            m = re.search(r'\{(\w+)\} (?:out )?of \{(\w+)\}', k)
            if m and code != 'zh':
                a, b = f'{{{m[1]}}}', f'{{{m[2]}}}'
                first, second = (b, a) if code in VERB_LAST else (a, b)
                if a in v and b in v and v.index(first) > v.index(second):
                    v = v.replace(a, '\0').replace(b, a).replace('\0', b)
            done[k] = v
        for i, word in enumerate(over['words']):
            done[word] = over[code][i]
            done[word.capitalize()] = over[code][i].capitalize()
        done['Eggs'] = done['Egg']
        done['{n} of {total} found'] = FOUND[code]
        done.update(HAND.get(code, {}))
        many, one, until, soon, left = SLEEPS[code]
        done.update({'sleeps': many, 'sleep': one, '{sleeps} until {name}': until, 'in {sleeps}': soon.replace('{n}', '{sleeps}'), 'in {n} sleeps': soon, '{n} sleeps until {name}': left})
        for brand in ('Jubilee', 'Jubi'):
            done.pop(brand, None)
        for k, v in list(done.items()):
            bare = re.sub(r'^(a|an|the|some) ', '', k)
            if bare != k:
                done.setdefault(bare[:1].upper() + bare[1:], v[:1].upper() + v[1:])
        dual = 0
        for k in list(done):
            if k in items and done[k].casefold() != k.casefold():
                done[k] = f'{done[k]} ({k})'
                dual += 1
        json.dump(done, open(f'{out}/{code}.json', 'w', encoding='utf-8'), ensure_ascii=False)
        print(code, len(done), 'dropped', dropped, 'ingredients in both languages', dual)


if __name__ == '__main__':
    main()
