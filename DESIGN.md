---
name: Alex Micó Portfolio
description: A restrained product casebook built around real work and clear technical decisions.
colors:
  cobalt: "#2f6ba8"
  cobalt-hover: "#27598c"
  cobalt-soft: "#dce9f6"
  paper: "#f7f6f2"
  paper-raised: "#ffffff"
  ink: "#19191b"
  muted-ink: "#66656b"
  hairline: "#d9d7d1"
  night: "#151619"
  night-raised: "#1e2024"
  night-ink: "#f2f1ed"
  night-muted: "#aaa8a2"
typography:
  display:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  body:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.02em"
  code:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
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
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "44px"
  project-evidence:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0"
---

# Design System: Alex Micó Portfolio

## Overview

**Creative North Star: "The Product Casebook"**

The portfolio behaves like a concise casebook opened on a desk: a personal introduction, four pieces of work and the decisions behind them. Strev and Sereno are primary cases of equal weight; SaveMyMoneyNow and Atalaya support the story without competing with them. It is sober and editorial without pretending to be a magazine. Real screens supply colour and specificity; the surrounding interface stays quiet enough to make those screens legible.

This system explicitly rejects the current operations-dashboard framing, generic developer portfolios and agency campaign pages whose art direction is louder than the work. The grid, terminal and status-light vocabulary is no longer the default visual language.

**Key Characteristics:**

- Product evidence appears before long biography or stack inventories.
- Warm neutral surfaces and one accessible cobalt accent support both themes.
- Large sans-serif typography creates hierarchy without display gimmicks.
- Monospace is reserved for authentic commands, output and code metadata.
- Motion confirms state and sequence; it never performs for its own sake.

## Colors

The palette combines warm paper neutrals with a restrained cobalt accent. Dark mode is ink-like rather than pure black, so product imagery remains the most saturated material on the page.

### Primary

- **Working Cobalt:** the only interactive accent. Use it for primary actions, active navigation, links and focus indication.
- **Soft Cobalt Wash:** a quiet selected or supporting surface, never a large decorative gradient.

### Neutral

- **Warm Paper / Raised Paper:** light-theme page and component surfaces.
- **Editorial Ink / Muted Ink:** primary and secondary light-theme text.
- **Night Paper / Raised Night:** dark-theme page and component surfaces.
- **Night Ink / Night Muted:** primary and secondary dark-theme text.
- **Hairline:** structural borders and dividers in either theme.

### Named Rules

**The One Accent Rule.** Cobalt carries interaction; screenshots carry personality. Do not add a second decorative hue to make a section feel different.

**The No Status Palette Rule.** Green, amber and red are reserved for real feedback. They must not decorate the hero, favicon or availability copy.

## Typography

**Display Font:** IBM Plex Sans with system sans-serif fallbacks

**Body Font:** IBM Plex Sans with system sans-serif fallbacks
**Label/Mono Font:** IBM Plex Sans for labels; IBM Plex Mono only for authentic technical artefacts

**Character:** one clear sans-serif family gives the page confidence and continuity. Personality comes from scale, line breaks and evidence, not from mixing fashionable display faces.

### Hierarchy

- **Display** (600, fluid 2.75–5.5rem, 0.98): Alex's name and project case titles only.
- **Headline** (600, fluid 2–3.5rem, 1.05): major home sections and decisive statements.
- **Title** (600, 1.25–1.5rem, 1.25): project names and experience roles.
- **Body** (400, 1rem, 1.65): prose constrained to 68ch.
- **Label** (500, 0.8125rem, modest tracking): dates, project type and concise metadata in normal case.

### Named Rules

**The Mono Must Be True Rule.** If text is not code, a command or machine output, it uses the sans family. Navigation, section labels, contact labels and dates are not code.

## Elevation

The system is flat by default. Depth comes from tonal separation, hairline borders and the overlap of real project imagery. Project media stays grounded without a permanent shadow or decorative glow.

### Shadow Vocabulary

- **Evidence separation:** a functional hairline and tonal surface distinguish real screenshots from the page.
- **Interactive response:** cobalt, underline and border changes communicate hover or focus without lifting the layout.

### Named Rules

**The Flat-at-Rest Rule.** A component at rest must still read correctly with its shadow removed. Borders, spacing and typography carry the structure.

## Components

### Buttons

- **Shape:** compact rectangle with 6px corners and a 44px minimum target.
- **Primary:** cobalt surface, raised-paper text and compact horizontal padding.
- **Hover / Focus:** darken the cobalt slightly; show a visible outer focus ring without translating the control.
- **Secondary:** transparent or raised-paper surface with a hairline border and ink text.

### Chips

- **Style:** small quiet labels on tonal surfaces, normal case and sans-serif.
- **State:** chips describe technology; they are never fake filters or decorative badge walls.

### Cards / Containers

- **Corner Style:** 6px for controls and media, 8px for compact feedback and 12px only for the largest utility surfaces.
- **Project Structure:** project evidence is editorial and open, not enclosed in a padded 20px card. Scale, grid and real media communicate hierarchy.
- **Background:** the page remains the default surface; raised paper or night surfaces are reserved for controls and functional feedback.
- **Shadow Strategy:** flat at rest; raised-media treatment belongs to the image, not every container.
- **Border:** structural hairlines only, with no coloured side stripes.
- **Internal Padding:** use spacing where content needs it; do not add container padding merely to simulate a card.

### Inputs / Fields

- **Style:** quiet surface, functional border and 6px corners.
- **Focus:** cobalt border plus a visible low-opacity focus ring.
- **Error / Disabled:** pair colour with concise text; never rely on colour alone.

### Navigation

- Use sans-serif labels in normal case. Active state combines weight and a short cobalt rule or background wash. Mobile navigation remains compact, keyboard reachable and visually separate from language/theme controls.
- Every interactive control and closing contact route keeps a minimum 44px target.

### Project Evidence

- Every canonical project has one real 16:10 image or authentic output. A short caption explains what the visitor is seeing. Synthetic diagrams belong only inside a case when no direct screen can express the decision.
- Strev and Sereno share the primary scale and visual weight. SaveMyMoneyNow and Atalaya use a quieter supporting treatment.
- Screenshots provide the project-specific colour; cobalt remains the only interface accent.

## Do's and Don'ts

### Do:

- **Do** show Strev and Sereno as equal primary cases, with SaveMyMoneyNow and Atalaya as supporting work, through real screens or authentic output.
- **Do** place selected work immediately after the compact hero on mobile.
- **Do** keep Anuubis Solutions in the experience timeline and the GitHub company field only.
- **Do** retain WCAG AA contrast, reduced-motion handling, visible focus and bilingual parity.
- **Do** use warm whitespace and strong type hierarchy before adding another container.

### Don't:

- **Don't** reuse the current operations-dashboard framing: no fleet counters, server metrics, monitoring signals or decorative status dots.
- **Don't** build a generic developer portfolio from neon gradients, badge walls, fake consoles or interchangeable stack slogans.
- **Don't** turn the profile into an agency campaign page whose art direction is louder than the work.
- **Don't** present internal Anuubis tools, client operations or closed operational metrics as Alex's personal projects.
- **Don't** use monospace for navigation, section labels, dates or ordinary prose.
