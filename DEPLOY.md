# Vercel Deployment Guide

## Prerequisites

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

## Deployment Steps

### Option 1: Using npm scripts (Recommended)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Deploy to preview**:
   ```bash
   npm run deploy-preview
   ```

3. **Deploy to production**:
   ```bash
   npm run deploy
   ```

### Option 2: Using Vercel CLI directly

1. **Deploy to preview**:
   ```bash
   vercel
   ```

2. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Usage After Deployment

### Standalone Mode (Default)
- Access visualizations normally: `https://your-domain.vercel.app/family-math/linear-growth.html`
- Navigation header visible, full styling

### Embed Mode
- Add `?mode=embed` parameter: `https://your-domain.vercel.app/family-math/linear-growth.html?mode=embed`
- Optimized for iframe embedding with Pym.js
- Navigation header hidden, compact styling

### Automatic Embed Mode
- When loaded in an iframe, automatically switches to embed mode
- Perfect for Ghost blog integration

## Available Visualizations

- **Linear Growth**: `/family-math/linear-growth.html`
- **Quadratic Growth**: `/family-math/quadratic-growth.html`
- **Exponential Growth**: `/family-math/exponential-growth.html`
- **Factorial Growth**: `/family-math/factorial-growth.html`

## Iframe Embedding Example

```html
<iframe 
  src="https://your-domain.vercel.app/family-math/linear-growth.html?mode=embed"
  width="100%"
  height="600"
  frameborder="0">
</iframe>
```

## Ghost Blog Integration

For responsive embedding in Ghost:

```html
<div id="pym-container"></div>
<script src="https://pym.npr.org/pym.v1.min.js"></script>
<script>
  var pymParent = new pym.Parent('pym-container', 'https://your-domain.vercel.app/family-math/linear-growth.html?mode=embed', {});
</script>
```

## Configuration

- **vercel.json**: Handles iframe permissions and redirects
- **package.json**: Includes deployment scripts
- **Pym.js**: Automatically loaded in embed mode for responsive behavior

## Troubleshooting

1. **Iframe blocking**: The vercel.json config allows iframe embedding for `/family-math/` routes
2. **Height issues**: Pym.js handles automatic height adjustment in embed mode
3. **Build errors**: This is a static site - no build step required