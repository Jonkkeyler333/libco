# LibCo - Sistema de Gestión de Libros

## Architecture Overview
Complete book management system with role-based access and inventory control:
- **Backend**: FastAPI + SQLModel/Alembic + PostgreSQL
- **Frontend**: React 19 + Vite (recommended: TailwindCSS + Headless UI)
- **Database**: PostgreSQL with audit logging and inventory tracking
- **Deployment**: Docker Compose with auto-reload development

## Business Domain & Use Cases
**User Roles & Capabilities:**
- **Cliente**: Autenticación, gestionar pedidos, cancelar pedidos, listar pedidos/inventario
- **Admin**: All client features + generar informes, listar logs auditoría, ajustar inventario

**Core Workflows:**
- **Order Management**: Request → Select products → Validate inventory → Confirm → Process/Cancel
- **Inventory Control**: Stock validation, reservation system, automatic updates
- **Audit Trail**: Complete change tracking for all operations with before/after states

## Database Schema & Relationships
**Core Entities:**
- `product`: Books with ISBN, SKU, pricing, publisher details
- `user`: Authentication with role-based access (`admin`/`cliente`)  
- `order` + `order_item`: Complete order lifecycle management
- `inventory`: Stock control with `quantity` and `reserved` tracking
- `audit_log`: Full change history with JSON before/after states
- `external_import`: Data import tracking and validation

## Development Workflow

### Docker Development Setup
```bash
# Start all services
docker compose -f docker-compose.dev.yml up

# Backend runs on :8000, Frontend on :5173, DB on :5433
# All services auto-reload on file changes
```

### Database Management
- Uses Alembic for migrations in `/backend/migrations/`
- Database URL: `postgresql://postgres:postgres@db:5432/appdb` (inside containers)
- Local access: `postgresql://postgres:postgres@localhost:5433/appdb`
- Run migrations: `alembic upgrade head` (from backend directory)

### Project Structure Conventions
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

## Key Implementation Patterns

### Configuration Management
- Uses `pydantic-settings` in `core/config.py`
- Environment variables loaded from `.env` file
- CORS configured for development ports (3000, 5173, 8000)
- JWT authentication with OAuth2 setup (not yet implemented)

### Database Models
- **SQLModel pattern**: Combined Pydantic + SQLAlchemy models
- **Relationship management**: Uses `TYPE_CHECKING` imports to avoid circular dependencies
- **Link tables**: Explicit link models like `CategoryProductLink` for many-to-many
- **Audit trail**: `AuditLog` model tracks all changes with before/after states
- **Datetime handling**: All timestamps use `datetime.now(timezone.utc)`

### Code Organization
- **Backend scaffolding**: `api/`, `repositories/`, `services/`, `schemas/` directories exist but are currently empty (`__init__.py` only)
- **Frontend structure**: Professional component organization with separation of concerns
- **Naming conventions**: Spanish for user-facing content, English for code
- **Component patterns**: 
  - `components/ui/`: Reusable base components (Button, Input, Modal)
  - `components/layout/`: App structure (Navbar, Sidebar, Dashboard)
  - `components/forms/`: Domain-specific forms (LoginForm, OrderForm)
- **Service layer**: API calls organized by domain (`authService`, `productService`, `orderService`)
- **State management**: React Context providers in `/context/` + local useState/useReducer
- **Type safety**: Type definitions in `/types/` (consider TypeScript migration)

## Business Logic Implementation

### Order Management Flow (from Activity Diagram)
1. **Authentication**: Login/session validation required for all operations
2. **Product Selection**: Browse inventory → validate availability → add to cart
3. **Order Processing**: 
   - Validate inventory (quantity vs reserved stock)
   - Create pending order → reserve inventory
   - Confirm/cancel flow with automatic stock updates
4. **Inventory Updates**: Automatic `reserved` field management during order lifecycle

### Role-Based Access Patterns
- **Cliente role**: Order CRUD, inventory viewing, order cancellation
- **Admin role**: All cliente features + reports, audit logs, inventory adjustments
- Implement route guards and API endpoint protection based on user role

## Critical Development Notes

### Database Schema Highlights
- Products use both `product_id` (PK) and `sku` (unique) for identification
- Users have unusual `ID` field separate from `user_id` primary key
- Inventory tracks both `quantity` and `reserved` stock
- All models include `created_at`/`updated_at` timestamp tracking

### Frontend Architecture & Styling
**Recommended Tech Stack:**
- **Styling**: TailwindCSS for utility-first styling + Headless UI for components
- **State Management**: React native state (useState, useReducer, useContext)
- **Routing**: React Router v6 with role-based route protection
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI or Headless UI for accessible components

**Professional Design Recommendations:**
- **Dashboard Layout**: Sidebar navigation with role-based menu items
- **Color Scheme**: Clean, book-friendly palette (navy/teal primary, warm grays)
- **Components**: Data tables for orders/inventory, modal forms, toast notifications
- **Responsive**: Mobile-first design with proper tablet/desktop breakpoints

**Current Setup:**
- API endpoint: `VITE_API_URL=http://localhost:8000`
- CORS enabled for port 5173, auto-reload configured

### Known Patterns to Follow
- Use Spanish for user-facing content, English for code
- Follow SQLModel relationship patterns with proper TYPE_CHECKING
- Maintain audit logging for all data changes
- Use UTC timezone for all datetime operations
- Separate business logic into services layer (when implementing)

This is an early-stage project with solid architectural foundation but minimal business logic implementation.