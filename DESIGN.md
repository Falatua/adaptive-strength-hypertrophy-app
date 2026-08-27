---
schemaVersion: 3
product: ForgePath
avatarProgression:
  journalForms: [Uncharted, Established, Well mapped, Long record]
  assetForms: [apprentice, forged, champion, apex]
  marks: "Original angular Forge Marks increase at every form. They are invented geometry, not copied cultural tattoo language."
northStar: The Pocket Training Field Guide
tokens:
  colors:
    night-trail: "#0d0f0c"
    field-panel: "#141712"
    raised-panel: "#191d17"
    route-grid: "#20251d"
    trail-line: "#30362b"
    bright-line: "#434b3d"
    bone-text: "#f4f6ef"
    quiet-sage: "#9aa391"
    progress-lime: "#e7ff58"
    effort-orange: "#ff7a45"
    evidence-blue: "#61c8ff"
    insight-purple: "#ad8cff"
    warning-red: "#ff626b"
  typography:
    display: "800 3.65rem/1.04 Inter, ui-sans-serif, system-ui, sans-serif"
    headline: "800 2.55rem/1.10 Inter, ui-sans-serif, system-ui, sans-serif"
    title: "760 1.12rem/1.22 Inter, ui-sans-serif, system-ui, sans-serif"
    body: "400 1rem/1.62 Inter, ui-sans-serif, system-ui, sans-serif"
    label: "700 0.7rem/1.35 ui-monospace, SFMono-Regular, Menlo, monospace"
  radii:
    small: 8
    control: 10
    compact-panel: 11
    panel: 18
    hero: 24
  spacing:
    xxs: 4
    xs: 8
    sm: 12
    md: 16
    lg: 24
    xl: 32
    xxl: 48
  elevation:
    panel: "0 18px 60px rgb(0 0 0 / 32%)"
    active: "4px 4px 0 #394022"
    modal: "0 30px 100px rgb(0 0 0 / 70%)"
---

# Overview

## Freak Athlete Home Gym Controls

The Library uses canonical movement names with searchable Freak Athlete, Hyper Pro, ABX, and Leg Developer aliases. Movement detail shows whether every required capability is available at Home Gym. Angle-aware history entry labels the field `ABX back-pad angle`, presents eleven touch-friendly preset buttons, allows any 0 to 90 degree value, and explains that blank means unknown.

Home Gym movement detail and block previews keep exact written identity authoritative. Squat Press, ABX Cambered-Bar Chest-Supported Row, and Red-Band Pull-Apart use searchable home-equipment language. The cambered-bar bench detail never presents an incline-angle control because that movement is flat-only; the chest-supported cambered row does present the ABX angle control.

The same angle identity appears in the block blueprint and active workout. Chest-supported row history is separated by recorded angle just like incline pressing history, so changing the back pad cannot silently borrow progression or record prompts from another setup. On compact phones, the preset controls wrap without horizontal scrolling and remain at least 44 pixels high.

Home Gym preference v2 remains visible through the ordinary block blueprint rather than a hidden coaching mode. A normal three-day route should show the cambered-bar chest-supported row on two days and the pull-up lane on one day when those reserved support slots fit. The first no-history pull-up target must read as provisional 3 × 5 context, never as completed work or a demonstrated record. Exact logged pull-up sets replace that estimate. Calf support appears at most once automatically per round, while direct athlete choices remain unchanged.

Home Gym preference v3 makes the pressing hierarchy visible in that same blueprint. ABX incline work should appear more often than ordinary flat assistance when the declared time budget permits. Competition Bench Press and any other athlete-selected primary stay fixed. One written Two-Board Press, Close-Grip Bench Press, or Spoto Press exposure is the block's targeted triceps exception; it remains stable throughout the block and can rotate only when a new plan version is created. Exact names remain visible so the athlete never mistakes the three histories for one interchangeable bench lane.

## Historical Performance Entry

Past-performance entry uses progressive disclosure inside the selected Exercise Library movement detail. It does not open a second modal. The collapsed action stays near that movement's existing history, and the expanded panel presents familiar labeled controls in a compact responsive grid.

The panel must show the exact movement, a plain-language truth boundary, and a live summary such as `3 sets of 8 at 135 lb · RIR 0 · 45° bench` before the athlete commits. RPE conversion is disclosed rather than hidden. Technique and pain are paired optional evidence: both may be entered or both remain unknown. Session name and setup notes are secondary context, not programming requirements.

On compact phones the grid becomes one column, actions remain at least 44 pixels tall, and the primary save action spans the available width. The saved history labels its Library source and numeric-only quality state. Color supports, but never replaces, those written states.

ForgePath should feel like a private training field guide carried through an original strength adventure. Its North Star is the compact confidence and tactile clarity of a beloved handheld interface, interpreted through an original world rather than copied characters, names, maps, or assets. Training is always the foreground. The adventure layer helps JB understand the route, notice progress, and enjoy returning.

The product is dark, grounded, and dense enough for an experienced athlete without becoming a control room. Large outcomes, compact evidence, clear hierarchy, and one obvious next action matter more than decoration. Pixel craft belongs in avatars, environmental scenes, selectors, badges, and earned celebrations. Prescription numbers, charts, forms, and explanations use modern type and familiar controls.

# Colors

The base is a near-black evergreen rather than pure black. Panels step upward through field-panel, raised-panel, and route-grid. Bone-text is the primary foreground, quiet-sage carries secondary evidence, and trail-line separates structure without making every surface look boxed in.

Progress-lime marks the recommended or selected path. Effort-orange marks progression decisions and active training effort. Evidence-blue marks sources, explanations, and focus. Insight-purple is reserved for records and long-term discoveries. Warning-red is reserved for real pain, safety, destructive, or blocking states. Never use accent colors as decoration when they would imply meaning.

# Typography

Inter or the platform system sans carries all primary reading, numbers, charts, forms, and workout instructions. It should remain crisp under time pressure and at large text sizes. Monospace is reserved for compact labels, route codes, version labels, selectors, and game-like microcopy.

Do not use a pixel font for load, reps, sets, RIR, survey questions, chart labels, or long text. The interface may feel pixel-crafted without making the athlete decode pixel typography.

# Elevation

Hierarchy comes from value steps, restrained shadows, borders, and rare hard-offset active states. Standard panels use a one-pixel trail-line or bright-line. Selected controls may use a four-pixel hard shadow to create the tactile handheld-button effect. Modals use the strongest shadow and an obscured backdrop.

Avoid stacking multiple floating glass panels. Use blur only for persistent navigation or a modal header when the content behind it must remain spatially understandable.

# Components

- Primary action: progress-lime fill, dark text, one-pixel lime border, four-pixel hard offset shadow, minimum 44-pixel target.
- Secondary action: raised-panel fill, bone-text, one-pixel trail-line, no competing accent.
- Navigation selection: filled progress-lime on desktop or a contained lime state on mobile, always paired with `aria-current`.
- Forge destination icon: original GPT Images-authored local PNG emblem at 24 or 26 CSS pixels, always paired with a written label. Today, Plan, Progress, Library, and You share one palette, contour weight, and matte field-guide finish without icon drop shadows.
- Movement-family art: original GPT Images-authored local PNG emblems in one coherent family. The exercise name remains authoritative because a family emblem must never imply exact setup or technique for every variation.
- Status chip: compact monospace label with icon and a written state, never color alone.
- Evidence panel: field-panel or raised-panel, plain-language headline, source or rule label, and a next action only when one exists.
- Training Field Guide: compact framed route, next-win, and evidence rows with one tactile selector that opens the full explanation.
- Quest bubble: one-pixel accent frame, dark readable fill, short source-backed coaching sentence, no animated typing.
- Data input: familiar native control proportions, one-pixel trail-line, clear focus ring, explicit label and help when needed.
- Modal: native dialog behavior, sticky header, visible close action, contained mobile width, and a single primary completion action.
- Sound cue: original synthesized pocket-console feedback under 700 milliseconds, low-volume, meaningful rather than ambient, off by default, previewable, and always suppressed by quiet mode.
- Loading moment: an original compact visual tied to a real wait state, with written status, a static reduced-motion fallback, no fake delay, and no effect on training logic.
- Progressive disclosure: Today shows one dominant start path, Workout puts the current set before notes, Library collapses filters on compact screens, and Progress exposes three primary time ranges with the rest under More.
- Forge level: describes recorded journal depth only. Its badge spells out `Level`, sits inside the avatar footprint below the athlete, and casts no shadow. It must never rank athlete ability, training age, readiness, or identity.

## Training-Block Blueprint

The Plan screen presents one readable route before the detailed workout queue. A horizontal round route establishes duration and the final block review. Compact facts distinguish weekly days, estimated time, planned sets, and recovery checkpoints. Each day then uses a stable movement table with written Primary, Secondary, Accessory, and Tertiary roles, exact movement name, purpose, set and repetition target, optional incline angle, and Suggested or Your choice status.

Each blueprint day uses a full-width disclosure control with a written day number, title, objective, duration, movement count, planned set count, Show or Hide wording, and a state chevron. Day 1 is open on entry and every later day is collapsed. The upcoming-session queue and the full life-aware missed-work explanation are collapsed secondary sections. All disclosure targets are at least 44 pixels, expose `aria-expanded` and `aria-controls`, retain visible focus, and create no horizontal overflow at 320 pixels or wider.

The editor keeps the same weekly structure instead of switching to an unrelated form. On wide screens, structural controls and the editable blueprint sit side by side. At tablet and phone widths, the blueprint appears first so the athlete can understand the proposed block before changing it. Native selects and number inputs retain visible labels, the dialog always opens at its top, and no horizontal overflow is allowed at 320 pixels or wider.

Movement identity, role, setup angle, and the weekly route are labeled as stable until athlete approval. Load, repetitions, recoverable dose, scheduling, and recovery recommendations are labeled separately as adaptive. Planned block totals always say they are estimates. A completed-block review may label movements Keep suggested, Review suggested, Change suggested, or Keep or change, with a written evidence reason and no automatic replacement.

# Motion and Generated Visual Assets

Higgsfield is an approved external authoring tool for original ForgePath loading moments, transitions, environment loops, celebration plates, and other visual polish when its connector or production workflow is available. GPT Images and other tools may also be used when they are the better fit. Tool choice does not change the design or quality contract.

The strongest first concepts are a plate stack that fills one plate at a time, a field-guide route stamp that confirms a saved decision, and a quiet gym environment whose lights or equipment activate as progress loads. These are concept families, not copied game assets. Every character, silhouette, animation, sound, icon, and interface treatment must remain original and independently ownable.

Generated media is an authoring input, not a runtime dependency. Accepted work must be exported, optimized, reviewed, and stored as a versioned local app asset with its prompt, source tool, generation date, license or usage basis, edit history, and approval state. No provider key or generation request belongs in the browser bundle.

Library body-region emblems must make the selected anatomy unmistakable at mobile chip size by using an appropriate front or rear view and one bounded orange target area. Movement art must depict the defining posture and equipment of its mapped family; distinct families must not share art when doing so would create a materially wrong pose or implement. `My preferences` uses the standard thumbs-up metaphor. Every shipped image must pass inventory, PNG integrity, transparency, browser loading, console, responsive containment, contact-sheet, and rendered-flow review.

Do not show a loader for an operation that resolves immediately. If a real wait becomes perceptible, show plain status first and introduce motion only when it improves reassurance or continuity. Never add delay so an animation can finish. Loops must end or yield cleanly as soon as the operation completes.

Prefer lightweight WebM, AVIF, WebP, PNG sequences, SVG, CSS, or canvas according to the visual. Avoid GIF when a smaller accessible format is available. Decorative motion must be lazy-loaded, must not block the first useful action, and should remain under a 350 KB compressed mobile budget per loading asset unless measured evidence justifies an exception.

Every animated state requires a still fallback under `prefers-reduced-motion`, an understandable written status, safe contrast, responsive cropping, and a failure path that leaves the task fully usable. Motion, characters, and celebration can never obscure load, repetitions, sets, RIR, pain, readiness, save status, or the primary workout action.

# Do's and Don'ts

Do:

- Keep the next useful training action obvious within one glance.
- Put the current set controls immediately after the movement title and keep optional notes collapsed until requested.
- Label movement art and exercise icons honestly as movement-family or pattern guidance when the visual is not exact to the variation.
- Translate game inspiration into original interface craft, route language, and earned progress.
- Show why a recommendation exists and what evidence it used.
- Treat missed training as changed evidence, not failure or debt.
- Verify 320-pixel mobile containment, keyboard use, visible focus, reduced motion, contrast, and readable large text.
- Use real completed training data for records, experience, celebrations, and comparisons.
- Pair optional sound with a visible state change. Warning and achievement meaning must never depend on audio alone.
- Use Higgsfield or another suitable creative tool for authored visual polish when the exported result passes originality, accessibility, performance, and app-fit review.

Don't:

- Copy protected character designs, names, creatures, maps, logos, fonts, sound effects, or evolution sequences.
- Add technique-video browsing, form-video feeds, or demo libraries.
- Put a game skin over unclear or unsafe programming logic.
- Use fake pixelation, noisy scanlines, excessive glow, gradient text, or generated visual filler.
- Add decorative loading motion to fast local actions, hold a completed action for an animation, or require a live generation provider to use the app.
- Shame irregular schedules, invent missing readiness, imply medical clearance, or rewrite history.
- Make data labels pixel-styled, tiny, color-only, or dependent on hover.
- Call an experienced athlete a novice because ForgePath has limited evidence.
