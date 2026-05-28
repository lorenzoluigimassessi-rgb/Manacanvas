# ManaCanvas — New Lens System Spec

## Status: Approved — ready to build

---

## Lens Tabs (underline style, horizontal scroll on mobile)

```
[ Picks ]  [ New ]  [ Eras ]  [ Moods ]  [ Iconic ]  [ Hidden Gems ]
```

---

## 1. Picks (default)

**Sub-pills:** None
**Feed:** Daily-seeded random mix. Changes every 24h.
**Sort:** Random (day-seeded page offset)
**Dividers:** No

---

## 2. New

**Sub-pills:** Text pills (compact)
```
[ Latest drop ]  [ This set ]  [ Coming soon ]  [ Previous set ]
```

**Queries:**
- Latest drop: `has:illustration order:released dir:desc` (page 1)
- This set: `s:{current_set_code} has:illustration`
- Coming soon: `is:preview has:illustration`
- Previous set: `s:{previous_set_code} has:illustration`

**Sort:** Newest first
**Dividers:** Yes — by set name

---

## 3. Eras

**Sub-pills:** Text pills with year range (horizontal scroll)
```
[ Beginning 93–94 ] [ Dark Age 95–97 ] [ Invasion 98–03 ] [ Modern Age 03–08 ] [ Renaissance 08–14 ] [ New Era 14–18 ] [ Modern 18–22 ] [ Multiverse 22+ ]
```

**Queries:**
| Era | Query |
|-----|-------|
| The Beginning | `year>=1993 year<=1994 has:illustration` |
| The Dark Age | `year>=1995 year<=1997 has:illustration` |
| The Invasion Era | `year>=1998 year<=2003 has:illustration` |
| The Modern Age | `year>=2003 year<=2008 has:illustration` |
| The Renaissance | `year>=2008 year<=2014 has:illustration` |
| The New Era | `year>=2014 year<=2018 has:illustration` |
| The Modern Era | `year>=2018 year<=2022 has:illustration` |
| The Multiverse Era | `year>=2022 has:illustration` |

**Sort:** Random within era
**Dividers:** No (single era selected)

---

## 4. Moods

**Sub-pills:** Art cards (horizontal scroll, same pattern as creature type cards)
- Square or 4:3 aspect ratio
- One static representative art_crop per mood
- Label below image
- Active state: border highlight

**Representative images (hand-picked, cached permanently):**

| Mood | Card | Art URL |
|------|------|---------|
| Dark & Haunting | Deliver Unto Evil | `https://cards.scryfall.io/art_crop/front/6/7/67aa7104-7acc-4827-b763-ac053c99baab.jpg?1557576435` |
| Epic & Vast | Emrakul, the Aeons Torn | `https://cards.scryfall.io/art_crop/front/2/4/249db4d4-2542-47ee-a216-e13ffbc2319c.jpg?1758104027` |
| Serene & Mystical | Nylea, God of the Hunt | `https://cards.scryfall.io/art_crop/front/f/1/f185a734-a32a-4244-88e8-dabafbfd064f.jpg?1562837629` |
| Whimsical | Fabled Passage (BLB) | `https://cards.scryfall.io/art_crop/front/8/8/8809830f-d8e1-4603-9652-0ad8b00234e9.jpg?1721427315` |
| Cosmic Horror | Ulamog, the Ceaseless Hunger | `https://cards.scryfall.io/art_crop/front/c/7/c74ae706-b3b3-4097-a387-6f6c38a9b603.jpg?1689995438` |
| Nature & Wild | Craterhoof Behemoth | `https://cards.scryfall.io/art_crop/front/2/7/276f5cee-a501-4658-bd4d-7a044bf1ccbc.jpg?1743204520` |
| Urban & Civilized | Hallowed Fountain (RNA) | `https://cards.scryfall.io/art_crop/front/f/9/f97a6d34-03ab-49f1-b02e-405b733f8843.jpg?1584832278` |
| Violent & Chaotic | Chaos Warp | `https://cards.scryfall.io/art_crop/front/6/5/65ae241c-8955-4c97-8be6-7356fbee2195.jpg?1775941250` |

**Queries per mood:**

| Mood | Scryfall query |
|------|---------------|
| Dark & Haunting | `(s:isd OR s:soi OR s:emn OR s:vow OR s:mid) has:illustration` |
| Epic & Vast | `(s:war OR s:bfz OR s:znr OR s:roe) has:illustration` |
| Serene & Mystical | `(s:thb OR s:ths OR s:bng OR s:lrw OR s:shm) has:illustration` |
| Whimsical | `(s:blb OR s:eld OR s:unf OR s:ust) has:illustration` |
| Cosmic Horror | `(t:eldrazi OR s:emn OR s:one OR s:mom) has:illustration` |
| Nature & Wild | `(t:beast OR t:dinosaur OR t:hydra) color=g has:illustration` |
| Urban & Civilized | `(s:grn OR s:rna OR s:snc OR s:kld) has:illustration` |
| Violent & Chaotic | `(color=r t:instant OR color=r t:sorcery) has:illustration` |

**Sort:** Random
**Dividers:** No

---

## 5. Iconic

**Sub-pills:** Text pills
```
[ All time ]  [ By decade ]  [ Fan favorites ]  [ Tournament staples ]
```

**Queries:**
- All time: `has:illustration order:edhrec` (top ranked overall)
- By decade: `year>=2020 year<=2029 has:illustration order:edhrec` (dynamic per decade)
- Fan favorites: `has:illustration order:edhrec` (same as all time but could weight commander format)
- Tournament staples: `format:modern has:illustration order:edhrec`

**Sort:** EDHREC rank (popularity)
**Dividers:** Optional — by decade when "By decade" active

---

## 6. Hidden Gems

**Sub-pills:** Text pills
```
[ One printing ]  [ Pre-2000 ]  [ Uncommons ]  [ Forgotten artists ]
```

**Queries:**
- One printing: `prints=1 has:illustration`
- Pre-2000: `year<=1999 has:illustration`
- Uncommons & Commons: `(r:common OR r:uncommon) has:illustration`
- Forgotten artists: `has:illustration` + client-side filter for artists with <10 cards (or use random page for variety)

**Sort:** Random
**Dividers:** No

---

## Visualization Rules Summary

| Lens | Sub-pill UI | Feed dividers | Default sort |
|------|------------|---------------|--------------|
| Picks | None | No | Daily seed random |
| New | Text pills | Yes (by set) | Newest first |
| Eras | Text pills (scrollable) | No | Random |
| Moods | Art cards (horizontal scroll) | No | Random |
| Iconic | Text pills | Optional (by decade) | EDHREC rank |
| Hidden Gems | Text pills | No | Random |

---

## What was removed (now in Collections)

- ~~Creature Type~~ → Collections > Creatures
- ~~Mana Color~~ → Collections > Card Types / Advanced
- ~~By Set~~ → Collections > Sets
- ~~By Artist~~ → Collections > Artists

---

## Build order

1. Replace current lens tabs with new 6 tabs
2. Wire Picks (rename current "All" behaviour)
3. Wire New (dynamic set detection)
4. Wire Eras (year range queries)
5. Wire Moods (art cards + static images + queries)
6. Wire Iconic (EDHREC sort)
7. Wire Hidden Gems (prints=1, rarity filters)
