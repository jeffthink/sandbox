# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a scratch pad repository for HTML experiments and interactive visualizations. It serves as a collection of standalone HTML files that demonstrate various concepts, techniques, and visualizations.

## Project Structure

```
html-scratch/
├── index.html                    # Main listing page of all experiments
├── family-math/
│   └── linear-growth.html       # Interactive family complexity calculator
└── [future-experiments]/       # Additional experiment folders
```

## Architecture

Each experiment is designed as a self-contained HTML file with embedded CSS and JavaScript:

- **Standalone HTML files** - No build system or frameworks required
- **Embedded assets** - CSS and JavaScript included in HTML files
- **External libraries** - Loaded via CDN (e.g., D3.js)
- **Interactive elements** - User controls and responsive visualizations

## Development

### Local Development Server

The project includes live-server for development:

```bash
npm start          # Start live-server on port 3000, opens index.html
npm run serve      # Same as npm start
```

The server will automatically open the main index page and reload when files change.

### Adding New Experiments

1. Create a new folder for your experiment (e.g., `my-experiment/`)
2. Create the HTML file inside the folder
3. Add an entry to `index.html` to link to your new experiment
4. Update this CLAUDE.md file if the experiment introduces new patterns or libraries

### Alternative

All HTML files can be opened directly in a web browser without a server.

## Current Experiments

### Linear Growth Calculator (`family-math/linear-growth.html`)
- **Purpose**: Demonstrates linear growth patterns through airline ticket cost visualization
- **Technology**: D3.js v7.8.5 for data visualization and DOM manipulation
- **Features**: Interactive slider, animated visualizations, responsive design
- **Key Components**: Slider control, linear visualization, smooth D3.js transitions