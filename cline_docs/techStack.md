# Technology Stack

## Frontend Framework
- **Next.js 15+**: React-based framework for production-ready applications
- **React 18+**: Component-based UI library
- **TypeScript**: Type-safe JavaScript development

## Styling
- **CSS Modules**: Scoped CSS styling
- **CSS Custom Properties**: For theming and design tokens
- **Responsive Design**: Mobile-first approach

## Development Tools
- **ESLint**: Code linting and quality
- **TypeScript Config**: Strict type checking
- **Next.js Config**: Framework configuration

## Deployment
- **Netlify**: Static site hosting (current setup)
- **Vercel**: Alternative deployment option for Next.js

## Backend Implementation
- **Database**: Neon Postgres (cloud-hosted PostgreSQL)
- **API**: Netlify Functions (serverless functions)
- **Database Connection**: @netlify/neon package
- **Storage**: Postgres table for temporary secret storage and link management

## Netlify Functions
- **getSecret**: Retrieves secrets by key with one-time access
- **Features**: Expiration checking, timestamp tracking, secure retrieval
- **Environment**: NETLIFY_DATABASE_URL for database connection

## Design Principles
- Modern, clean aesthetic
- Mobile-first responsive design
- Accessibility compliance
- Performance optimization
- Dark/light mode support
