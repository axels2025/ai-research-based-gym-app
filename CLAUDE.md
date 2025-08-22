# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered fitness coaching application built with React, TypeScript, and modern web technologies. The app provides research-based workout programs with AI-driven progression tracking and personalized coaching recommendations.

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives via shadcn/ui
- **Icons**: Lucide React

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development (with dev mode optimizations)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Project Structure

### Core Application
- `src/App.tsx` - Main app component with routing setup
- `src/main.tsx` - Application entry point
- `src/pages/` - Page components (Index, Workout, NotFound)

### Components Architecture
- `src/components/ui/` - Reusable UI components from shadcn/ui
- `src/components/` - Application-specific components (WorkoutCard, ExerciseInput, etc.)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and configurations

### Key Features
- **Workout Management**: Cards for workout tracking with exercise counts and estimated times
- **AI Coaching**: Personalized insights and progression recommendations
- **Program Overview**: Progress tracking across weeks and workouts
- **Exercise Timer**: Timing functionality for workout sessions

## Configuration Details

### Path Aliases
- `@/*` maps to `./src/*` (configured in both Vite and TypeScript)

### Styling System
- Uses CSS custom properties for theming
- Supports dark mode via class-based toggling
- Extended Tailwind config with custom color palette including sidebar variants

### Development Server
- Runs on port 8080
- Configured to accept connections from any host (::)

## Important Notes

- The project uses Lovable's component tagger in development mode
- TypeScript configuration is relaxed with several strict checks disabled
- All UI components follow the shadcn/ui pattern with Radix UI primitives
- The application uses React Router for client-side routing with a catch-all route for 404 handling

## Firebase Authentication & Data

### Authentication System
- **Auth Context**: `src/contexts/AuthContext.tsx` provides login/logout/register functionality
- **Protected Routes**: Use `RequireAuth` component to wrap authenticated pages
- **Auth Pages**: Login (`/login`), Register (`/register`), Profile (`/profile`), Forgot Password (`/forgot-password`)
- **Navigation**: Authenticated users see a user menu in the navigation header

### Firebase Configuration
- Configuration file: `src/lib/firebase.ts`
- Environment variables: Copy `.env.example` to `.env` and add your Firebase credentials
- Firestore functions: `src/lib/firestore.ts` handles all database operations

### Data Structure
- **Users**: Managed by Firebase Auth
- **Programs**: Workout programs (6-week cycles, progress tracking)
- **Workouts**: Individual workout sessions within programs
- **WorkoutSessions**: Completed workout data with exercises and timing

### Key Features
- Email/password authentication with verification
- Password reset functionality
- Account management (change email/password)
- User-specific workout data storage
- Automatic default program initialization for new users
- Comprehensive user onboarding system with fitness profiling

## User Onboarding System

### Onboarding Flow
- **7-step guided setup**: Personal info → Goals → Experience → Schedule → Health → Preferences → Review
- **Route Protection**: `/onboarding` requires auth, main app requires completed onboarding
- **Progressive Saving**: Each step saves to Firestore, users can resume later
- **Smart Validation**: Step-by-step validation with helpful error messages

### Onboarding Components
- `OnboardingLayout`: Consistent progress bar, navigation, and step management
- `MultiSelectGoals`: Visual goal selection with icons and descriptions
- `EquipmentSelector`: Interactive equipment access selection
- `TimePreferenceSelector`: Schedule availability with day/time selection
- Smart form components with visual feedback and validation

### Profile Data Collection
- **Personal Info**: Age, sex, height, weight, activity level, BMI calculation
- **Goals**: Primary/secondary goals, timeline, body composition targets
- **Experience**: Training level, equipment access, workout location, previous programs
- **Availability**: Sessions/week, duration, preferred times, available days
- **Health**: Injury history, limitations, medical conditions, pain areas
- **Preferences**: Workout split, rep ranges, intensity, favorite/disliked exercises

### AI Integration Ready
- `generateAIPromptData()`: Formats complete user profile for Claude AI workout generation
- Structured data export for personalized program creation
- Goal mapping and constraint documentation for AI context

## Adding New Features

When adding new components or pages:
1. Follow the existing shadcn/ui component patterns
2. Use the established TypeScript path aliases (`@/`)
3. Maintain the existing styling approach with Tailwind and CSS custom properties
4. Add new routes in `App.tsx` above the catch-all route
5. For authenticated pages, wrap with `RequireAuth` component
6. Use the Firestore helper functions in `src/lib/firestore.ts` for data operations