# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Context

This is an interactive sandbox for data visualizations and experiments built with SvelteKit and D3.js. The project focuses on creating reusable, interactive visualization components that can be embedded in other sites.

## Development Workflow

### Adding New Experiments
When creating new experiments:
1. Create a visualization component in `src/lib/components/visualizations/`
2. Create the main route in `src/routes/experiment-name/+page.svelte`
3. Create an embed route in `src/routes/experiment-name-embed/+page.svelte`
4. Add an entry to the home page (`src/routes/+page.svelte`)
5. Update `README.md` with experiment details

### Code Style
- Use SvelteKit conventions and best practices
- Keep visualization logic in reusable components
- Use D3.js for data manipulation and visualization
- Follow responsive design principles
- Separate concerns: routes handle page structure, components handle visualization logic

### Testing
- Test in development with `npm run dev`
- Build and preview production with `npm run build && npm run preview`
- Ensure visualizations work on both desktop and mobile
- Test embed routes in iframes

## Common Patterns

### Component Structure
```svelte
<!-- Visualization Component -->
<script>
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  
  export let data;
  let svgElement;
  
  $: if (svgElement && !svg) {
    setupVisualization();
  }
</script>
```

### Route Structure
```svelte
<!-- Full Page Route -->
<script>
  import VisualizationComponent from '$lib/components/visualizations/...';
</script>

<!-- Embed Route -->
<script>
  import VisualizationComponent from '$lib/components/visualizations/...';
</script>
<style>
  /* Minimal embed styles */
</style>
```

### Libraries Used
- **SvelteKit** - Web framework with SSG support
- **D3.js** - Data visualization library
- **Vite** - Build tool and dev server

### File Organization
```
src/
├── routes/
│   ├── experiment/+page.svelte      # Full page version
│   └── experiment-embed/+page.svelte # Embed version
└── lib/
    └── components/
        └── visualizations/
            └── ExperimentViz.svelte # Reusable component
```

## Development Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run deploy     # Deploy to Vercel
```

## Important Conventions

1. **Separate Embed Routes**: Use `-embed` suffix for embed-friendly versions
2. **Reusable Components**: Keep visualization logic in components, not routes
3. **D3 Integration**: Initialize D3 in reactive statements or onMount
4. **Responsive Design**: Ensure visualizations work at all screen sizes
5. **Clean Separation**: Routes handle layout/structure, components handle visualization

## Privacy: Never Commit PII

This repo is public. **No personally identifiable information may appear in any committed file** — source, tests, docs, specs, fixtures, `.env.example`, comments, or commit messages.

PII includes real family/people names, real swimmer names, individual times tied to a real person, email addresses, passwords, and the Google Sheet CSV URLs (treat as secrets).

Rules:
- **Secrets and identifiers live in env vars only** (the Vercel dashboard), never in code or config tracked by git.
- **Use fictional placeholders** in all examples, tests, and docs (e.g. `riverside`, `SWIM_RIVERSIDE_PASSWORD`). Never a real name, even as a "realistic" example.
- **Real data goes in gitignored files only** (e.g. `config.local.md`, `config.<slug>.local.md`). Verify the file is gitignored before writing real data to it.
- **Before every commit, double-check the staged diff for PII** — `git diff --cached` — and stop if anything real slips in. This applies to commit messages too.
- If unsure whether something counts as PII, treat it as PII.

## Deployment

The project is configured for Vercel deployment with:
- Static site generation
- Proper headers for iframe embedding
- Clean URLs