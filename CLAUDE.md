# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `npm start` - Start development server (React app runs on http://localhost:3000)
- `npm run build` - Create production build
- `npm test` - Run tests with Jest and React Testing Library
- `npm run eject` - Eject from Create React App (irreversible)

## Project Architecture

This is a React TypeScript application showcasing the number "37" with modern animations and interactive effects. The project is built on Create React App with additional animation libraries.

### Key Dependencies & Styling Approach
- **Styled Components**: All styling uses styled-components with CSS-in-JS
- **Framer Motion**: Primary animation library for React components, gestures, and scroll-based animations
- **GSAP**: Used for complex timeline animations (currently animating the main "37" number)
- **TypeScript**: Strict mode enabled with standard React TypeScript configuration

### Component Architecture
- Single-page application with main content in `src/App.tsx`
- Uses React hooks pattern (useEffect, useRef for GSAP integration)
- Framer Motion's `useScroll` and `useTransform` for parallax effects
- Styled components are co-located with the main App component

### Animation Patterns
- Framer Motion handles component animations, hover effects, and scroll-based transforms
- GSAP timeline for repeating scale animations on the main number
- Floating shapes use Framer Motion's animate prop with randomized positions
- Scroll-based opacity and position transforms using Framer Motion's scroll utilities

### Styling Conventions
- Dark theme with gradient backgrounds
- Gradient text effects using webkit background-clip
- Glass-morphism effects with backdrop-filter blur
- Responsive design using vw units for the main number display