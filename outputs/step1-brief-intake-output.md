# Step 1 — Brief Intake & Analysis: ManaCanvas

## 1. Goal
Create a visual-first platform for discovering, exploring, and curating Magic: The Gathering artwork — combining rich filtering, AI-powered discovery, artist profiles, personal galleries, and community features into a single destination for MTG art enthusiasts.

## 2. Users Affected
- **MTG Art Collectors** — want to discover and curate artwork by style, artist, mood
- **Casual MTG Players** — browse art for inspiration, deck themes, or nostalgia
- **MTG Artists** — showcase portfolios, gain visibility, connect with fans
- **Content Creators / Streamers** — use visualizations and galleries for content
- **Community Curators** — build themed collections and share with others

## 3. Problem Statement
MTG has 30+ years of stunning artwork across 25,000+ unique cards, but there's no dedicated platform to explore it visually. Current options:
- **Scryfall** — great for card data, but art is secondary to game mechanics
- **Gatherer** — Wizards' official DB, minimal visual browsing
- **Pinterest/Tumblr** — fragmented, no MTG-specific metadata
- **Artist portfolios** — scattered across personal sites, ArtStation, etc.

## 4. Success Metrics
| Metric | Target |
|--------|--------|
| Monthly active users | 10K within 6 months |
| Average session duration | >5 minutes |
| Collections created per user | >2 |
| Artist profile claims | 50+ artists in first year |
| AI discovery engagement | >30% of users use "find similar" |
| Community galleries shared | 500+ in first 3 months |

## 5. Resolved Questions

| Question | Answer |
|----------|--------|
| Data source | Scryfall API |
| Image rights | High resolution, with option to remove card frame (art-only view) |
| AI model | Pre-trained model (later phase) |
| MVP scope | Feed + filters (artist, creature type) + card visualization with frame removal + zoom |
| Monetization | Later phase |
| Artist profiles | Later phase |
| Platform | Web only |
| Dashboards | Not needed for now |
| Download/export | No download, but zoom feature included |

### MVP Scope Summary
1. **Art Feed** — visual grid of MTG artwork (sourced from Scryfall)
2. **Filters** — by artist and creature type
3. **Card Visualization** — click to view high-res, toggle frame on/off (art-only mode), zoom
