# Theme System Design

**Date:** 2026-04-17  
**Status:** Approved

## Overview

Add a site-wide Shiki-powered theme system to halcyonline. The entire site colour scheme is driven by CSS custom properties derived from Shiki editor themes. Users pick a theme from the existing sliding panel. All text switches to a monospace font.

## Goals

- Every Shiki bundled theme available as a colour scheme option
- Theme picker lives in the existing sliding panel — each entry shows 3 colour dots + theme name
- No flash of wrong theme on page load
- Monospace font (JetBrains Mono) applied site-wide
- Remove the existing dark/light toggle entirely
- Convert existing structural CSS to Tailwind utilities where sensible

## Architecture

### Build-time integration (`src/theme-integration.mjs`)

An Astro integration that runs once at build time:

1. Imports all bundled Shiki themes using the `shiki` package (already a transitive dependency of Astro)
2. Extracts 6 CSS custom properties per theme from the theme's token colors and editor colors
3. Writes two artefacts:
   - `public/themes.css` — one `:root[data-theme="<name>"]` block per theme
   - `src/generated/theme-list.json` — array of `{ name, bg, swatch: [color, color, color] }` objects for the panel

### CSS custom properties

| Variable | Source in Shiki theme |
|---|---|
| `--bg` | `editor.background` |
| `--fg` | `editor.foreground` / default token foreground |
| `--accent` | keyword/function token color (vivid) |
| `--accent-2` | string token color |
| `--muted` | comment token color |
| `--border` | `editor.lineHighlightBackground` or gutter color |

All site CSS uses these variables exclusively — no hardcoded colour values remain.

### Theme application

- `BaseLayout.astro` links `public/themes.css` in `<head>`
- An inline `<script is:inline>` in `<head>` (before any paint) reads `localStorage.getItem('theme')` and sets `document.documentElement.setAttribute('data-theme', name)`
- Falls back to `synthwave-84` if nothing is stored

### Sliding panel (`src/components/SlidingPanel.astro`)

- Reads `src/generated/theme-list.json` at build time
- Renders one row per theme: 3 filled circles (swatch colors) + theme name
- Active theme row gets a highlighted border using `--accent`
- On click: sets `data-theme` on `<html>` + `localStorage.setItem('theme', name)`
- Panel width stays at 250px; rows are scrollable

### Panel UI improvements

- **Open button:** Replace the plain "open" text button with a palette icon (SVG) in the header, styled with `var(--accent)`. Tooltip/aria-label: "Choose theme".
- **Close button:** Replace the "×" text with a proper SVG close icon inside the panel header, aligned to the top-right.
- **Panel header:** Add a small `// themes` label in `var(--muted)` monospace font above the theme list.
- **Panel background:** Uses `var(--bg)` with a `var(--border)` right-side border so it feels part of the theme.
- **Transition:** Keep the existing 500ms width transition; ensure overflow is hidden during animation.

## Font

Install `@fontsource-variable/jetbrains-mono`. Import in `global.css`:

```css
@import '@fontsource-variable/jetbrains-mono';
```

Apply globally:

```css
body {
  font-family: 'JetBrains Mono Variable', monospace;
}
```

## CSS Overhaul

### Removed

- `html.dark { }` block
- All `.dark *` selector variants
- `ThemeIcon.astro` component (dark/light toggle button)
- `ThemeIcon` import from `Header.astro`
- All hardcoded colour values in `global.css` and component `<style>` blocks

### Replaced with

- `var(--bg)`, `var(--fg)`, `var(--accent)`, `var(--accent-2)`, `var(--muted)`, `var(--border)` throughout
- Tailwind utility classes for structural layout (padding, margin, display, flex, width, etc.) where existing CSS maps cleanly

### Tailwind theme extension

Add CSS variable mappings in `global.css` via Tailwind's `@theme` so utilities like `bg-base`, `text-accent` work:

```css
@theme {
  --color-base: var(--bg);
  --color-fg: var(--fg);
  --color-accent: var(--accent);
  --color-accent-2: var(--accent-2);
  --color-muted: var(--muted);
  --color-border: var(--border);
}
```

## Default Theme

`synthwave-84` — applied when no theme is stored in localStorage.

## Files Changed

| File | Change |
|---|---|
| `package.json` | add `@fontsource-variable/jetbrains-mono` |
| `astro.config.mjs` | register theme integration |
| `src/theme-integration.mjs` | new — build-time CSS + JSON generation |
| `src/generated/theme-list.json` | new — generated artefact (gitignored) |
| `public/themes.css` | new — generated artefact (gitignored) |
| `src/styles/global.css` | font import, CSS var usage, Tailwind conversion, remove dark mode |
| `src/layouts/BaseLayout.astro` | link themes.css, add inline theme-apply script |
| `src/components/SlidingPanel.astro` | populate with theme list, wire up click handler |
| `src/components/Header.astro` | remove ThemeIcon import, add palette open button |
| `src/components/ThemeIcon.astro` | delete |
| `.gitignore` | add `public/themes.css` and `src/generated/` |

## Out of Scope

- Syntax highlighting for code blocks (separate feature)
- Search functionality
- Pagination
