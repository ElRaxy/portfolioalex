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

> Prototipo personal 2026-10-03, pendiente de revisión. Base publicada 1e35bcf.
> Conserva la paleta y los componentes publicados. Cambia identidad de entrada, pausa About y selección de proyectos.
> No incorpora la dirección visual del rediseño rechazado del 1 de octubre.

## Overview

**Creative North Star: Cobalt Product Stage**

The portfolio preserves the published Cobalt Product Stage palette and component system. The
prototype changes the home hierarchy: Alex's personal introduction, About and Experience precede
Projects. Case layouts and product evidence remain as published.

The system is direct, product-led and personal. Real screens carry specificity. Cobalt carries
recognition. Anek Latin carries voice. Space and scale carry hierarchy.

## Core Rules

### Stage and cover are related, not duplicated

- The home introduction is centered in a42rem reading width and about78svh, with Alex, role, copy, availability and actions. No product previews or product names appear in it.
- The case cover stays inside 68rem, between 16rem and 22rem tall, and contains only H1 plus tagline.
- A case never repeats the portrait, hero previews, hero CTA or entrance choreography.
- Long-form content returns to the theme surface immediately after the cover.

### The one field rule

Cobalt is allowed to be large when it establishes identity. It is not scattered across cards,
badges or decorative stripes. Product screenshots retain their own colors.

### The evidence is real rule

Every project uses its real image and a caption in the document. The caption remains visible on
desktop, mobile and every case. A 16:10 exterior frame gives the cases one system. Strev fills the frame.
Sereno, SaveMyMoneyNow and Atalaya use `contain` on a matte so no data is cropped. Synthetic windows
and fake product chrome are forbidden.

### The structure survives the styling rule

The case keeps one H1, semantic sections, a real `<ol>` for decisions, project scope in the DOM and
selectable results. Scope is hidden from the visual and accessible heading because the case H1 has
already established it. CSS removes ornamental numbers without changing document order.

## Color

### Identity

- **Stage cobalt `#2f6ba8`:** the full-width About pause, case cover and social card. Hero and home project selection use the existing neutral surfaces.
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

- Home order: introduction → About → Experience → Projects → Stack → Contact → Footer.
- The hero retains the neutral background and blue controls. Visible identity is Alex / Micó in two
  typographic fragments, up to120px on desktop and responsive below600px. Its accessible name remains
  Alex Micó Robles. A short Full Stack role and one factual sentence precede Conóceme / About me and CV.
- The first session visit recomposes the two words through masks, followed by copy and actions within
  990ms. Returning from a case stays static. SSR, missing APIs, denied storage and reduced motion retain
  visible HTML. A native scroll timeline gently gathers the hero; unsupported browsers stay static.
- About uses existing cobalt600, white headings and cobalt100 supporting text, while retaining the
  asymmetric lead/narrative/facts composition. It introduces Alex before the timeline and project evidence.
- Projects are a compact selection in two desktop columns and one mobile column. Strev and Sereno
  lead; SaveMyMoneyNow and Atalaya follow at smaller scale. Every item has one factual sentence,
  a complete contained image, visible caption and existing case/source links. All images are lazy.
- The old sticky project stories and their progress state are removed from home. Full decisions,
  results and technical evidence remain in the four case pages.
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

Case geometry and evidence remain unchanged. Native same-origin View Transitions connect normal
page navigation in220ms; unsupported browsers navigate normally without intercepted clicks. Chapter entrances enhance visible HTML after hydration; no product
image is zoomed or cropped. Theme and language retain their published state feedback.

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

## Prototype motion

Shared Reveal uses WAAPI once on intersection, opacity.65→1 and12px→0 over400ms. Groups stagger45ms.
The document is visible before hydration. Missing browser APIs skip animation, reduced motion skips
it initially and cancels active motion if enabled later, and unmount cancels animations/observer.
About, Experience, Projects heading, Stack, Contact, Footer and case chapters share this restrained
entrance. Experience, Stack, Contact and Footer retain their geometry. Text links gain a thin underline
and arrows move on fine-pointer hover, with immediate keyboard-focus feedback. Press feedback takes
120ms. Mobile navigation links stagger20ms across150ms animations (230ms total), retaining the focus
trap, Escape and body lock. Hero WAAPI cancels on unmount and dynamic reduced motion. Cross-document
navigation uses220ms native View Transitions, disabled under reduced motion. No perpetual motion,
wheel interception, custom cursor or router replacement.

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
