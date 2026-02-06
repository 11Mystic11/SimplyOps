# SimplyOps - CRM & Operations Platform

A modern CRM and operations platform built for Simply Automations, inspired by Jobber-style workflow management.

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed with sample data
   npm run db:seed
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Sign in with: `admin@simplyops.com` / `admin123`

## Technology Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui components  
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Credentials Provider)
- **Validation**: Zod
- **Charts**: Recharts

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── clients/        # Client management
│   │   ├── projects/       # Project tracking
│   │   ├── tasks/          # Task management
│   │   └── finance/        # Financial dashboard
│   ├── auth/               # Authentication pages
│   └── api/               # API routes
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── layouts/             # Layout components
│   ├── forms/              # Form components
│   └── features/           # Feature-specific components
├── lib/                   # Utility functions
├── types/                  # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Features (Phase 1)

### ✅ Core Foundation
- [x] Next.js 14 with App Router
- [x] TypeScript configuration
- [x] Tailwind CSS + shadcn/ui setup
- [x] Database schema (Prisma)
- [x] Authentication framework
- [x] Dashboard layout and navigation
- [x] Basic page scaffolding

### 🚧 Core CRUD (In Progress)
- [ ] Client management
- [ ] Project tracking
- [ ] Task management
- [ ] Note/activity logging

### 📋 Dashboard Features
- [x] Responsive layout
- [x] Navigation system
- [x] Basic dashboard widgets
- [ ] Real-time data integration
- [ ] Charts and analytics

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:seed      # Seed database with sample data

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Type checking
```

## Roadmap

### Phase 1: Core CRUD + Dashboard ✅
- [x] Project setup and foundation
- [ ] Complete CRUD operations
- [ ] Basic dashboard functionality

### Phase 2: Dashboard Polish
- [ ] Enhanced widgets and KPIs
- [ ] Today/Overdue sections
- [ ] Quick actions
- [ ] Activity timeline

### Phase 3: Finance Module
- [ ] Subscriptions and retainers
- [ ] Invoice management
- [ ] Payment tracking
- [ ] Cost tracking
- [ ] Profitability reports

### Phase 4: Churn + Health
- [ ] Health scoring system
- [ ] Churn event tracking
- [ ] At-risk client identification

### Phase 5: Internal Chatbot
- [ ] In-app assistant UI
- [ ] Natural language commands
- [ ] Database query/update tools
- [ ] Audit logging

### Phase 6: Client Portal (Optional)
- [ ] Client login system
- [ ] Project status views
- [ ] Invoice access

## License

MIT License - see LICENSE file for details