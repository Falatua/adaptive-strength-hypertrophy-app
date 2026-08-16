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
- Forge glyph: original 16, 20, or 24-pixel SVG geometry for destinations, training states, body regions, and movement patterns. Standard safety and account controls may retain familiar labeled system icons.
- Status chip: compact monospace label with icon and a written state, never color alone.
- Evidence panel: field-panel or raised-panel, plain-language headline, source or rule label, and a next action only when one exists.
- Training Field Guide: compact framed route, next-win, and evidence rows with one tactile selector that opens the full explanation.
- Quest bubble: one-pixel accent frame, dark readable fill, short source-backed coaching sentence, no animated typing.
- Data input: familiar native control proportions, one-pixel trail-line, clear focus ring, explicit label and help when needed.
- Modal: native dialog behavior, sticky header, visible close action, contained mobile width, and a single primary completion action.
- Sound cue: original synthesized pocket-console feedback under 700 milliseconds, low-volume, meaningful rather than ambient, off by default, previewable, and always suppressed by quiet mode.
- Loading moment: an original compact visual tied to a real wait state, with written status, a static reduced-motion fallback, no fake delay, and no effect on training logic.
- Progressive disclosure: Today shows one dominant start path, Workout puts the current set before notes, Library collapses filters on compact screens, and Progress exposes three primary time ranges with the rest under More.
- Forge level: describes recorded journal depth only. It must never rank athlete ability, training age, readiness, or identity.

# Motion and Generated Visual Assets

Higgsfield is an approved external authoring tool for original ForgePath loading moments, transitions, environment loops, celebration plates, and other visual polish when its connector or production workflow is available. GPT Images and other tools may also be used when they are the better fit. Tool choice does not change the design or quality contract.

The strongest first concepts are a plate stack that fills one plate at a time, a field-guide route stamp that confirms a saved decision, and a quiet gym environment whose lights or equipment activate as progress loads. These are concept families, not copied game assets. Every character, silhouette, animation, sound, icon, and interface treatment must remain original and independently ownable.

Generated media is an authoring input, not a runtime dependency. Accepted work must be exported, optimized, reviewed, and stored as a versioned local app asset with its prompt, source tool, generation date, license or usage basis, edit history, and approval state. No provider key or generation request belongs in the browser bundle.

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
