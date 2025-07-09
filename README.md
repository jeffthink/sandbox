# HTML Scratch Pad

A scratch pad repository for HTML experiments and interactive visualizations. This collection serves as a playground for exploring various web technologies, visualization techniques, and interactive concepts.

**Now built with SvelteKit** for better component architecture and maintainability while preserving all D3.js visualizations.

## Getting Started

### Prerequisites
- Node.js (for development server)
- Modern web browser

### Installation
```bash
npm install
```

### Running the Project

**Development mode:**
```bash
npm start
# or
npm run dev
```

**Production build:**
```bash
npm run build
npm run preview
```

This will start a Vite development server on port 5173 (dev mode) or port 4173 (preview mode).

## Project Structure

```
html-scratch/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # Main listing page
│   │   ├── +layout.svelte            # Shared layout with navigation
│   │   └── family-math/
│   │       ├── linear/+page.svelte   # Linear growth calculator
│   │       ├── quadratic/+page.svelte # Quadratic relationships
│   │       ├── exponential/+page.svelte # Exponential scenarios
│   │       └── factorial/+page.svelte # Factorial arrangements
│   └── lib/
│       └── components/
│           ├── FamilySlider.svelte   # Shared slider component
│           └── EmbedWrapper.svelte   # Iframe embedding support
├── build/                           # Static build output
└── package.json
```

## Experiments

### Linear Growth Calculator
**Route:** `/family-math/linear`

An interactive visualization demonstrating linear growth patterns through airline ticket cost calculations.

- **Technology:** SvelteKit + D3.js v7.8.5
- **Features:** Interactive slider, animated visualizations, responsive design, embed support
- **Concept:** Shows how costs scale linearly with family size

### Quadratic Growth: Family Relationships
**Route:** `/family-math/quadratic`

An interactive visualization showing how relationships between family members grow quadratically as family size increases.

- **Technology:** SvelteKit + D3.js v7.8.5
- **Features:** Network visualization, smooth animations, dynamic relationship counting, emoji faces
- **Concept:** Demonstrates the n(n-1)/2 formula through connected family member nodes
- **Visual Elements:** Family members as circles with emoji faces, connection lines with heart/conflict symbols

### Exponential Growth: Decision Making
**Route:** `/family-math/exponential`

An interactive visualization demonstrating how family decision-making complexity grows exponentially with each additional family member.

- **Technology:** SvelteKit + D3.js v7.8.5
- **Features:** Dynamic scenario grid, color-coded decisions, animated transitions, "...and more" indicators
- **Concept:** Shows the 2^n formula through all possible agree/disagree combinations
- **Visual Elements:** Grid of decision boxes (green for agree, red for disagree) showing every possible scenario

### Factorial Growth: Line Ordering
**Route:** `/family-math/factorial`

An interactive visualization showing how line arrangement complexity grows factorially, demonstrating the explosive growth of permutations.

- **Technology:** SvelteKit + D3.js v7.8.5
- **Features:** Colorful person avatars, randomized arrangements, smooth animations, connecting lines
- **Concept:** Shows the n! formula through all possible ways family members can arrange themselves in a line
- **Visual Elements:** Rows of colored circles representing different line arrangements with person labels

## Embedding Support

All visualizations support embedding via URL parameters:
- `?mode=embed` - Enables embed mode
- `?embed=true` - Alternative embed parameter
- Automatic iframe detection

Uses Pym.js for responsive iframe resizing.

## Adding New Experiments

1. Create a new route in `src/routes/` (e.g., `src/routes/my-experiment/+page.svelte`)
2. Use the existing components (`FamilySlider`, `EmbedWrapper`) where appropriate
3. Add D3.js visualizations following the established patterns
4. Add an entry to `src/routes/+page.svelte` to link to your new experiment
5. Update this README with a description of your experiment

## Architecture

- **SvelteKit** - Modern web framework with static site generation
- **Component-based** - Shared components eliminate code duplication
- **D3.js Integration** - All visualizations use D3.js for data visualization
- **Responsive Design** - Works on desktop and mobile
- **Embed Support** - Can be embedded in other sites via iframe
- **Static Build** - Outputs static HTML/CSS/JS for deployment

## Technologies Used

- SvelteKit v2 with static adapter
- D3.js v7.8.5 for data visualization
- Vite for development and building
- Pym.js for iframe embedding
- TypeScript support

## Deployment

```bash
npm run build
npm run deploy
```

Configured for Vercel deployment with proper headers for iframe embedding.

## Contributing

This is a personal scratch pad, but feel free to fork and create your own experiments!

## License

ISC