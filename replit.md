# Legal Case Management System

## Overview

This is a comprehensive Legal Case Management System built as a full-stack web application. The system facilitates connections between clients and lawyers, enables case management, document handling, and communication. It serves three primary user types: clients who need legal assistance, lawyers who provide legal services, and police officials who can manage case approvals.

The application provides features for case creation and tracking, lawyer discovery and selection, document management, calendar scheduling for hearings, messaging between parties, and notification systems for case updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **Vite** as the build tool and development server for fast compilation and hot reloading
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management, caching, and API synchronization
- **Tailwind CSS** with shadcn/ui component library for consistent, responsive UI design
- **Chart.js** for data visualization of case statistics
- **UI/UX Decisions**: Modernized interface with dark gradient themes, animated navigation, professional user profile sections, gradient headers, live status indicators, improved stats cards with hover effects, "wired" secure communication appearance for messaging, professional case management hub design, colorful gradient headers for calendar, secure vault appearance for documents, legal expert network theme for lawyer search, consistent modern design language with gradients, shadows, and animations. Enhanced user experience with live status indicators, hover effects, professional color schemes, password visibility toggles, and improved form layouts.

### Backend Architecture
- **Express.js** with TypeScript for the RESTful API server
- **MongoDB with Mongoose ODM** for flexible document-based data storage
- **JWT (JSON Web Tokens)** for stateless authentication and session management
- **Multer** middleware for handling file uploads
- **Bcrypt** for secure password hashing
- **Session-based architecture** with middleware for authentication and authorization.
- The server implements a layered architecture with clear separation between routes, business logic, and data access layers. Role-based access control ensures proper permissions for different user types.

### Data Storage Solutions
- **MongoDB** as the primary database for storing users, cases, messages, and notifications
- **Mongoose schemas** define data models with validation and relationships
- **File system storage** for uploaded documents with organized directory structure
- **Database seeding** functionality for development and testing environments

### Authentication and Authorization
- **JWT-based authentication** with token storage
- **Role-based access control** supporting client, lawyer, and police user types
- **Protected routes** with authentication middleware on both client and server
- **Password hashing** using bcrypt

### API Design
- **RESTful API** following standard HTTP methods and status codes
- **Structured endpoints** for authentication, users, lawyers, cases, messages, and notifications
- **File upload endpoints** with validation for document types and size limits
- **Query parameter support** for filtering and searching data

## External Dependencies

### Database
- **MongoDB** - Primary database for document storage.

### UI and Styling
- **Radix UI** - Headless component library for accessible UI primitives.
- **Tailwind CSS** - Utility-first CSS framework.
- **shadcn/ui** - Pre-built component system built on Radix UI and Tailwind CSS.

### Communication and Notifications
- **Nodemailer** - Email service for sending case notifications and updates.
- **SMTP configuration** - Email server integration for automated notifications.

### File Management
- **Multer** - Middleware for handling multipart/form-data and file uploads.

### Additional Libraries
- **Date-fns** - JavaScript date utility library.
- **Zod** - Schema validation library for runtime type checking.
- **Class Variance Authority (CVA)** - Utility for creating variant-based component APIs.
- **CLSX** - Utility for constructing className strings conditionally.