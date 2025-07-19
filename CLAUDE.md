# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start Vite development server with HMR at http://localhost:5173/life-v-log/
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview production build locally
- `npm run deploy` - Build and deploy to GitHub Pages using gh-pages

### Linting and Code Quality
- `npm run lint` - Check code quality and fix automatically fixable issues

## Architecture Overview

### Core Purpose
This is a personal timeline application designed to record and display life memories in a chronological format. The app displays timeline entries with alternating left/right layout, images, tags, and different entry types.

### Data Structure
All timeline data is centralized in `src/data/timelineData.js`. Each timeline entry follows this schema:
```javascript
{
  id: number,           // Unique identifier
  date: "YYYY-MM-DD",   // ISO date string
  title: string,        // Entry title with emoji support
  description: string,  // Detailed description
  images: string[],     // Array of image paths (with /life-v-log/ prefix)
  tags: string[],       // Array of category tags
  type: string          // "milestone" | "special" | "travel" | "daily"
}
```

### Component Hierarchy
- **App.jsx**: Root component that renders the Timeline
- **Timeline.jsx**: Main container that fetches data, sorts by date (newest first), and renders TimelineItems
- **TimelineItem.jsx**: Individual timeline entry with alternating left/right positioning, date formatting, type icons, and image handling

### Key Technical Patterns

#### Vite Configuration
- Base path set to `/life-v-log/` for GitHub Pages deployment
- All image references must include this prefix in production

#### Timeline Item Positioning
- Uses index-based alternating layout (even indices = left, odd = right)
- Mobile view collapses to single-column layout with left-aligned markers

#### Type System and Icons
Timeline entries use four types with corresponding emoji icons:
- `milestone`: 🏆 (major life events)
- `special`: 💕 (romantic/special occasions)
- `travel`: ✈️ (trips and travel experiences)  
- `daily`: 📝 (everyday moments)

#### Image Handling
- Images stored in `public/images/` directory
- Paths must include `/life-v-log/` prefix for deployment
- Automatic hiding on load error with `onError` handler
- Grid layout for multiple images with responsive sizing

#### Responsive Design
- Desktop: Alternating left/right timeline layout with central vertical line
- Mobile: Single column with left-aligned markers and cards
- Breakpoint at 768px using CSS media queries

### Styling Architecture
- Component-level CSS files co-located with JSX files
- Global styles in `App.css` for resets and typography
- Color scheme: Pink gradient theme (#ff6b9d to #c44569)
- Chinese font stack with system font fallbacks

### Deployment
- GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys on push to main branch
- Uses `peaceiris/actions-gh-pages@v3` action
- Builds to `dist/` directory and publishes to GitHub Pages

## Development Considerations

### Adding New Timeline Entries
1. Add new entry object to `timelineData` array in `src/data/timelineData.js`
2. Include proper date formatting (YYYY-MM-DD)
3. Use correct image paths with `/life-v-log/` prefix
4. Choose appropriate type for proper icon display

### Image Management
- Place images in `public/images/` directory
- Reference with full path: `/life-v-log/images/filename.ext`
- Supported formats: JPG, PNG, SVG
- Consider responsive sizing for mobile devices

### Localization
- Date formatting uses Chinese locale (`zh-CN`)
- UI text is in Chinese
- Emoji support throughout for visual appeal