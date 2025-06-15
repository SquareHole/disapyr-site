# Codebase Summary

## Project Structure
```
site/
├── app/
│   ├── favicon.ico
│   ├── globals.css          # Global styles with dark/light mode
│   ├── layout.tsx           # Root layout component
│   ├── page.module.css      # Page-specific styles
│   └── page.tsx             # Main landing page
├── netlify/
│   └── functions/
│       └── getSecret.js     # Netlify function for secret retrieval
├── public/                  # Static assets
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts (includes @netlify/neon)
└── tsconfig.json            # TypeScript configuration
```

## Key Components and Their Interactions

### Current State
- **page.tsx**: Modern landing page implemented
- **layout.tsx**: Root layout wrapper for all pages
- **globals.css**: Enhanced styling with CSS custom properties for theming
- **getSecret.js**: Netlify function for database secret retrieval

### Backend Implementation
- **Database**: Neon Postgres with secrets table
- **API Function**: GET endpoint for secret retrieval by key
- **Features**: One-time access, expiration checking, timestamp tracking

## Data Flow
- Frontend: User input → form submission → API call
- Backend: API request → database query → secret retrieval → timestamp update
- Response: Secret data or error message returned to frontend

## External Dependencies
- Next.js framework
- React
- TypeScript
- @netlify/neon (database connection)
- @netlify/functions (serverless functions)
- Neon Postgres database (cloud-hosted)

## Recent Significant Changes
- Implemented Netlify function for secret retrieval
- Added database connectivity with Neon Postgres
- Updated project configuration for functions
- Created comprehensive setup documentation
- Updated all project documentation

## User Feedback Integration
- User requested backend integration with Postgres database
- Implemented one-time secret retrieval functionality
- Added expiration handling and timestamp tracking
- Focus on secure, reliable database operations

## Next Development Phase
- Set up environment variables for database connection
- Test function locally and in production
- Integrate frontend form with backend API
- Add secret creation functionality
- Implement error handling and user feedback
