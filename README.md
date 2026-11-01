# Mňamka

Jednoduchá webová aplikace (PWA) s recepty pro miminko, přepsanými z uložených příspěvků na Instagramu. Funguje na Androidu i iPhonu, po prvním načtení i offline. U každého receptu je uveden zdroj (@autor); obsah patří původním autorům a appka je jen pro soukromé použití.

## Přidání na plochu telefonu

- **iPhone (Safari):** otevři odkaz na appku → tlačítko Sdílet → *Přidat na plochu*.
- **Android (Chrome):** otevři odkaz → menu ⋮ → *Přidat na plochu* / *Nainstalovat aplikaci*.

Oblíbené, jídelníček a nákupní seznam se ukládají jen v daném telefonu.

## Struktura

| Cesta | Obsah |
| --- | --- |
| `data/recipes.json` | všechny recepty |
| `data/menus.json` | hotové jídelníčky (sekce Inspirace) |
| `media/img/` | zmenšené originální screenshoty (WebP) |
| `media/video/` | videa |
| `icons/` | ikony appky |
| `tools/process_media.py` | převod `Obrazky/*.jpg` → `media/img/*.webp`, kopie videí, ikony |
| `tools/validate_data.py` | kontrola dat (povinná pole, unikátní id, existující média) |

## Přidání nového receptu

1. Nové screenshoty nahraj do `Obrazky/` (videa do `Videa/`).
2. `python tools/process_media.py` – vytvoří WebP kopie v `media/img/`.
3. Přidej recept do `data/recipes.json`:

```json
{
  "id": "unikatni-id",
  "title": "Název",
  "ageFrom": 8,
  "categories": ["Polévky"],
  "ingredients": [{ "name": "mrkev", "amount": "1 ks" }],
  "steps": ["…"],
  "tips": [],
  "forAdults": [],
  "notes": "",
  "source": { "author": "autor", "platform": "Instagram" },
  "images": ["media/img/IMG-….webp"],
  "video": null,
  "incomplete": false
}
```

4. `python tools/validate_data.py`, pak commit a push – GitHub Pages se aktualizuje sám.

Recepty, kde příspěvek neuváděl postup nebo množství, mají `"incomplete": true` a v appce štítek „neúplný“.
