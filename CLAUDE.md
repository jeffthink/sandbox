# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Context

This is a scratch pad repository for HTML experiments and interactive visualizations. Each experiment is a standalone HTML file with embedded CSS and JavaScript.

## Development Workflow

### Adding New Experiments
When creating new experiments:
1. Create a new folder for the experiment (e.g., `my-experiment/`)
2. Create a standalone HTML file with embedded CSS and JavaScript
3. Use CDN links for external libraries (D3.js, etc.)
4. Add an entry to `index.html` with a description card
5. Update `README.md` with experiment details

### Code Style
- Keep experiments as single HTML files when possible
- Embed CSS in `<style>` tags
- Embed JavaScript in `<script>` tags
- Use semantic HTML structure
- Follow responsive design principles

### Testing
- Test in multiple browsers
- Ensure experiments work without a server (file:// protocol)
- Use `npm start` for live development with auto-reload

## Common Patterns

### Libraries Used
- **D3.js** - Primary visualization library, loaded via CDN
- **Vanilla JS** - No framework dependencies
- **CSS Grid/Flexbox** - For responsive layouts

### File Organization
```
experiment-name/
└── experiment-name.html    # Self-contained experiment
```

## Development Commands

```bash
npm start          # Start live-server, opens index.html
npm run serve      # Same as npm start
```