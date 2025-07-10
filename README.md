# Interactive Sandbox

A collection of interactive visualizations and experiments built with SvelteKit and D3.js. This sandbox serves as a playground for exploring data visualization techniques, mathematical concepts, and interactive web experiences.

## Getting Started

### Prerequisites
- Node.js 16+ 
- Modern web browser

### Installation
```bash
npm install
```

### Running the Project

**Development mode:**
```bash
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
interactive-sandbox/
├── src/
│   ├── routes/
│   │   ├── +page.svelte                    # Main listing page
│   │   ├── +layout.svelte                  # Shared layout with navigation
│   │   └── family-math/
│   │       ├── linear/+page.svelte         # Linear growth visualization
│   │       ├── linear-embed/+page.svelte   # Embed version
│   │       ├── quadratic/+page.svelte      # Quadratic relationships
│   │       ├── quadratic-embed/+page.svelte
│   │       ├── exponential/+page.svelte    # Exponential scenarios
│   │       ├── exponential-embed/+page.svelte
│   │       ├── factorial/+page.svelte      # Factorial arrangements
│   │       └── factorial-embed/+page.svelte
│   └── lib/
│       └── components/
│           ├── FamilySlider.svelte         # Shared slider component
│           └── visualizations/             # Reusable visualization components
│               ├── LinearVisualization.svelte
│               ├── QuadraticVisualization.svelte
│               ├── ExponentialVisualization.svelte
│               └── FactorialVisualization.svelte
├── build/                                  # Static build output
└── package.json
```

## Experiments

### Linear Growth Calculator
**Routes:** `/family-math/linear` | `/family-math/linear-embed`

An interactive visualization demonstrating linear growth patterns through cost calculations.

- **Technology:** SvelteKit + D3.js v7.8.5
- **Features:** Interactive slider, animated visualizations, responsive design
- **Concept:** Shows how values scale linearly with input size

### Quadratic Growth: Relationships
**Routes:** `/family-math/quadratic` | `/family-math/quadratic-embed`

An interactive visualization showing how relationships grow quadratically as group size increases.

- **Technology:** SvelteKit + D3.js v7.8.5
- **Features:** Network visualization, smooth animations, dynamic counting
- **Concept:** Demonstrates the n(n-1)/2 formula through connected nodes
- **Visual Elements:** Emoji faces with connection lines and relationship symbols

### Exponential Growth: Decision Scenarios
**Routes:** `/family-math/exponential` | `/family-math/exponential-embed`

An interactive visualization demonstrating how decision-making complexity grows exponentially.

- **Technology:** SvelteKit + D3.js v7.8.5
- **Features:** Dynamic scenario grid, color-coded decisions, animated transitions
- **Concept:** Shows the 2^n formula through all possible agree/disagree combinations
- **Visual Elements:** Grid of decision boxes (green for agree, red for disagree)

### Factorial Growth: Ordering Arrangements
**Routes:** `/family-math/factorial` | `/family-math/factorial-embed`

An interactive visualization showing how arrangement complexity grows factorially.

- **Technology:** SvelteKit + D3.js v7.8.5
- **Features:** Colorful avatars, randomized arrangements, smooth animations
- **Concept:** Shows the n! formula through all possible ordering permutations
- **Visual Elements:** Rows of colored circles representing different arrangements

## Embedding Support

All visualizations have dedicated embed routes (`*-embed`) optimized for iframe embedding:
- Minimal UI with no navigation
- Responsive sizing with Pym.js
- Clean styling for integration

Example:
```html
<iframe src="https://yourdomain.com/family-math/linear-embed" 
        width="100%" 
        height="400">
</iframe>
```

## Adding New Experiments

1. Create visualization component in `src/lib/components/visualizations/`
2. Create full page route in `src/routes/your-experiment/+page.svelte`
3. Create embed route in `src/routes/your-experiment-embed/+page.svelte`
4. Add entry to the main listing page (`src/routes/+page.svelte`)
5. Update this README with experiment details

## Architecture

- **SvelteKit** - Modern web framework with static site generation
- **Component-based** - Reusable visualization components
- **D3.js Integration** - All visualizations use D3.js for data manipulation
- **Responsive Design** - Works on desktop and mobile devices
- **Separate Embed Routes** - Clean separation between full and embed versions
- **Static Build** - Outputs static HTML/CSS/JS for easy deployment

## Technologies Used

- SvelteKit v2 with static adapter
- D3.js v7.8.5 for data visualization
- Vite for development and building
- Pym.js for responsive iframe embedding
- TypeScript support

## Deployment

```bash
npm run build
npm run deploy
```

Configured for Vercel deployment with proper headers for iframe embedding.

## Contributing

This is a personal sandbox project, but feel free to fork and create your own experiments!

## License

ISC