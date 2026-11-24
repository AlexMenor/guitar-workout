---
name: "Alex’s guitar workout"
description: "A compact practice desk for short, focused guitar sessions."
colors:
  paper: "#f3f0e6"
  surface: "#fbfaf5"
  ink: "#302c26"
  muted: "#686254"
  line: "#d7d2c4"
  accent: "#a8492b"
  green: "#3e5949"
  sage: "#e4eadd"
  error: "#963e29"
  inverse: "#fffdf4"
  control-border: "#b9b3a3"
  answer-border: "#bfb9a9"
  answer-error-bg: "#f3e2d9"
  primary-hover: "#4c4337"
  secondary-hover: "#e9e5d8"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(38px, 5.5vw, 60px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-.025em"
  headline:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-.025em"
  question-symbol:
    fontFamily: "Georgia, serif"
    fontSize: "76px"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-.035em"
  question:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.3
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-.02em"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  detail: "4px"
  slot: "5px"
  shortcut: "6px"
  field: "7px"
  button: "8px"
  surface: "14px"
  dialog: "16px"
  round: "50%"
spacing:
  key-gap: "8px"
  button-gap: "10px"
  inline: "12px"
  mobile-stage: "16px"
  group: "18px"
  field-padding: "20px"
  section: "22px"
  comfortable: "24px"
  stage: "28px"
  shell: "36px"
  wide: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.inverse}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
    height: "46px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "11px 8px"
    height: "46px"
  field-select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "9px 12px"
    height: "46px"
    width: "100%"
  nav-shortcut:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.shortcut}"
    padding: "8px"
    height: "44px"
  practice-stage:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "28px"
  answer-key:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "8px 4px"
    height: "54px"
  answer-key-selected:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.ink}"
  answer-key-correct:
    backgroundColor: "{colors.green}"
    textColor: "{colors.inverse}"
  answer-key-incorrect:
    backgroundColor: "{colors.answer-error-bg}"
    textColor: "{colors.error}"
  session-settings:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
  beat-indicator:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.round}"
    size: "42px"
  beat-indicator-active:
    backgroundColor: "{colors.green}"
    textColor: "white"
  progression-slot:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.slot}"
    padding: "6px 10px"
  progression-slot-active:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.green}"
---

# Design System: Alex’s guitar workout

## Overview

**Creative North Star: "The compact practice desk"**

A compact practice desk combines warm paper, dark ink, terracotta actions and sage learning states. Georgia gives headings and musical symbols a human, familiar voice; Arial keeps instructions and controls direct. The interface is quiet and compact, with ruled divisions and one plain practice surface.

The same heading, closed settings summary and restrained controls recur across the four exercises. The circle diagram and metronome retain their teaching roles; ornamental screws and inset equipment framing do not return. The visual system supports quick practice with a guitar in hand.

**Key Characteristics:**

- Warm paper and dark ink with restrained terracotta and sage.
- Compact headings, readable musical symbols and touch-sized controls.
- Flat practice surfaces with quiet borders.
- Stable answer controls, explicit settings application and optional explanations.

## Colors

The palette reads as warm paper with restrained earthy accents. Frontmatter values are normative; the names below explain their use.

### Primary

- **Terracotta** (`accent`): home emphasis, focus rings, selected circle targets and count-in emphasis. Primary action buttons themselves use dark ink.

### Secondary

- **Deep sage green** (`green`): key context, correct answers, completed beats and circle-family identity.
- **Pale sage** (`sage`): selected answers, passed beats and minor-chord surfaces.
- **Rust error** (`error`) and **pale rust** (`answer-error-bg`): incorrect answer borders, labels and backgrounds.

### Neutral

- **Warm paper** (`paper`): page canvas.
- **Light paper** (`surface`): practice stages, selects and reference dialog.
- **Dark ink** (`ink`): reading text and primary actions; **warm inverse** (`inverse`) keeps button and success labels clear.
- **Muted ink** (`muted`): supporting copy, settings summaries and progress.
- **Quiet rule** (`line`): shell divisions, feedback separators and stage borders.
- **Control border** (`control-border`) and **answer border** (`answer-border`): fields and the answer keypad respectively.
- **Warm ink hover** (`primary-hover`) and **paper hover** (`secondary-hover`): button state changes.

**The Functional Accent Rule.** Use terracotta for emphasis and focus, green for key context and correct answers, and error color for incorrect answers. Dark ink carries the primary button.

The reference wheel additionally carries diagram-specific terracotta/sage fills. These do not replace the shared interface palette. Browser theme-color metadata still uses the legacy value (`#f2efdf`); the actual page canvas uses `paper`.

## Typography

**Display Font:** Georgia with Times New Roman and serif fallbacks.
**Body Font:** Arial with Helvetica and sans-serif fallbacks.

Georgia is reserved for page headings, large musical symbols, notes and the circle prompt. Compact sans-serif instructions give each musical task a clear hierarchy without adding a separate label style.

### Hierarchy

- **Display:** the fluid home heading uses `display`; it becomes fixed at (42px) at the phone breakpoint.
- **Headline:** trainer headings use `headline`; at (600px) and below they become (27px), with the interval heading at (25px). At (350px) and below the general trainer heading is (24px); the interval override stays (25px).
- **Question symbol:** Roman numerals and chord roots use `question-symbol`, falling to (66px) on phones and (58px) at the narrow breakpoint. Long chord names use (42px), then (34px) on phones. Interval source notes use (66px), then (58px).
- **Question:** accompanying question text uses `question`. Interval questions use sans-serif (25px), then (22px); the keys prompt uses Georgia (31px/1.2), then (27px) at its own breakpoint.
- **Title:** exercise links use `title`, then (20px) on phones and (18px) at the narrow breakpoint.
- **Body:** home descriptions and general instructions use `body`; practice feedback is typically (13px), and optional help is (12px) with up to (65ch) measure.
- **Label:** `label` supports field labels and progress. Secondary captions are typically (11px); these are sentence case, not decorative eyebrows.
- **Playing note:** the current fretboard note is Georgia (128px/1.15), then (104px) on phones. The next note is (54px/1.2), then (46px).

Native font stacks require no external font download. Progress and numeric statistics use tabular figures.

## Layout

The outer shell is centered at a maximum width of (1040px), including horizontal padding. Desktop gutters are (36px); ordinary trainers are centered at (720px), while the circle-family trainer allows (940px). Header height is at least (76px); main content has (30px) top and (48px) bottom padding. The home library stays a deliberate two-column grid, with a (48px) desktop column gap.

A standard practice surface has (28px) padding. The closed settings summary sits above it between horizontal rules, with a (52px) minimum height. The root keypad has six equal columns with (8px) gaps; the reverse chord-degree keypad also has six. Settings fields use two columns on desktop.

### Responsive behavior

- **At (700px) and below:** the keys trainer changes from figure beside question/response to question, figure, response. Its SVG is capped at (260px), or (230px) during practice, and its surface padding becomes (20px 16px).
- **At (600px) and below:** shell gutters become (18px), header minimum height (64px), and main padding (22px 0 32px). Practice stages use (20px 16px). The root keypad becomes four columns with (7px) gaps and (52px) minimum key height; chord degrees become three columns. Settings normally stack; the notes trainer keeps a two-column settings arrangement with speed and mode spanning the row. Home cards stay in two columns with (22px) gap. Keyboard hints are hidden.
- **At (540px) and below:** the reference dialog uses (14px) padding; its explanation columns stack, and the header shortcut label becomes (10px).
- **At (350px) and below:** type and the home column gap tighten further. A (12px) shell-gutter declaration is a fallback only: in safe-area-capable browsers the later support rule retains effective gutters of at least (18px).
- **Safe areas:** top/bottom shell padding follows device insets. Left/right padding uses the larger of the applicable (36px)/(18px) gutter and the device inset. The update notice also respects the bottom inset. A non-hover device hides keyboard hints regardless of viewport width.

**The Anchored Answer Rule.** Keep the answer grid in place after submission; change its state and reveal feedback below it. The primary action changes to continue in the same action row.

Feedback adds reading space below the controls; it does not replace the keypad. Cards and controls wrap within their containers. Primary actions have a (46px) minimum height; disclosures and reference controls generally provide at least (44px) touch height.

## Elevation & Depth

Practice screens use tonal layering and thin borders rather than floating cards. The only ambient shadow belongs to the modal circle reference (`0 20px 60px #20170d40`), above a dark translucent backdrop (`#20170d99`). Checked chord answers gain a small inset selection stroke (`inset 0 0 0 1px var(--green)`); it denotes state rather than a recessed surface.

**The Flat Practice Rule.** Keep practice surfaces flat. Reserve ambient shadow for the modal reference; use the small inset stroke only to reinforce answer selection.

## Shapes

Plain rounded rectangles define the controls. Use the frontmatter surface radius for practice panels; fields and answer keys use `field`, buttons use `button`, and the reference dialog uses `dialog`. Small learning tiles use `detail`; progression chips use `slot`. Circular beat lights and the close control are functional circles. The circle-family SVG uses rounded chord nodes (11px), orbital guides and fixed spatial positions as teaching geometry. Home exercise links are open, ruled rows without filled card boxes.

## Components

### Buttons

Primary actions are dark ink with warm inverse labels; secondary actions are transparent with a control border, and text actions are muted underlined controls. Use the frontmatter padding and minimum heights, preserving hover colors. Disabled generic buttons use opacity (.55); submitted answer keys remain fully opaque so feedback stays readable. Global focus is a terracotta outline (3px) offset (4px); keypad and reference controls use (3px) offset.

### Inputs / Fields

Use native selects with a light-paper fill, control border, field radius, full width and minimum (46px) height. Desktop select type is (14px), becoming (16px) on phones. Native range and checkbox controls use the accent color. Radio answers remain native inputs visually represented by a custom label surface, with their focus ring transferred to the visible surface.

### Navigation

The header brand combines a small inline SVG pick and compact sans-serif name. The circle-reference shortcut is a quiet terracotta icon/text button with (44px) minimum height; its label remains present on phones. A back link precedes each compact trainer heading. Home exercise links use a top rule, short description and decorative SVG icons (notes, chord diagram, ascending intervals and chord-family circle) in a consistent 1.5px stroke, 28px on desktop and 26px on phones; their arrow moves (3px) on hover. The skip link becomes visible on focus.

### Cards / Containers

Practice surfaces use light paper, a (1px) quiet border and the shared surface radius. The desktop keys panel is a two-column teaching layout; ordinary recall stages contain prompt, keypad, action row and feedback in that order. Optional help remains outside or below the principal task. The modal reference is the exceptional elevated surface and keeps its own scrollable viewport limit.

### Session settings

Native details is closed initially and shows active preferences in its summary. Opening it creates a draft-editing surface. Applying explicitly updates the active exercise and closes the details; canceling or closing restores previous values. Focus returns to the summary after apply or cancel. The summary chevron turns (180deg) over (.15s).

### Stable answer keypad and feedback

The chord trainer uses native radio selection followed by an explicit check action; intervals and keys use answer buttons. Selection uses pale sage with a green border; correctness uses solid green with inverse labels; mistakes use pale rust and a rust border. Text states explain the result and preserve proper musical spelling. The continuation action replaces the check action in the existing action row; theory opens through native details. Progression slots use a sage current step and quiet completed labels.

The signature question entrance is applied to chord and interval prompts only: (200ms), easing `cubic-bezier(.16,1,.3,1)`, opacity (.65 to 1), vertical offset (4px to 0), and blur (1px to 0). The shared helper skips it when `prefers-reduced-motion: reduce` is active. Global reduced-motion CSS removes transitions and restores automatic scrolling; there is no looping decorative motion.

### Metronome and circle teaching

The notes trainer pairs a large current note with a smaller next note and numbered beat circles. Solid green means the active beat, pale sage marks passed beats, and terracotta marks the count-in. Minimum beat-circle size changes from (42px) to (36px) on phones. The start/pause action stays beneath the cues; native browser audio provides the metronome.

The keys trainer retains the circle family's fixed positions as labels fade or return; the target has a terracotta outline and the home chord is green. Study, recall, rebuild and summary states share the same panel. Optional pattern reading is disclosed on request. The global circle reference is a native modal dialog with an accessible name, close button, Escape behavior and explicit outside-panel dismissal.

## Do's and Don'ts

### Do:

- **Do** reuse the paper, surface, ink and state colors from the frontmatter.
- **Do** pair Georgia headings and musical symbols with Arial instructions and controls.
- **Do** retain the answer grid and show concise feedback in place.
- **Do** keep settings collapsed initially, apply drafts explicitly and restore drafts on cancel or closure.
- **Do** place theory in native disclosures and keep visible keyboard focus.
- **Do** skip the question entrance and CSS transitions when reduced motion is requested.

### Don't:

- **Don't** restore screw ornaments, simulated hardware or inset equipment frames.
- **Don't** stretch trainer controls to the full desktop shell.
- **Don't** use correct/error color as the only feedback; retain the written answer and explanation.
- **Don't** silently reset an active round when a draft preference changes.
- **Don't** introduce decorative imagery into the practice controls.
