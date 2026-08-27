# ForgePath Image Accuracy Expansion

## Release record

- Authoring tool: OpenAI GPT Images through the built-in image generation workflow
- Generation date: 2026-08-26
- Runtime dependency: none
- Usage: original ForgePath product artwork
- Approval state: accepted after contact-sheet and rendered mobile review

## Body-region prompt direction

Create one clean 4 by 3 atlas of twelve anatomically clear fitness body-region emblems in this exact row-major order: chest, back, shoulders, quadriceps, hamstrings, glutes, biceps, triceps, forearms, calves, trunk or core, whole body or all. Use front or rear human views according to which makes the target unmistakable. Highlight only the named target in effort orange, keep other anatomy bone or muted sage, and use the ForgePath evergreen, bone, lime, orange, and black palette. Keep every figure centered, complete, readable at small mobile size, stylistically consistent, original, and free of text, labels, gradients, glow, or copied game imagery. Use a transparent background.

## Movement supplement prompt direction

Create one clean 5 by 4 atlas of twenty exact exercise-family emblems in this row-major order: push-up, parallel-bar dip, rear-delt fly, back extension, kettlebell swing, split squat, lunge, step-up, hack squat, hip abduction, hip adduction, Nordic hamstring curl, pull-up, pullover, upright row, face pull, shrug, sled push, seated calf raise, tibialis raise. Show the correct body position, direction of effort, and defining equipment for every named movement. Keep each athlete and implement fully inside its cell, use the established ForgePath pixel-field-guide visual language and palette, and avoid text, labels, gradients, glow, extra limbs, implausible joints, or ambiguous machine geometry. Use a transparent background.

## Processing history

The generator returned a flat background despite the transparency request. A second background-removal pass preserved the drawings but baked in a checkerboard. Runtime crops therefore use deterministic edge-connected neutral-background removal, alpha conversion, and disconnected-debris cleanup. The two untouched accepted source atlases remain in this folder. Runtime exports are stored under `public/icons/body-regions/` and `public/icons/movements/`.

## Truth and quality boundary

Body-region art identifies the selected anatomical region. Movement art identifies the exercise family and defining setup, while the written movement name, equipment, angle, and athlete-entered setup remain authoritative. Acceptance includes a file-integrity gate, exact inventory checks, transparent PNG checks, deterministic movement mapping tests, all-tab and onboarding browser checks, desktop Chromium, mobile Chromium, iPhone WebKit, console integrity, horizontal containment, contact-sheet review, and rendered mobile review.
