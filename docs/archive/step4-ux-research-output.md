# Step 4 — UX Research Report: ManaCanvas

**Feature being researched:** A visual-first art browsing feed with filters, lightbox detail view, frame removal toggle, and pinch zoom for MTG artwork discovery.

## 1. UX Best Practices for Image-First Browsing

- Art is the hero: Minimize UI chrome
- Hover reveals metadata: Don't clutter the grid
- Instant filter feedback: Skeleton/shimmer while loading
- Lightbox isolation: Darken/blur background to focus attention
- Smooth zoom: Momentum, boundaries, snap-back
- Lazy loading with placeholders: Dominant color or blurred thumbnail

## 2. Competitor / Adjacent Examples

| Platform | What they do | Relevant to ManaCanvas |
|----------|-------------|----------------------|
| **Scryfall** | Card search with image results | Has the data but UI is card-game focused |
| **ArtStation** | Artist portfolios, masonry grid, lightbox zoom | Gold standard for art browsing UX |
| **Unsplash** | Photo grid, hover metadata, lightbox, filters | Closest UX model |
| **Pinterest** | Masonry grid, infinite scroll | Discovery-focused |
| **Google Arts & Culture** | High-res art zoom, clean detail pages | Excellent zoom UX |

## 3. Interaction Inspirations

| Product | Pattern | Why it's relevant |
|---------|---------|-------------------|
| **Unsplash** | Hover → show photographer; click → lightbox | Perfect browse vs. detail balance |
| **Google Arts & Culture** | Ultra-high-res zoom with pan | Sets the bar for art zoom |
| **Spotify** | Dominant color extraction for background | Could theme lightbox bg |
| **Apple Photos** | Pinch zoom with momentum | Native-feeling zoom |
| **Dribbble** | Uniform grid with rounded corners | Clean browsing |

## 4. Anti-patterns to Avoid

| Anti-pattern | Alternative |
|--------------|-------------|
| Tiny thumbnails | Use generous card sizes (min 250px wide) |
| Metadata-heavy grid | Metadata on hover/tap only |
| Filter reloads entire page | Filter in-place, animate grid reflow |
| Zoom in new page | Lightbox overlay with zoom inline |
| No loading states | Shimmer placeholders |
| Cluttered lightbox | Minimal controls, fade in on hover |

## 5. Visual Style Selected

**Style A — Dark Gallery (Museum Mode)**

- Background: Near-black (#0c0c0f)
- Art floats with no borders, subtle shadow
- Metadata on hover (overlay with gradient)
- Translucent filter bar
- Lightbox: full black background, art centered
- Premium, immersive, museum-like feel
- Fonts: Cinzel (logo) + Josefin Sans (body)
