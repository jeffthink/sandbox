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
│   ├── linear-growth.html       # Interactive family complexity calculator
│   ├── quadratic-growth.html    # Family relationships visualization
│   ├── exponential-growth.html  # Family decision-making complexity
│   └── factorial-growth.html    # Family line ordering complexity
└── [future-experiments]/       # Additional experiment folders
```

## Experiments

### Linear Growth Calculator
**Location:** `family-math/linear-growth.html`

An interactive visualization demonstrating linear growth patterns through airline ticket cost calculations.

- **Technology:** D3.js v7.8.5
- **Features:** Interactive slider, animated visualizations, responsive design
- **Concept:** Shows how costs scale linearly with family size

### Quadratic Growth: Family Relationships
**Location:** `family-math/quadratic-growth.html`

An interactive visualization showing how relationships between family members grow quadratically as family size increases.

- **Technology:** D3.js v7.8.5
- **Features:** Network visualization, smooth animations, dynamic relationship counting
- **Concept:** Demonstrates the n(n-1)/2 formula through connected family member nodes
- **Visual Elements:** Family members as circles with emoji faces, connection lines with heart symbols

### Exponential Growth: Decision Making
**Location:** `family-math/exponential-growth.html`

An interactive visualization demonstrating how family decision-making complexity grows exponentially with each additional family member.

- **Technology:** D3.js v7.8.5
- **Features:** Dynamic scenario grid, color-coded decisions, animated transitions
- **Concept:** Shows the 2^n formula through all possible agree/disagree combinations
- **Visual Elements:** Grid of decision boxes (green for agree, red for disagree) showing every possible scenario

### Factorial Growth: Line Ordering
**Location:** `family-math/factorial-growth.html`

An interactive visualization showing how line arrangement complexity grows factorially, demonstrating the explosive growth of permutations.

- **Technology:** D3.js v7.8.5
- **Features:** Colorful person avatars, randomized arrangements, smooth animations
- **Concept:** Shows the n! formula through all possible ways family members can arrange themselves in a line
- **Visual Elements:** Rows of colored circles representing different line arrangements with person labels

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