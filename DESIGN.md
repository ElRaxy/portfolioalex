---
name: Alex Micó Portfolio
description: Cobalt Product Stage built around Alex, Strev, Sereno and inspectable product evidence.
colors:
  cobalt: "#2f6ba8"
  cobalt-hover: "#27598c"
  cobalt-deep: "#11171c"
  cobalt-matte: "#1d1c2d"
  cobalt-on: "#ffffff"
  cobalt-muted: "#e4eff9"
  paper: "#f7f6f2"
  paper-raised: "#ffffff"
  ink: "#19191b"
  muted-ink: "#66656b"
  night: "#151619"
  night-raised: "#1e2024"
  night-ink: "#f2f1ed"
  night-muted: "#b4b1aa"
typography:
  display:
    fontFamily: "Anek Latin, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(3.25rem, 8vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Anek Latin, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Anek Latin, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Anek Latin, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  stage: "3px"
  control: "3px"
  utility: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "clamp(72px, 10vw, 136px)"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-on}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "44px"
  case-cover:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-on}"
    rounded: "{rounded.stage}"
    minHeight: "clamp(16rem, 30vw, 22rem)"
  evidence-frame:
    backgroundColor: "{colors.cobalt-deep}"
    rounded: "{rounded.stage}"
    aspectRatio: "16 / 10"
---

# Design System: Alex Micó Portfolio

## Overview

**Creative North Star: Cobalt Product Stage**

The portfolio uses one committed cobalt surface to connect Alex with Strev and Sereno. The home is
the stage: full-width identity, real evidence and equal flagship scale. A case page is the cover:
compact title surface inside the reading column, followed by neutral long-form content.

The system is direct, product-led and personal. Real screens carry specificity. Cobalt carries
recognition. Anek Latin carries voice. Space and scale carry hierarchy.

## Core Rules

### Stage and cover are related, not duplicated

- The home stage may fill the viewport and contain Alex, portrait, actions and two product previews.
- The case cover stays inside 68rem, between 16rem and 22rem tall, and contains only H1 plus tagline.
- A case never repeats the portrait, hero previews, hero CTA or entrance choreography.
- Long-form content returns to the theme surface immediately after the cover.

### The one field rule

Cobalt is allowed to be large when it establishes identity. It is not scattered across cards,
badges or decorative stripes. Product screenshots retain their own colors.

### The evidence is real rule

Every project uses its real image and a caption in the document. The caption remains visible on
desktop and in every case; the compact mobile supporting index clips it visually because the case
keeps the full evidence. A 16:10 exterior frame gives the cases one system. Strev fills the frame.
Sereno, SaveMyMoneyNow and Atalaya use `contain` on a matte so no data is cropped. Synthetic windows
and fake product chrome are forbidden.

### The structure survives the styling rule

The case keeps one H1, semantic sections, a real `<ol>` for decisions, project scope in the DOM and
selectable results. Scope is hidden from the visual and accessible heading because the case H1 has
already established it. CSS removes ornamental numbers without changing document order.

## Color

### Identity

- **Stage cobalt `#2f6ba8`:** hero, flagship field, case cover, Contact and social card.
- **On cobalt `#ffffff`:** headings and high-emphasis controls. Contrast 5.54:1.
- **Muted on cobalt `#e4eff9`:** supporting text. Contrast 4.75:1.
- **Deep stage `#11171c`:** Strev stage and evidence matte.
- **Sereno matte `#1d1c2d`:** preserves the complete panoramic screenshot.

Do not use `#dbe9f6` as normal-size text over stage cobalt; it sits below the 4.5:1 target after
rounding.

### Reading surfaces

- Light: `#f7f6f2` page, `#ffffff` raised, `#19191b` text, `#66656b` muted.
- Dark: `#151619` page, `#1e2024` raised, `#f2f1ed` text, `#b4b1aa` muted.
- `--surface-sel` is the single results band. It is not a collection of result cards.

## Typography

**Interface family:** Anek Latin with system fallbacks.

- Display: names and case titles, 600 weight, compact line height.
- Headline: major sections and decisive statements.
- Body: 1rem minimum and a 68ch maximum for long prose.
- Labels: normal case, sans-serif, 0.875rem minimum where evidence matters.
- Monospace: no ornamental use. Authentic code may use the environment's code font inside a real
  technical artifact, but ordinary labels, dates and navigation use Anek Latin.

## Geometry

- Stage and product frames: 3px radius.
- Interactive controls: 3px radius and 44px minimum target.
- Utility feedback: 6px only when a status surface needs grouping.
- No pills for language, theme, case links or project tags in the current interface.
- No colored side stripes, repeated cards or universal divider lines.

## Home Stage

- Hero and two flagship chapters may use full-bleed cobalt/deep surfaces.
- Strev and Sereno receive the same exterior 16:10 evidence area and two actions each.
- Supporting work uses open rows at a smaller scale. At 600px and below it becomes a compact index:
  6.25rem evidence thumbnail, H4 title, complete description, stack and actions. The case keeps the
  full evidence and caption.
- About uses one lead beside one narrative column on desktop, then facts below. It must advance the
  Strev/Sereno story rather than introducing Alex for a second time.
- Experience exposes roles as H3 and studies as H4 below the Formation H3.
- Contact closes the stage but its title never exceeds the identity or flagship names.
- About, Experience, Stack, Contact and Footer continue the same type and geometry without copying
  the hero.

## Case Cover and Reading Flow

1. Neutral back link with 44px target.
2. Compact cobalt cover with H1 and tagline only.
3. Summary label, summary prose and real evidence.
4. Problem and optional gap as open reading blocks.
5. Decisions in a two-column desktop grid and one column on mobile. The `<ol>` remains semantic;
   `::before` renders no ordinal.
6. Results in one tonal band with selectable values and labels.
7. Rectangular external links and the shared localized CTA.
8. Shared Contact and Footer remain neutral on cases.

Case content is static. Theme and language transitions remain global state feedback; cases do not
add scroll-linked movement, reveal opacity or decorative animation.

## Project Evidence

- Exterior ratio: 16:10 on every case route.
- Strev: `object-fit: cover`, because its source is already 16:10.
- Sereno: `object-fit: contain` on `#1d1c2d`.
- SaveMyMoneyNow: `object-fit: contain` on deep matte.
- Atalaya: `object-fit: contain` on deep matte.
- Captions remain visible, normal case and at least WCAG AA contrast.

## Social Identity

### Favicon

The mark is `A.` in one ink: full cobalt square, geometric white A and a small white square as the
period. No M, inner card, gradient, shadow, text node or transparent double mask.

`favicon.svg` is canonical. `apple-touch-icon.png` is a 180x180 RGB derivative with opaque cobalt
background.

### Open Graph

The card is a full 1200x630 cobalt field. Alex and his role occupy the left side. Strev and Sereno
occupy the right side at exactly the same size. There are no boxes, fake windows, stack inventories
or secondary projects.

The neutral alt is `Alex Micó Robles · Full Stack Developer · Strev + Sereno`.

### Raster commands

The installed ImageMagick build has no configured font registry, so OG rasterization pins the local
Arial TTF explicitly. The SVG retains `sans-serif` for browser display.

```sh
magick -background '#2f6ba8' -density 384 public/favicon.svg -resize 180x180! -alpha off -depth 8 -colorspace sRGB -strip -define png:exclude-chunk=date,time -define png:color-type=2 public/apple-touch-icon.png
magick -font '/System/Library/Fonts/Supplemental/Arial.ttf' -background '#2f6ba8' -density 192 public/og-image.svg -resize 1200x630! -alpha off -depth 8 -colorspace sRGB -strip -define png:exclude-chunk=date,time -define png:color-type=2 public/og-image.png
```

The committed PNGs must be RGB, sRGB, 8-bit and exactly 180x180 or 1200x630. Public references use
`?v=3` in OG, Twitter, JSON-LD, favicon, apple touch icon and the 404 page.

The prerender gate also pins the approved SHA-256 values so a stale raster with valid dimensions
cannot silently replace the v9 artwork: `86d3162b...39d02` for OG and `420e9780...109d3` for Apple.

## Interaction and Accessibility

- Visible focus uses a 3px accent outline with offset.
- Text uses 4.5:1 minimum; controls and focus use 3:1 minimum.
- Theme, language, menu, back, case links, CTA and Contact remain keyboard reachable.
- The theme control shows one icon for the available action and names that action explicitly:
  switch to light or switch to dark. It is an action button, not an `aria-pressed` state toggle, and
  remains a 44px target. Before hydration its accessible name is neutral because the static HTML
  cannot know the saved client theme; after synchronization it names the exact action.
- `prefers-reduced-motion` removes global transitions and never hides essential content.
- At 320px, SaveMyMoneyNow stays intact as a product name in both the index and its case; it must
  not split inside the word, clip or overflow.
- Case routes preserve localized back link to `#portfolio`, alternate language route and CV filename.

## Do

- Show Strev and Sereno at equal visual weight.
- Use cobalt as a committed field of identity.
- Use real screenshots and preserve their data.
- Let a compact cover connect each case to the home.
- Keep copy, results, links and captions selectable and inspectable.

## Do Not

- Duplicate the hero on case pages.
- Reintroduce decorative terminals, status dots, card walls or badge inventories.
- Crop Sereno or supporting evidence to force a ratio.
- Use visual ordinals, pill links or hairlines on every section.
- Change shared routing, CV, Contact or prerender contracts for visual convenience.
