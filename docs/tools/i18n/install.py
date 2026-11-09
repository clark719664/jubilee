"""Splits translation results into the files the app loads.

    python install.py <strings.json> <results-dir> [<results-dir> ...]

public/i18n/<code>/ui.json loads at start; h/<holiday>.json loads with that holiday. Counts come from plurals.json,
{code: {English "other" form: {Intl.PluralRules category: text}}}, and go in ui.json as objects.
"""
import glob
import json
import os
import sys

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, '../../../public/i18n')


def main():
    strings = json.load(open(sys.argv[1], encoding='utf-8'))
    results = {}
    for folder in sys.argv[2:]:
        for f in glob.glob(folder + '/*.json'):
            code = os.path.basename(f)[:-5]
            if 2 <= len(code) <= 3:
                results.setdefault(code, {}).update(json.load(open(f, encoding='utf-8')))
    plurals = json.load(open(os.path.join(HERE, 'plurals.json'), encoding='utf-8'))
    for code, done in sorted(results.items()):
        groups = {}
        for item in strings:
            if item['s'] in done and 'one' not in item:
                groups.setdefault(item['g'], {})[item['s']] = done[item['s']]
        groups.setdefault('ui', {}).update(plurals.get(code, {}))
        for group, entries in groups.items():
            path = os.path.join(OUT, code, f'{group}.json')
            os.makedirs(os.path.dirname(path), exist_ok=True)
            json.dump(entries, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(code, len(done), 'strings, coverage', round(100 * sum(1 for i in strings if i['s'] in done) / len(strings)), '%')


if __name__ == '__main__':
    main()
