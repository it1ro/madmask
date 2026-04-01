## Iteration 9.7 — Landing spacing & section separation

### Goal
- Add more vertical breathing room between landing sections and separate them visually in a subtle way.

### Changes
- Wrapped all post-hero landing sections in a single `landing-stack` container (`app/views/pages/home.html.erb`).
- Added global vertical rhythm + a soft gradient divider between adjacent sections via `.landing-stack > section + section::before` (`app/assets/tailwind/application.css`).

### Notes
- This approach avoids sprinkling extra markup between blocks and keeps spacing consistent even when the featured section is conditionally rendered.
