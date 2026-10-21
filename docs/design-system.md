# Lyoria demo design system

Scope: the public ReviewOps experience at `/`. Preserve the existing logo. The CSS module is the source of truth; no new dependency or external font is required.

## Tokens

`components/review-demo.module.css` defines three scoped layers:

- Primitives: existing Lyoria navy, ink and white; HSL greens, neutral grey and amber; 4/8/12/16/20/24/32px spacing; compact text sizes and radii.
- Semantics: surface, background, primary action, muted text, borders, positive and warning statuses.
- Components: button foreground/background/radius and card surface/border/radius/padding.

Use semantic or component variables for colours in component rules. Raw colour values belong only in the primitive definitions. Green means a primary action or a strength; amber marks a problem or information to verify. Text labels always accompany colour.

## Layout and components

Desktop: persistent navigation, compact heading, transparent result provenance, four computed metrics, context form and analysis side by side. At 960px and below, the form and results stack. At 640px and below, navigation becomes a horizontal row and controls use mobile-friendly sizing.

Cards distinguish evidence-backed insights from editable reply drafts. Expandable quotes expose source reviews. Buttons have hover, pressed, disabled and visible keyboard-focus states. Reduced-motion preferences disable transitions. The skip link reaches the main workspace.

Metrics describe only imported reviews, never business-wide performance. Prepared example results are labelled fictional. Replies stay drafts until a human approves. Editing a reply or withdrawing fact confirmation revokes approval. Copy is disabled until approval. Nothing is automatically published.

## Verification

Production build and four existing parser/provider tests pass. Browser checks verify approval, edit resets, withdrawn fact confirmation and example reset. Visual inspection covers desktop and narrow layout; this is not a full screen-reader audit.
