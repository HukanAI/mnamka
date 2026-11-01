"""Kontrola data/recipes.json a data/menus.json: povinná pole, unikátní id, existující média.

Použití: python tools/validate_data.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIRED = {"id": str, "title": str, "categories": list, "ingredients": list, "steps": list,
            "tips": list, "forAdults": list, "notes": str, "source": dict, "images": list, "incomplete": bool}


def main():
    errors = []
    recipes = json.loads((ROOT / "data" / "recipes.json").read_text(encoding="utf-8"))
    seen = set()
    for r in recipes:
        rid = r.get("id", "?")
        for key, typ in REQUIRED.items():
            if not isinstance(r.get(key), typ):
                errors.append(f"{rid}: pole '{key}' chybí nebo má špatný typ")
        if rid in seen:
            errors.append(f"{rid}: duplicitní id")
        seen.add(rid)
        if r.get("ageFrom") is not None and not isinstance(r["ageFrom"], int):
            errors.append(f"{rid}: ageFrom musí být číslo nebo null")
        if not r.get("ingredients"):
            errors.append(f"{rid}: žádné suroviny")
        for path in r.get("images", []) + ([r["video"]] if r.get("video") else []):
            if not (ROOT / path).is_file():
                errors.append(f"{rid}: soubor {path} neexistuje")

    menus = json.loads((ROOT / "data" / "menus.json").read_text(encoding="utf-8"))
    for m in menus:
        for path in m.get("images", []):
            if not (ROOT / path).is_file():
                errors.append(f"menu {m.get('id')}: soubor {path} neexistuje")

    for e in errors:
        print("CHYBA:", e)
    print(f"{len(recipes)} receptů, {sum(r['incomplete'] for r in recipes)} neúplných, {len(menus)} jídelníčky")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
