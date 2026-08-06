# Rule: Verify CSS Framework Dependencies Before Using Utility Classes

1. **Check `package.json` for CSS Frameworks**:
   Before writing component classes, inspect `package.json` to verify whether the project uses Tailwind CSS, Bootstrap, or a custom Vanilla CSS design system (`globals.css`).

2. **Vanilla CSS Projects**:
   When Tailwind CSS is not in `package.json`:
   - Rely on custom design system classes defined in `globals.css` (e.g., `.container`, `.card`, `.btn`, `.executive-card`).
   - If layout utility classes (e.g., `.flex`, `.grid`, `.gap-md`, `.space-y-md`, `.px-lg`) are needed in components, ensure corresponding CSS definitions are explicitly declared in `globals.css`.
   - Never assume pseudo-variants (e.g., `lg:grid-cols-12`, `sm:flex-row`) exist unless defined in CSS media queries.
