# Legal Case Management System

## Overview

This is a comprehensive Legal Case Management System built as a full-stack web application. The system facilitates connections between clients and lawyers, enables case management, document handling, and communication. It serves three primary user types: clients who need legal assistance, lawyers who provide legal services, and police officials who can manage case approvals.

The application provides features for case creation and tracking, lawyer discovery and selection, document management, calendar scheduling for hearings, messaging between parties, and notification systems for case updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)

✓ Successfully completed migration from Replit Agent to Replit environment (August 6, 2025)
✓ Successfully completed second migration setup with proper environment variables (August 8, 2025)
✓ Successfully completed migration to Replit environment with full functionality (August 8, 2025)
✓ Added police station details display in case information (August 8, 2025)
✓ Fixed accused name display in case requests - now highlighted in red for lawyers (August 8, 2025)
✓ Created comprehensive police station database covering 60+ stations across all Indian states (August 8, 2025)
✓ Added login credentials for all police stations with standardized email format (August 8, 2025)
✓ Fixed environment variable loading with dotenv package
✓ Confirmed MongoDB Atlas connection and authentication system working
✓ All test users seeded and login system functioning properly
✓ Fixed signup database persistence issue - users now properly save to MongoDB (August 8, 2025)
✓ Implemented dynamic storage manager to automatically use MongoDB when connected (August 8, 2025)
✓ Fixed case request acceptance issue - lawyers can now properly create cases from requests (August 8, 2025)
✓ Added secure environment variables for MongoDB Atlas and Cloudinary integration
✓ Resolved TypeScript execution issues with tsx package installation
✓ Removed PostgreSQL/Drizzle dependencies - using MongoDB exclusively (August 8, 2025)
✓ Fixed authentication system - login and registration now working properly
✓ Implemented memory storage fallback for development when MongoDB is unavailable
✓ Successfully connected to MongoDB Atlas database (August 8, 2025)
✓ Resolved IP whitelisting issues for MongoDB Atlas access
✓ Confirmed full functionality of user registration and login systems
✓ Database seeding working properly with test users for development
✓ Configured MongoDB Atlas database connection with proper environment variables
✓ Set up JWT authentication with secure secret management
✓ Implemented role-based navigation system:
  - Clients: Dashboard, Cases, Calendar, Find Lawyers, Documents, Messages
  - Lawyers: Dashboard, Cases, Calendar, Documents, Messages (removed Find Lawyers)
  - Police Officers: Dashboard, Cases, Calendar only
✓ Enhanced messaging system to enable chat between clients and lawyers
✓ Made notifications fully functional with real-time unread counts
✓ Added comprehensive role-based signup system supporting all three user types
✓ Fixed MongoDB connection and storage layer type compatibility issues
✓ Fixed React SelectItem empty value errors that prevented UI loading
✓ Enhanced lawyer selection system with proper filtering and search functionality
✓ Fixed TypeScript type issues across the entire application
✓ Implemented complete client-to-lawyer workflow with case request system
✓ Successfully completed final migration to Replit environment (August 8, 2025)
✓ Fixed tsx package execution issue and resolved workflow startup problems
✓ Added user account for successful login authentication (August 8, 2025)
✓ All dependencies properly installed and MongoDB Atlas connection verified
✓ Fixed case delete functionality with proper permission checks (August 8, 2025)
✓ Restricted delete case button to lawyers only (August 8, 2025)
✓ Added document download functionality across all case detail views
✓ Enhanced accused name display with red highlighting in all components
✓ Fixed police station API endpoint and resolved [object Object] errors
✓ Added comprehensive document management with download buttons
✓ Improved police station status messaging for better user understanding
✓ Fixed police case approval system - cases now created with 'under_review' status (August 8, 2025)
✓ Police officers can now properly approve/reject cases instead of seeing "submitted" status
✓ Fixed accused name display in case requests - names now show correctly instead of "Name not specified"
✓ Completed data flow fix from case request form submission to case details display
✓ Successfully completed migration from Replit Agent to Replit environment (August 8, 2025)
✓ Verified all dependencies and packages properly installed in Replit environment
✓ Confirmed server startup and fallback to in-memory storage working correctly
✓ Validated frontend and backend integration with Vite development server
✓ Project fully functional and ready for development in Replit environment

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **Vite** as the build tool and development server for fast compilation and hot reloading
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query (React Query)** for server state management, caching, and API synchronization
- **Tailwind CSS** with shadcn/ui component library for consistent, responsive UI design
- **Chart.js** for data visualization of case statistics and win/loss ratios

The frontend follows a component-based architecture with clear separation between pages, reusable UI components, and business logic. Custom hooks manage authentication state and mobile responsiveness.

### Backend Architecture
- **Express.js** with TypeScript for the RESTful API server
- **MongoDB with Mongoose ODM** for flexible document-based data storage
- **JWT (JSON Web Tokens)** for stateless authentication and session management
- **Multer** middleware for handling file uploads with configurable storage and validation
- **Bcrypt** for secure password hashing and authentication
- **Session-based architecture** with proper middleware for authentication and authorization

The server implements a layered architecture with clear separation between routes, business logic, and data access layers. Role-based access control ensures proper permissions for different user types.

### Data Storage Solutions
- **MongoDB** as the primary database for storing users, cases, messages, and notifications
- **Mongoose schemas** define data models with validation and relationships
- **File system storage** for uploaded documents with organized directory structure
- **Database seeding** functionality for development and testing environments

### Authentication and Authorization
- **JWT-based authentication** with token storage in localStorage
- **Role-based access control** supporting client, lawyer, and police user types
- **Protected routes** with authentication middleware on both client and server
- **Password hashing** using bcrypt with proper salt rounds for security

### API Design
- **RESTful API** following standard HTTP methods and status codes
- **Structured endpoints** for authentication, users, lawyers, cases, messages, and notifications
- **File upload endpoints** with validation for document types and size limits
- **Query parameter support** for filtering and searching data

## External Dependencies

### Database and Infrastructure
- **MongoDB** - Primary database for document storage with flexible schema design
- **Neon Database** - PostgreSQL serverless database (configured but not actively used in current implementation)
- **Drizzle ORM** - Database toolkit configured for potential PostgreSQL migration

### UI and Styling
- **Radix UI** - Headless component library providing accessible primitives for complex UI components
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - Pre-built component system built on Radix UI and Tailwind CSS

### Development and Build Tools
- **Vite** - Frontend build tool and development server
- **TypeScript** - Type safety across the entire application stack
- **ESBuild** - Fast JavaScript bundler for production builds

### Communication and Notifications
- **Nodemailer** - Email service for sending case notifications and updates
- **SMTP configuration** - Email server integration for automated notifications

### File Management
- **Multer** - Middleware for handling multipart/form-data and file uploads
- **File system APIs** - Document storage and retrieval with organized directory structure

### Additional Libraries
- **Date-fns** - Modern JavaScript date utility library for date manipulation and formatting
- **Zod** - Schema validation library for runtime type checking and data validation
- **Class Variance Authority (CVA)** - Utility for creating variant-based component APIs
- **CLSX** - Utility for constructing className strings conditionally