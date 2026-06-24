# THE G.O.A.T. Notes
> **Premium AI Release Intel** — A secure, client-side intelligence suite that automatically compiles GitHub activity, performs semantic risk assessments, and generates audience-tailored release notes using advanced AI models.

THE G.O.A.T. Notes helps engineering teams, product managers, and stakeholders instantly translate raw git activity into high-fidelity, structured changelogs. By executing 100% client-side in the browser, your data and API credentials remain entirely private.

---

## Key Features

### 1. Automated AI Changelog Generation
- Connects to any public or private GitHub repository to scan commits and closed pull requests.
- Leverages advanced models (such as Anthropic Claude or Groq) to summarize code changes, bug fixes, and new features into clear bullet points.

### 2. Audience-Tailored Reports
- Dynamically adjusts the tone of generated notes (e.g., **Technical**, **Executive**, **Customer-Facing**, or **Balanced**) to suit different readers.
- Re-summarizes commit metadata on the fly without reloading the entire dataset.

### 3. Risk Radar & Version Pill
- Analyzes commit churn, file types, and commit messages to assess release risk.
- Displays a visual risk badge (Low, Medium, High) and suggests the appropriate semver bump (Major, Minor, Patch).

### 4. Semantic Impact Charting
- Scores individual commits based on their scope and complexity to surface the top 5 highest-impact changes in a clean, visual chart.

### 5. GOAT Timeline & Diff Comparison
- **Interactive Timeline**: Provides a chronological, filterable feed of commits and pull requests.
- **Diff Mode**: Compares activity between a baseline tag/branch and a target tag/branch to evaluate release deltas.

### 6. Client-Side Security & Custom Proxies
- API keys (GitHub PAT, Groq, or Claude) are stored safely in your browser's local storage and never transit through third-party servers.
- Supports custom API endpoints and CORS proxies to bypass browser restrictions during direct API integration.

### 7. Professional Print Package
- Features a print-optimized styling layer that formats the entire dashboard into a publication-ready PDF or physical print document on command.

---

## Technology Stack

- **Framework**: [React](https://react.dev/) (v19) & [Vite](https://vite.dev/) (v8)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4) with a modern, glassmorphic UI design system
- **Icons**: [Lucide React](https://lucide.dev/)
- **Code Quality**: [Oxlint](https://oxc.rs/) for high-speed, light-weight linting

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (or yarn / pnpm)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/The-GOAT-Notes.git
   cd The-GOAT-Notes
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173` by default.

### Building for Production

To compile a highly optimized production bundle:
```bash
npm run build
```
The output will be generated in the `dist/` directory, ready to be hosted on static platforms like GitHub Pages, Vercel, Netlify, or Cloudflare Pages.

### Code Quality (Linting)

To check the codebase for syntax or style warnings using Oxlint:
```bash
npm run lint
```

---

## Project Structure

```text
The-GOAT-Notes/
├── public/                 # Static assets
├── src/
│   ├── api/                # API communication layers
│   │   ├── github.js       # GitHub API integration (commits, PRs, releases)
│   │   └── claude.js       # Anthropic & Groq completion adapters
│   ├── assets/             # Branding assets and SVG vectors
│   ├── components/         # Reusable UI components
│   │   ├── ChangelogTabs.jsx # Audience report views and tone selectors
│   │   ├── DiffView.jsx      # Git delta comparison interface
│   │   ├── EvidenceChip.jsx  # Risk factor indicators
│   │   ├── GoatChat.jsx      # Context-aware AI chatbot assistant
│   │   ├── ImpactChart.jsx   # Interactive bar chart for commit impact
│   │   ├── PrintReport.jsx   # Print/PDF styling container
│   │   ├── RepoInput.jsx     # Repository config and date range picker
│   │   ├── RiskBadge.jsx     # Visual risk metric cards
│   │   ├── TimelineView.jsx  # Interactive activity feed
│   │   ├── ToneSlider.jsx    # Smooth selector for report tone adjustments
│   │   └── VersionPill.jsx   # Semver recommendation pill
│   ├── utils/              # Calculation helpers and shared utilities
│   │   ├── impactScore.js  # Semantic weight and complexity scoring
│   │   ├── riskRadar.js    # Risk severity and code churn algorithms
│   │   └── shareUrl.js     # URL state compression and sharing handler
│   ├── App.css             # Main stylesheet
│   ├── App.jsx             # Root application component and layout
│   ├── index.css           # Global styles and tailwind imports
│   └── main.jsx            # React mounting and initialization
├── index.html              # Entry point HTML document
├── package.json            # Scripts, dependencies, and metadata
└── vite.config.js          # Vite bundler configuration
```

---

## Configuration

To use the application, open the **API Settings** modal in the top-right corner of the interface and configure the following:

1. **API Key**: 
   - A **Groq Key** (`gsk_...`) or an **Anthropic Key** (`sk-ant-...`). This key is used on the client-side to summarize the git logs and translate them into human-readable release notes.
2. **GitHub Access Token (PAT)** (Optional):
   - A GitHub Personal Access Token (`ghp_...` or fine-grained token).
   - *Highly recommended* to prevent GitHub rate-limiting, increasing your API limit from 60 requests/hr to 5000 requests/hr.
3. **Custom API Endpoint** (Optional):
   - A CORS proxy URL if you are making direct requests to Anthropic from the browser and need to bypass browser cross-origin constraints.

---

## Security & Privacy

- **No Backend**: The application has no server component. All network requests are dispatched directly from your browser to the official GitHub and AI provider APIs.
- **Credential Safety**: Your API tokens are saved in local storage. They are never sent to, stored by, or shared with any third-party analytics or synchronization servers.

---

## License

Distributed under the MIT License. See `LICENSE` (if applicable) for more information.
