# Interactive Sandbox

A collection of interactive visualizations and experiments built with SvelteKit and D3.js. This sandbox serves as a playground for exploring data visualization techniques, mathematical concepts, and interactive web experiences.

## Getting Started

### Prerequisites
- Node.js 18+
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
src/
├── routes/
│   ├── +layout.svelte                      # Bare root layout (just a slot)
│   ├── (sandbox)/                          # Route group: sandbox pages share its layout
│   │   ├── +layout.svelte                  # Sandbox layout with navigation
│   │   ├── +page.svelte                    # Main listing page
│   │   ├── family-math/
│   │   │   ├── linear/+page.svelte         # Linear growth visualization
│   │   │   ├── linear-embed/+page.svelte   # Embed version
│   │   │   └── ...                         # quadratic, exponential, factorial (+ embeds)
│   │   └── swim-tracker/
│   │       ├── +page.svelte                # Public demo (synthetic data)
│   │       └── [family]/+page.svelte       # Gated family results page
│   ├── (dog-vote)/dog-vote/                # Route group with its own layout (no sandbox nav)
│   │   ├── +page.server.js                 # Redirects to the default dog
│   │   └── [dog]/+page.svelte              # The guessing game
│   └── api/                                # Server endpoints (swim data, dog votes)
└── lib/
    ├── components/
    │   ├── FamilySlider.svelte             # Shared slider component
    │   ├── visualizations/                 # Family math visualization components
    │   ├── swim-tracker/                   # Swim tracker components
    │   └── dog-vote/                       # Breed-guessing game components
    ├── server/                             # Server-only code (swim gate, dog-vote Sheets store)
    └── utils/                              # Data processing utilities
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

### Swim Times Tracker
**Routes:** `/swim-tracker` (public demo) | `/swim-tracker/family` (gated, real data)

A swim meet tracker with a public demo and a password-protected family results page.

- **Technology:** SvelteKit + Google Sheets CSV integration
- **Features:** Summer highlights dashboard, race results table, time progress charts, meet performance tracking
- **Demo data:** Synthetic, fictional data bundled in `src/lib/data/demoSwimData.js` — no network calls, no password needed
- **Family page:** Real results fetched server-side via `/api/swim-data` (a Vercel serverless function). Requires the correct `SWIM_PASSWORD`. Google Sheet CSV URLs (`MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL`) are kept in server-side env vars and are never shipped to the browser. See `src/routes/swim-tracker/README.md` and `.env.example` for setup instructions.

### Guess the Breed (Dog Vote)
**Routes:** `/dog-vote` (redirects to the default dog) | `/dog-vote/<slug>` (one game per dog)

A mobile-first game for guessing a mystery mutt's breed mix before a DNA test (e.g. Wisdom Panel) comes back. Visitors pick 1–5 breeds and percentages that add up to 100, and only see the crowd's average and everyone's guesses after guessing. When the owner flips the reveal switch, the page shows the real breakdown with an animated reveal, a scored leaderboard and fun callouts.

- **Technology:** SvelteKit + D3 + the Google Sheets API, called server-side with a service account (no extra npm packages). Nothing Google-related reaches the browser.
- **Several dogs:** each dog is a slug with its own Google Sheet. Adding a dog means a sheet, an env var and a photo folder, with no code changes.
- **Scoring:** for each breed or group in the real results, add min(guessed %, actual %), for a score of 0–100. If a result is a group (e.g. "Terrier group"), guessed breeds in that group count toward it, using the `breeds` tab. Leaderboard ties go to whoever's counted guess came first.
- **Design notes:** `docs/superpowers/specs/2026-10-23-dog-vote-design.md`

#### Setup

1. **Create a Google service account** (one-time; it can serve every dog):
   1. In [Google Cloud Console](https://console.cloud.google.com), create a project and enable the **Google Sheets API**.
   2. Go to **IAM & Admin → Service Accounts → Create service account** (no roles needed).
   3. Open it, then **Keys → Add key → JSON**. Keep the downloaded file out of the repo.
2. **Create the dog's Google Sheet** with these four tabs. Headers go in row 1 and are matched case-insensitively.

   **`settings`**: key/value rows

   | key | value |
   |---|---|
   | dog_name | Biscuit |
   | pronoun | he / she / they |
   | intro | Optional text shown on the landing page |
   | photos | `1.jpg, 2.jpg` (files in `static/dog-vote/<slug>/`, or full `https://` URLs; the first is the hero) |

   **`votes`**: headers `timestamp | name | guesses | comment`. The app appends rows and never edits them. Each name's latest row counts, matched case-insensitively.

   **`breeds`**: headers `breed | group | image_url` (`image_url` is optional). Paste `docs/dog-vote/breeds-seed.csv` (~70 common breeds) to start. The groups follow Wisdom Panel's: Asian and Oceanian, Companion, Guard, Herding, Hound, Middle Eastern and African, Mountain Dogs, Sighthound, Sporting, Street Dogs, Terrier, Wild Canids. The seed list's breed-to-group assignments are best guesses, so edit them freely.

   **`results`**: a fixed layout, with nothing shown until B1 is TRUE:

   | | A | B |
   |---|---|---|
   | 1 | revealed | FALSE |
   | 2 | breed_or_group | pct |
   | 3+ | e.g. Beagle | e.g. 37.5 |

3. **Share the sheet** with the service account's email (`…@….iam.gserviceaccount.com`) as **Editor**.
4. **Set env vars** in `.env` for local use, and in Vercel project settings for production (see `.env.example`):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: the JSON key's `client_email`
   - `GOOGLE_PRIVATE_KEY`: the JSON key's `private_key`, with its `\n` sequences kept, in double quotes
   - `DOGVOTE_<SLUG>_SHEET_ID`: the id between `/d/` and `/edit` in the sheet URL
   - `DOGVOTE_DEFAULT_SLUG`: where `/dog-vote` redirects
5. **Add photos** to `static/dog-vote/<slug>/`. This repo is public, so **resize each photo and strip its metadata first**: phone photos carry GPS coordinates. On macOS, re-encoding through ImageIO drops all metadata, for example with a small Swift script that uses `CGImageSourceCreateThumbnailAtIndex` (max 1600px) and `CGImageDestinationAddImage` with no properties. Check the file bytes (`strings photo.jpg | grep -i gps`), not Spotlight, which caches old metadata.

In `npm run dev`, setup problems show a message naming exactly what's wrong (missing env var, missing tab or header, sheet not shared). In production, visitors only see "This game isn't set up yet."

#### Adding another dog
1. Create its sheet (step 2) and share it with the same service account.
2. Set `DOGVOTE_<SLUG>_SHEET_ID` (e.g. `DOGVOTE_BISCUIT_SHEET_ID`).
3. Add photos to `static/dog-vote/<slug>/` and list them in its `settings` tab. Its page is `/dog-vote/<slug>`.

#### Revealing the results
Fill in `results` rows 3 and below with the DNA breakdown (breeds or groups, as on the report), then set B1 to TRUE. Within about 15 seconds everyone sees the reveal and voting closes.

## Embedding Support

All visualizations have dedicated embed routes (`*-embed`) optimized for iframe embedding:
- Minimal UI with no navigation
- Responsive sizing with iframe-resizer
- Clean styling for integration
- Automatic height adjustment

### Basic Embedding

For a single iframe:
```html
<iframe id="linear-viz" 
        src="https://yourdomain.com/family-math/linear-embed" 
        width="100%" 
        style="border: none;">
</iframe>

<script>
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/iframe-resizer@4/js/iframeResizer.min.js';
  script.onload = function() {
    iFrameResize({ log: false }, '#linear-viz');
  };
  document.head.appendChild(script);
</script>
```

### Multiple Iframes

When embedding multiple visualizations on the same page, load the script once:
```html
<!-- Your iframes -->
<iframe id="linear-viz" src="https://yourdomain.com/family-math/linear-embed" width="100%" style="border: none;"></iframe>
<iframe id="quadratic-viz" src="https://yourdomain.com/family-math/quadratic-embed" width="100%" style="border: none;"></iframe>
<iframe id="exponential-viz" src="https://yourdomain.com/family-math/exponential-embed" width="100%" style="border: none;"></iframe>
<iframe id="factorial-viz" src="https://yourdomain.com/family-math/factorial-embed" width="100%" style="border: none;"></iframe>

<!-- Load iframe-resizer once for all iframes -->
<script>
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/iframe-resizer@4/js/iframeResizer.min.js';
  script.onload = function() {
    iFrameResize({ log: false }, '#linear-viz');
    iFrameResize({ log: false }, '#quadratic-viz');
    iFrameResize({ log: false }, '#exponential-viz');
    iFrameResize({ log: false }, '#factorial-viz');
  };
  document.head.appendChild(script);
</script>
```

**Note:** The embed pages automatically include the iframe-resizer child component, so you only need to set up the parent side.

## Adding New Experiments

1. Create visualization component in `src/lib/components/visualizations/`
2. Create full page route in `src/routes/your-experiment/+page.svelte`
3. Create embed route in `src/routes/your-experiment-embed/+page.svelte`
4. Add entry to the main listing page (`src/routes/+page.svelte`)
5. Update this README with experiment details

## Architecture

- **SvelteKit** - Modern web framework with Vercel adapter (prerendered pages + serverless functions)
- **Component-based** - Reusable visualization components
- **D3.js Integration** - All visualizations use D3.js for data manipulation
- **Responsive Design** - Works on desktop and mobile devices
- **Separate Embed Routes** - Clean separation between full and embed versions
- **Hybrid Build** - Static/prerendered pages for all visualizations; `/api/swim-data` runs as a serverless function

## Technologies Used

- SvelteKit v2 with Vercel adapter
- D3.js v7.8.5 for data visualization
- Vite for development and building
- iframe-resizer v4 for responsive iframe embedding
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