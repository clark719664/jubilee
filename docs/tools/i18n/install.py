"""Splits translation results into the files the app loads.

    python install.py <strings.json> <results-dir> [<results-dir> ...]

public/i18n/<code>/ui.json loads at start; h/<holiday>.json loads with that holiday.
"""
import glob
import json
import os
import sys

OUT = os.path.join(os.path.dirname(__file__), '../../../public/i18n')


def main():
    strings = json.load(open(sys.argv[1], encoding='utf-8'))
    results = {}
    for folder in sys.argv[2:]:
        for f in glob.glob(folder + '/*.json'):
            code = os.path.basename(f)[:-5]
            if 2 <= len(code) <= 3:
                results.setdefault(code, {}).update(json.load(open(f, encoding='utf-8')))
    for code, done in sorted(results.items()):
        groups = {}
        for item in strings:
            if item['s'] in done:
                groups.setdefault(item['g'], {})[item['s']] = done[item['s']]
        for group, entries in groups.items():
            path = os.path.join(OUT, code, f'{group}.json')
            os.makedirs(os.path.dirname(path), exist_ok=True)
            json.dump(entries, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(code, len(done), 'strings, coverage', round(100 * sum(1 for i in strings if i['s'] in done) / len(strings)), '%')


if __name__ == '__main__':
    main()
