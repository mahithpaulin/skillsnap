# Overview

SkillSnap is a full-stack learning platform designed for college students to develop skills through personalized lessons and progress tracking. The application combines Express.js backend with React frontend to deliver an interactive educational experience with AI-powered recommendations and comprehensive progress analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern component-based UI using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **Wouter Routing**: Lightweight client-side routing solution
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **Radix UI + Tailwind CSS**: Accessible component library with utility-first styling using shadcn/ui design system
- **Form Management**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Express.js Server**: RESTful API with middleware for logging, error handling, and request parsing
- **TypeScript**: Full type safety across server-side code
- **Modular Route Structure**: Separate route handlers for users, skills, lessons, and progress tracking
- **Service Layer**: Dedicated services for AI integration and business logic separation
- **Storage Abstraction**: Interface-based storage layer for flexible database operations

## Data Storage & Schema
- **PostgreSQL Database**: Primary data store using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **Normalized Schema**: Separate tables for users, skill categories, skills, lessons, user progress, and daily tracking
- **UUID Primary Keys**: Using PostgreSQL's gen_random_uuid() for unique identifiers
- **Relationship Management**: Foreign key constraints linking users to their learning progress

## Authentication & Session Management
- **Session-based Authentication**: Cookie-based sessions using connect-pg-simple for PostgreSQL session storage
- **User Context**: Centralized user state management across the application
- **Demo User System**: Currently implemented with hardcoded demo user for development

## AI Integration & Personalization
- **OpenAI API Integration**: AI-powered learning recommendations and progress analysis
- **OpenRouter Gateway**: Multiple AI model access through unified API
- **Personalized Recommendations**: Algorithm considers user progress, learning patterns, and preferences
- **Learning Analytics**: AI-driven insights into strengths, weaknesses, and suggested learning paths

# External Dependencies

## Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **express**: Web framework for REST API development
- **react**: UI library with TypeScript support
- **@tanstack/react-query**: Server state management and caching

## UI & Styling
- **@radix-ui/***: Accessible headless UI components (accordion, dialog, dropdown, form controls, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **lucide-react**: Icon library for consistent iconography

## Development & Build Tools
- **vite**: Frontend build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js development
- **esbuild**: Fast JavaScript bundler for production builds

## AI & External Services
- **openai**: OpenAI API client for AI-powered features
- **OpenRouter API**: Gateway for accessing multiple AI models

## Session & State Management
- **connect-pg-simple**: PostgreSQL session store for Express
- **react-hook-form**: Form state management with validation
- **@hookform/resolvers**: Validation resolvers for form integration

## Development Experience
- **@replit/vite-plugin-***: Replit-specific development plugins for enhanced debugging and development experience