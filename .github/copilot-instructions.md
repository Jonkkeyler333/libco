# LibCo - Sistema de Gestión de Libros

## Architecture Overview
Complete book management system with role-based access and inventory control:
- **Backend**: FastAPI + SQLModel/Alembic + PostgreSQL
- **Frontend**: React 19 + Vite (recommended: TailwindCSS + Headless UI)
- **Database**: PostgreSQL with audit logging and inventory tracking

## Project Structure Conventions
```
backend/
  ├── models/          # SQLModel entities (User, Product, Order, etc.)
  ├── api/            # FastAPI route handlers (currently empty)
  ├── repositories/   # Data access layer (currently empty)  
  ├── services/       # Business logic (currently empty)
  ├── schemas/        # Pydantic request/response models (currently empty)
  ├── core/config.py  # Settings with pydantic-settings
  └── main.py         # FastAPI app entry point

frontend/src/
  ├── components/     # Reusable UI components
  │   ├── ui/         # Base UI elements (buttons, inputs, modals)
  │   ├── layout/     # Layout components (navbar, sidebar, footer)  
  │   └── forms/      # Form components (login, order, product)
  ├── pages/          # Page-level components and routing
  ├── services/       # API calls and data fetching
  ├── hooks/          # Custom React hooks
  ├── context/        # React Context providers
  ├── context/        # React Context providers for global state
  ├── utils/          # Helper functions and utilities
  └── types/          # Type definitions and constants
```
