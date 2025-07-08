# HTML Scratch Pad

A scratch pad repository for HTML experiments and interactive visualizations. This collection serves as a playground for exploring various web technologies, visualization techniques, and interactive concepts.

## Getting Started

### Prerequisites
- Node.js (for development server)
- Modern web browser

### Installation
```bash
npm install
```

### Running the Project
```bash
npm start
```

This will start a live-server on port 3000 and open the main index page in your browser. The server automatically reloads when files change.

Alternatively, you can open any HTML file directly in your browser without a server.

## Project Structure

```
html-scratch/
├── index.html                    # Main listing page of all experiments
├── family-math/
│   └── linear-growth.html       # Interactive family complexity calculator
└── [future-experiments]/       # Additional experiment folders
```

## Experiments

### Linear Growth Calculator
**Location:** `family-math/linear-growth.html`

An interactive visualization demonstrating linear growth patterns through airline ticket cost calculations.

- **Technology:** D3.js v7.8.5
- **Features:** Interactive slider, animated visualizations, responsive design
- **Concept:** Shows how costs scale linearly with family size

## Adding New Experiments

1. Create a new folder for your experiment (e.g., `my-experiment/`)
2. Create your HTML file inside the folder
3. Design it as a standalone file with embedded CSS and JavaScript
4. Add an entry to `index.html` to link to your new experiment
5. Update this README with a description of your experiment

## Architecture

Each experiment is designed as a self-contained HTML file:

- **Standalone HTML files** - No build system required
- **Embedded assets** - CSS and JavaScript included in HTML files
- **External libraries** - Loaded via CDN when needed
- **Interactive elements** - User controls and responsive visualizations

## Technologies Used

- Pure HTML, CSS, and JavaScript
- D3.js for data visualization
- Live-server for development
- Various visualization and interaction libraries as needed

## Contributing

This is a personal scratch pad, but feel free to fork and create your own experiments!

## License

ISC