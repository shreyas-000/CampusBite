# CampusBite — End to End Build Plan

Everything you need to build CampusBite from zero to demo-ready. Follow phases in order — each one depends on the previous.

---

## Phase 0 — Prerequisites

Accounts you need. All free tiers are fine.

- GitHub account
- Vercel account — vercel.com, sign up with GitHub
- Supabase account — supabase.com, sign up with GitHub
- Razorpay account — razorpay.com, sign up and complete KYC (use test mode for dev)

Local machine:
- Node.js 20+ installed
- Python 3.11+ installed
- Git configured
- `pip` and `venv` available

---

## Phase 1 — Project Setup

### 1.1 Initialise the monorepo

```bash
git init
```

### 1.2 Folder structure

```bash
mkdir -p frontend/src/{components,pages,hooks,store,lib,types}
mkdir -p frontend/src/components/{ui,student,staff,admin,shared}
mkdir -p frontend/src/pages/{auth,student,staff,admin}
mkdir -p backend/{api,core,models,schemas,routers,services,db}
mkdir -p backend/alembic/versions
```

Full tree after setup:

```
campusbite/
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── student/
│   │   │   ├── staff/
│   │   │   ├── admin/
│   │   │   └── shared/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── staff/
│   │   │   └── admin/
│   │   ├── hooks/
│   │   ├── store/              # Zustand stores
│   │   ├── lib/                # API client, utils
│   │   └── types/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── backend/                    # FastAPI
│   ├── api/
│   │   └── index.py            # Vercel serverless entry
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py         # JWT logic
│   │   └── dependencies.py     # FastAPI deps (get_db, get_current_user)
│   ├── models/                 # SQLAlchemy ORM models
│   ├── schemas/                # Pydantic v2 schemas
│   ├── routers/                # One file per resource
│   ├── services/               # Business logic (payments, notifications)
│   ├── db/
│   │   └── session.py          # DB engine + session
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   └── requirements.txt
├── vercel.json
├── .env.example
└── .gitignore
```

### 1.3 Create .env files

```bash
touch .env .env.example
```

Paste into `.env` and fill values as you complete each phase:

```env
# Supabase
DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=

# JWT
SECRET_KEY=your-256-bit-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# App
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

Copy the same into `.env.example` with values empty. Commit `.env.example`, never commit `.env`.

Add to `.gitignore`:

```
.env
.env*.local
__pycache__/
*.pyc
.venv/
node_modules/
dist/
.vercel/
```

### 1.4 vercel.json

This routes all `/api/*` requests to the FastAPI serverless function and serves the React build for everything else.

```json
{
  "builds": [
    {
      "src": "backend/api/index.py",
      "use": "@vercel/python"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

### 1.5 Frontend bootstrap

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom @tanstack/react-query zustand axios
npm install @supabase/supabase-js
npm install lucide-react clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
```

When shadcn prompts:
- Style → Default
- Base color → Neutral
- CSS variables → Yes

### 1.6 Backend bootstrap

```bash
cd ../backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg alembic
pip install pydantic-settings python-jose[cryptography] passlib[bcrypt]
pip install razorpay supabase httpx python-multipart
pip freeze > requirements.txt
```

### 1.7 Create frontend/src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`
}

export function formatOrderStatus(status: string): string {
  const map: Record<string, string> = {
    placed: 'Order Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    picked_up: 'Picked Up',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}
```

### 1.8 Create frontend/src/types/index.ts

```typescript
export type Role = 'student' | 'staff' | 'admin'

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  student_id?: string
  department?: string
  is_active: boolean
}

export type Category = {
  id: string
  name: string
  description?: string
  sort_order: number
}

export type MenuItem = {
  id: string
  category_id: string
  category?: Category
  name: string
  description?: string
  price: number          // in paise (₹ × 100)
  image_url?: string
  is_available: boolean
  available_from?: string  // "08:00"
  available_until?: string // "22:00"
  rating_avg?: number
  rating_count?: number
}

export type CartItem = {
  id: string
  menu_item_id: string
  menu_item?: MenuItem
  quantity: number
  special_instructions?: string
}

export type Cart = {
  id: string
  items: CartItem[]
  total: number
}

export type OrderItem = {
  id: string
  menu_item_id: string
  menu_item?: MenuItem
  quantity: number
  unit_price: number
  special_instructions?: string
}

export type Order = {
  id: string
  user_id: string
  user?: User
  pickup_token: string
  status: OrderStatus
  total: number
  scheduled_pickup_at?: string
  items: OrderItem[]
  created_at: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
}

export type Notification = {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}
```

### 1.9 Create backend/core/config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    supabase_url: str
    supabase_service_key: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    razorpay_key_id: str
    razorpay_key_secret: str
    frontend_url: str = "http://localhost:5173"
    allowed_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Phase 2 — Supabase Setup

### 2.1 Create the project

- Go to supabase.com → New Project
- Name it `campusbite`
- Choose a region close to you
- Save the database password — you will need it for `DATABASE_URL`

Once created, go to Settings → API and copy:
- Project URL → `SUPABASE_URL`
- service_role key → `SUPABASE_SERVICE_KEY`

Go to Settings → Database → Connection string → URI (mode: Session), copy it and replace `[YOUR-PASSWORD]` with your DB password → `DATABASE_URL`. Change the scheme from `postgresql` to `postgresql+asyncpg`.

### 2.2 Run the schema migration

Go to Supabase → SQL Editor and run this in one go:

```sql
-- Extensions
create extension if not exists "pgcrypto";

-- Users
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  hashed_password text not null,
  name          text not null,
  student_id    text unique,
  department    text,
  role          text not null default 'student'
                  check (role in ('student', 'staff', 'admin')),
  is_active     bool not null default true,
  created_at    timestamptz not null default now()
);

-- Categories
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  sort_order  int not null default 0
);

-- Menu items
create table menu_items (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references categories(id) on delete set null,
  name             text not null,
  description      text,
  price            int not null,   -- in paise (₹ × 100)
  image_url        text,
  is_available     bool not null default true,
  available_from   time,           -- e.g. '08:00'
  available_until  time,           -- e.g. '22:00'
  created_at       timestamptz not null default now()
);

-- Favourites
create table favourites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(user_id, menu_item_id)
);

-- Carts (one per user)
create table carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

-- Cart items
create table cart_items (
  id                   uuid primary key default gen_random_uuid(),
  cart_id              uuid references carts(id) on delete cascade,
  menu_item_id         uuid references menu_items(id) on delete cascade,
  quantity             int not null default 1 check (quantity > 0),
  special_instructions text,
  unique(cart_id, menu_item_id)
);

-- Orders
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references users(id) on delete set null,
  pickup_token        text not null unique default upper(substring(gen_random_uuid()::text from 1 for 6)),
  status              text not null default 'placed'
                        check (status in ('placed','confirmed','preparing','ready','picked_up','cancelled')),
  total               int not null,   -- in paise
  scheduled_pickup_at timestamptz,
  payment_status      text not null default 'pending'
                        check (payment_status in ('pending','paid','failed','refunded')),
  razorpay_order_id   text,
  razorpay_payment_id text,
  created_at          timestamptz not null default now()
);

-- Order items (snapshot of menu item at time of order)
create table order_items (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid references orders(id) on delete cascade,
  menu_item_id         uuid references menu_items(id) on delete set null,
  name                 text not null,   -- snapshot
  quantity             int not null,
  unit_price           int not null,    -- snapshot in paise
  special_instructions text
);

-- Ratings
create table ratings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  order_id     uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete cascade,
  score        int not null check (score between 1 and 5),
  created_at   timestamptz not null default now(),
  unique(user_id, menu_item_id, order_id)
);

-- Notifications
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  title      text not null,
  body       text not null,
  is_read    bool not null default false,
  created_at timestamptz not null default now()
);

-- Canteen settings (single row)
create table canteen_settings (
  id             int primary key default 1 check (id = 1),
  open_time      time not null default '08:00',
  close_time     time not null default '22:00',
  is_open        bool not null default true,
  max_concurrent_orders int not null default 50
);

insert into canteen_settings default values;

-- Indexes
create index on menu_items(category_id);
create index on menu_items(is_available);
create index on cart_items(cart_id);
create index on orders(user_id);
create index on orders(status);
create index on orders(created_at desc);
create index on order_items(order_id);
create index on notifications(user_id, is_read);
create index on ratings(menu_item_id);
```

### 2.3 Enable Supabase Realtime

Go to Supabase → Database → Replication and enable realtime for the `orders` and `notifications` tables. This lets the frontend subscribe to order status changes without polling.

### 2.4 Set up Supabase Storage

- Supabase → Storage → New bucket
- Name: `menu-images`
- Public bucket: Yes (menu item images are not sensitive)

---

## Phase 3 — FastAPI Foundation

### 3.1 Create backend/db/session.py

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from core.config import settings

engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass
```

### 3.2 Create backend/core/dependencies.py

```python
from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import AsyncSessionLocal
from core.security import decode_token
from models.user import User
from sqlalchemy import select

bearer = HTTPBearer()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_role(*roles: str):
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return checker
```

### 3.3 Create backend/core/security.py

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": user_id, "role": role, "exp": expire}, settings.secret_key, algorithm=settings.algorithm)

def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode({"sub": user_id, "type": "refresh", "exp": expire}, settings.secret_key, algorithm=settings.algorithm)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
```

### 3.4 Create backend/api/index.py

This is the Vercel serverless entry point. All routers are imported here.

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import auth, menu, cart, orders, payments, favourites, ratings, notifications, analytics, users, settings as settings_router

app = FastAPI(title="CampusBite API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(menu.router, prefix="/api/menu", tags=["menu"])
app.include_router(cart.router, prefix="/api/cart", tags=["cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(favourites.router, prefix="/api/favourites", tags=["favourites"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["ratings"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

To run locally:

```bash
cd backend
uvicorn api.index:app --reload --port 8000
```

FastAPI auto-generates interactive docs at `http://localhost:8000/docs`. Use this throughout development to test every endpoint before wiring the frontend.

---

## Phase 4 — Auth

### 4.1 Create backend/models/user.py

```python
import uuid
from sqlalchemy import String, Boolean, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column
from db.session import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    student_id: Mapped[str | None] = mapped_column(String, unique=True)
    department: Mapped[str | None] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="student")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
```

### 4.2 Create backend/schemas/auth.py

```python
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    student_id: str | None = None
    department: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    student_id: str | None
    department: str | None
    is_active: bool

    model_config = {"from_attributes": True}

class UpdateProfileRequest(BaseModel):
    name: str | None = None
    department: str | None = None
```

### 4.3 Create backend/routers/auth.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.session import AsyncSessionLocal
from core.dependencies import get_db, get_current_user
from core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse, UpdateProfileRequest

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        student_id=body.student_id,
        department=body.department,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
    )

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_me(body: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if body.name:
        current_user.name = body.name
    if body.department:
        current_user.department = body.department
    await db.commit()
    await db.refresh(current_user)
    return current_user
```

---

## Phase 5 — Menu & Categories API

### 5.1 Create backend/models/menu.py

```python
import uuid
from sqlalchemy import String, Boolean, Integer, Text, Time, ForeignKey, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.session import Base
from datetime import datetime, time

class Category(Base):
    __tablename__ = "categories"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    items: Mapped[list["MenuItem"]] = relationship(back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id"))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[int] = mapped_column(Integer)          # paise
    image_url: Mapped[str | None] = mapped_column(String)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    available_from: Mapped[time | None] = mapped_column(Time)
    available_until: Mapped[time | None] = mapped_column(Time)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    category: Mapped["Category"] = relationship(back_populates="items")
```

### 5.2 Create backend/routers/menu.py

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from core.dependencies import get_db, get_current_user, require_role
from models.menu import Category, MenuItem
from models.user import User
from schemas.menu import (
    CategoryCreate, CategoryResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse
)

router = APIRouter()

# --- Categories ---

@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.sort_order))
    return result.scalars().all()

@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(body: CategoryCreate, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    cat = Category(**body.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat

@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, body: CategoryCreate, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(cat, k, v)
    await db.commit()
    await db.refresh(cat)
    return cat

@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: str, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)
    await db.commit()

# --- Menu Items ---

@router.get("/items", response_model=list[MenuItemResponse])
async def list_items(category_id: str | None = Query(None), search: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    q = select(MenuItem)
    if category_id:
        q = q.where(MenuItem.category_id == category_id)
    if search:
        q = q.where(MenuItem.name.ilike(f"%{search}%"))
    result = await db.execute(q.order_by(MenuItem.name))
    return result.scalars().all()

@router.get("/items/{item_id}", response_model=MenuItemResponse)
async def get_item(item_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/items", response_model=MenuItemResponse, status_code=201)
async def create_item(body: MenuItemCreate, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    item = MenuItem(**body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.patch("/items/{item_id}", response_model=MenuItemResponse)
async def update_item(item_id: str, body: MenuItemUpdate, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: str, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()

@router.patch("/items/{item_id}/toggle", response_model=MenuItemResponse)
async def toggle_availability(item_id: str, _: User = Depends(require_role("staff", "admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_available = not item.is_available
    await db.commit()
    await db.refresh(item)
    return item
```

---

## Phase 6 — Cart API

### 6.1 Create backend/models/cart.py

```python
import uuid
from sqlalchemy import Integer, Text, ForeignKey, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.session import Base
from datetime import datetime

class Cart(Base):
    __tablename__ = "carts"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    items: Mapped[list["CartItem"]] = relationship(back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("carts.id"))
    menu_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("menu_items.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    special_instructions: Mapped[str | None] = mapped_column(Text)
    cart: Mapped["Cart"] = relationship(back_populates="items")
```

### 6.2 Create backend/routers/cart.py

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from core.dependencies import get_db, get_current_user
from models.cart import Cart, CartItem
from models.menu import MenuItem
from models.user import User
from schemas.cart import AddItemRequest, UpdateItemRequest, CartResponse

router = APIRouter()

async def get_or_create_cart(user: User, db: AsyncSession) -> Cart:
    result = await db.execute(
        select(Cart).where(Cart.user_id == user.id).options(selectinload(Cart.items))
    )
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
    return cart

@router.get("", response_model=CartResponse)
async def get_cart(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_or_create_cart(current_user, db)

@router.post("/items", response_model=CartResponse, status_code=201)
async def add_item(body: AddItemRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    item_result = await db.execute(select(MenuItem).where(MenuItem.id == body.menu_item_id))
    menu_item = item_result.scalar_one_or_none()
    if not menu_item or not menu_item.is_available:
        raise HTTPException(status_code=404, detail="Item not available")
    cart = await get_or_create_cart(current_user, db)
    existing = next((i for i in cart.items if str(i.menu_item_id) == str(body.menu_item_id)), None)
    if existing:
        existing.quantity += body.quantity
        if body.special_instructions:
            existing.special_instructions = body.special_instructions
    else:
        cart_item = CartItem(cart_id=cart.id, menu_item_id=body.menu_item_id, quantity=body.quantity, special_instructions=body.special_instructions)
        db.add(cart_item)
    await db.commit()
    return await get_or_create_cart(current_user, db)

@router.patch("/items/{item_id}", response_model=CartResponse)
async def update_item(item_id: str, body: UpdateItemRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cart = await get_or_create_cart(current_user, db)
    cart_item = next((i for i in cart.items if str(i.id) == item_id), None)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    cart_item.quantity = body.quantity
    await db.commit()
    return await get_or_create_cart(current_user, db)

@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_item(item_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cart = await get_or_create_cart(current_user, db)
    cart_item = next((i for i in cart.items if str(i.id) == item_id), None)
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    await db.delete(cart_item)
    await db.commit()
    return await get_or_create_cart(current_user, db)

@router.delete("", status_code=204)
async def clear_cart(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cart = await get_or_create_cart(current_user, db)
    for item in cart.items:
        await db.delete(item)
    await db.commit()
```

---

## Phase 7 — Orders API

### 7.1 Create backend/models/order.py

```python
import uuid
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.session import Base
from datetime import datetime

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    pickup_token: Mapped[str] = mapped_column(String, unique=True)
    status: Mapped[str] = mapped_column(String, default="placed")
    total: Mapped[int] = mapped_column(Integer)
    scheduled_pickup_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payment_status: Mapped[str] = mapped_column(String, default="pending")
    razorpay_order_id: Mapped[str | None] = mapped_column(String)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("menu_items.id"))
    name: Mapped[str] = mapped_column(String)
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[int] = mapped_column(Integer)
    special_instructions: Mapped[str | None] = mapped_column(Text)
    order: Mapped["Order"] = relationship(back_populates="items")
```

### 7.2 Create backend/routers/orders.py

```python
import uuid, secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from core.dependencies import get_db, get_current_user, require_role
from models.order import Order, OrderItem
from models.cart import Cart, CartItem
from models.menu import MenuItem
from models.user import User
from schemas.order import OrderResponse, UpdateStatusRequest, SchedulePickupRequest

router = APIRouter()

@router.get("", response_model=list[OrderResponse])
async def list_orders(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    if current_user.role == "student":
        q = q.where(Order.user_id == current_user.id)
    result = await db.execute(q)
    return result.scalars().all()

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id).options(selectinload(Order.items)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return order

@router.post("", response_model=OrderResponse, status_code=201)
async def place_order(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cart).where(Cart.user_id == current_user.id).options(selectinload(CartItem.menu_item)))
    cart = result.scalar_one_or_none()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = 0
    order_items = []
    for ci in cart.items:
        item_result = await db.execute(select(MenuItem).where(MenuItem.id == ci.menu_item_id))
        menu_item = item_result.scalar_one_or_none()
        if not menu_item or not menu_item.is_available:
            raise HTTPException(status_code=400, detail=f"'{menu_item.name if menu_item else 'Item'}' is no longer available")
        subtotal = menu_item.price * ci.quantity
        total += subtotal
        order_items.append(OrderItem(
            menu_item_id=menu_item.id,
            name=menu_item.name,
            quantity=ci.quantity,
            unit_price=menu_item.price,
            special_instructions=ci.special_instructions,
        ))

    token = secrets.token_hex(3).upper()
    order = Order(user_id=current_user.id, pickup_token=token, total=total, items=order_items)
    db.add(order)
    for ci in cart.items:
        await db.delete(ci)
    await db.commit()
    await db.refresh(order)
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_status(order_id: str, body: UpdateStatusRequest, _: User = Depends(require_role("staff", "admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = body.status
    await db.commit()
    await db.refresh(order)
    return order

@router.patch("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    if order.status not in ("placed", "confirmed"):
        raise HTTPException(status_code=400, detail="Cannot cancel order in current status")
    order.status = "cancelled"
    await db.commit()
    await db.refresh(order)
    return order

@router.patch("/{order_id}/schedule", response_model=OrderResponse)
async def schedule_pickup(order_id: str, body: SchedulePickupRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order or str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Order not found")
    order.scheduled_pickup_at = body.pickup_at
    await db.commit()
    await db.refresh(order)
    return order
```

---

## Phase 8 — Payments

### 8.1 Create backend/routers/payments.py

```python
import hmac, hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import razorpay
from core.config import settings
from core.dependencies import get_db, get_current_user
from models.order import Order
from models.user import User
from schemas.payment import InitiatePaymentRequest, VerifyPaymentRequest, PaymentResponse

router = APIRouter()
client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

@router.post("/initiate", response_model=PaymentResponse)
async def initiate_payment(body: InitiatePaymentRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == body.order_id))
    order = result.scalar_one_or_none()
    if not order or str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    rz_order = client.order.create({
        "amount": order.total,
        "currency": "INR",
        "receipt": str(order.id),
    })
    order.razorpay_order_id = rz_order["id"]
    await db.commit()

    return PaymentResponse(razorpay_order_id=rz_order["id"], amount=order.total, key_id=settings.razorpay_key_id)

@router.post("/verify")
async def verify_payment(body: VerifyPaymentRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify signature
    expected = hmac.new(
        settings.razorpay_key_secret.encode(),
        f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    result = await db.execute(select(Order).where(Order.razorpay_order_id == body.razorpay_order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.payment_status = "paid"
    order.razorpay_payment_id = body.razorpay_payment_id
    await db.commit()
    return {"message": "Payment verified successfully"}
```

---

## Phase 9 — Remaining Routers

All remaining routers follow the same pattern. Create one file per resource under `backend/routers/`:

**favourites.py** — `GET /favourites`, `POST /favourites/{item_id}`, `DELETE /favourites/{item_id}`. Store in a `favourites` table keyed by `(user_id, menu_item_id)`.

**ratings.py** — `POST /ratings` (after order is `picked_up`), `GET /ratings/item/{item_id}`. After each new rating, recompute `rating_avg` and `rating_count` on the `menu_items` row.

**notifications.py** — `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`. Write a `create_notification(user_id, title, body, db)` helper and call it from order status updates in `orders.py`.

**users.py** — `GET /users`, `GET /users/{id}`, `PATCH /users/{id}/status`, `DELETE /users/{id}`. All admin-only. Use `require_role("admin")`.

**settings.py** — `GET /settings`, `PATCH /settings`. Reads and writes the single row in `canteen_settings`. Admin-only for writes.

**analytics.py** — `GET /analytics/orders`, `GET /analytics/revenue`, `GET /analytics/items`, `GET /analytics/peak-hours`, `GET /analytics/prep-time`. All admin-only. Use raw SQLAlchemy queries with `func.date_trunc`, `func.count`, `func.sum`, `func.extract`. Accept `?period=daily|weekly|monthly` query param.

---

## Phase 10 — Alembic Migrations

Use Alembic to manage schema versions even though you've already run the SQL manually — this gives you a migration history and makes future changes safe.

### 10.1 Initialise Alembic

```bash
cd backend
alembic init alembic
```

### 10.2 Configure alembic/env.py

Add at the top of `env.py`:

```python
import sys
sys.path.insert(0, "..")
from core.config import settings
from db.session import Base
import models.user, models.menu, models.cart, models.order  # import all models so Base sees them

config.set_main_option("sqlalchemy.url", settings.database_url.replace("+asyncpg", ""))  # Alembic uses sync driver
target_metadata = Base.metadata
```

### 10.3 Generate the initial migration

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

For every schema change you make from here: edit the models, run `alembic revision --autogenerate -m "description"`, then `alembic upgrade head`. Never touch the DB manually again after this point.

---

## Phase 11 — React Frontend Setup

### 11.1 Configure Vite proxy

`frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

### 11.2 Configure Tailwind

`frontend/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

### 11.3 Create frontend/src/lib/api.ts

Axios instance with JWT attach and auto-refresh on 401.

```typescript
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post('/api/auth/refresh', { refresh_token: refresh })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
```

### 11.4 Create frontend/src/store/auth.ts

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

type AuthStore = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setTokens: (access, refresh) => {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({ accessToken: access, refreshToken: refresh })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.clear()
        set({ user: null, accessToken: null, refreshToken: null })
      },
    }),
    { name: 'auth' }
  )
)
```

### 11.5 Create frontend/src/store/cart.ts

```typescript
import { create } from 'zustand'
import type { Cart } from '@/types'

type CartStore = {
  cart: Cart | null
  setCart: (cart: Cart) => void
  clearCart: () => void
  itemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  setCart: (cart) => set({ cart }),
  clearCart: () => set({ cart: null }),
  itemCount: () => get().cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
}))
```

### 11.6 Set up routing — frontend/src/App.tsx

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'

// Auth
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// Student
import MenuPage from '@/pages/student/MenuPage'
import CartPage from '@/pages/student/CartPage'
import OrdersPage from '@/pages/student/OrdersPage'
import OrderDetailPage from '@/pages/student/OrderDetailPage'
import FavouritesPage from '@/pages/student/FavouritesPage'

// Staff
import StaffDashboard from '@/pages/staff/StaffDashboard'

// Admin
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminMenu from '@/pages/admin/AdminMenu'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminAnalytics from '@/pages/admin/AdminAnalytics'
import AdminSettings from '@/pages/admin/AdminSettings'

const queryClient = new QueryClient()

function RoleGuard({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<RoleGuard roles={["student"]}><MenuPage /></RoleGuard>} />
          <Route path="/cart" element={<RoleGuard roles={["student"]}><CartPage /></RoleGuard>} />
          <Route path="/orders" element={<RoleGuard roles={["student"]}><OrdersPage /></RoleGuard>} />
          <Route path="/orders/:id" element={<RoleGuard roles={["student"]}><OrderDetailPage /></RoleGuard>} />
          <Route path="/favourites" element={<RoleGuard roles={["student"]}><FavouritesPage /></RoleGuard>} />

          <Route path="/staff" element={<RoleGuard roles={["staff", "admin"]}><StaffDashboard /></RoleGuard>} />

          <Route path="/admin" element={<RoleGuard roles={["admin"]}><AdminDashboard /></RoleGuard>} />
          <Route path="/admin/menu" element={<RoleGuard roles={["admin"]}><AdminMenu /></RoleGuard>} />
          <Route path="/admin/users" element={<RoleGuard roles={["admin"]}><AdminUsers /></RoleGuard>} />
          <Route path="/admin/analytics" element={<RoleGuard roles={["admin"]}><AdminAnalytics /></RoleGuard>} />
          <Route path="/admin/settings" element={<RoleGuard roles={["admin"]}><AdminSettings /></RoleGuard>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

---

## Phase 12 — Auth UI

Two pages: login and register. Keep them simple — the demo evaluator will hit these first.

### 12.1 LoginPage

```typescript
// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setTokens, setUser } = useAuthStore()
  const navigate = useNavigate()

  const login = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/auth/login', { email, password })
      return data
    },
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token)
      const { data: user } = await api.get('/auth/me')
      setUser(user)
      navigate(user.role === 'student' ? '/' : user.role === 'staff' ? '/staff' : '/admin')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 rounded-2xl border border-border bg-card">
        <div>
          <h1 className="text-2xl font-bold">CampusBite</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>
        {login.isError && <p className="text-red-500 text-sm">Invalid credentials</p>}
        <div className="space-y-4">
          <input className="w-full rounded-lg border px-3 py-2 text-sm" type="email" placeholder="College email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-2 text-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button
            className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-50"
            onClick={() => login.mutate()}
            disabled={login.isPending}
          >
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          No account? <Link to="/register" className="text-primary underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
```

The RegisterPage mirrors this with additional fields: name, student_id, department.

---

## Phase 13 — Student UI

### 13.1 Menu page key structure

```typescript
// MenuPage fetches categories and items, renders category tabs + item grid
const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/menu/categories').then(r => r.data) })
const { data: items } = useQuery({ queryKey: ['items', selectedCategory, search], queryFn: () => api.get('/menu/items', { params: { category_id: selectedCategory, search } }).then(r => r.data) })
```

MenuItemCard renders: image, name, price (formatted via `formatPrice`), availability badge, add-to-cart button. Tapping add-to-cart calls `POST /cart/items` and invalidates the cart query.

### 13.2 Cart page

Renders CartItem rows with quantity stepper and remove button. Shows order total. "Place Order" button calls `POST /orders` then `POST /payments/initiate`, opens the Razorpay checkout widget, then calls `POST /payments/verify` on success.

Razorpay checkout:

```typescript
function openRazorpay(paymentData: PaymentResponse, orderId: string) {
  const options = {
    key: paymentData.key_id,
    amount: paymentData.amount,
    currency: 'INR',
    order_id: paymentData.razorpay_order_id,
    name: 'CampusBite',
    description: 'Canteen Order',
    handler: async (response: any) => {
      await api.post('/payments/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        order_id: orderId,
      })
      navigate(`/orders/${orderId}`)
    },
  }
  const rzp = new (window as any).Razorpay(options)
  rzp.open()
}
```

Add Razorpay script to `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 13.3 Order detail page — live status

This is the centrepiece of the student experience. Show the pickup token large, and subscribe to real-time order updates via Supabase.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

useEffect(() => {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => {
      queryClient.setQueryData(['order', orderId], (old: any) => ({
        ...old,
        status: payload.new.status,
      }))
    })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [orderId])
```

Add to `.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Get the anon key from Supabase → Settings → API → `anon` public key.

Show a step indicator with: Placed → Confirmed → Preparing → Ready for Pickup → Picked Up. Highlight the current step. When status becomes `ready`, show a toast notification and display the pickup token prominently.

---

## Phase 14 — Staff Dashboard

Single page at `/staff`. Shows all active orders in real time.

Subscribe to the entire orders table:

```typescript
supabase.channel('all-orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
    queryClient.invalidateQueries({ queryKey: ['staff-orders'] })
  })
  .subscribe()
```

Each order card shows: pickup token, list of items with quantities, special instructions, time elapsed since placed, and action buttons to advance status. Staff can only move orders forward — Placed → Confirmed → Preparing → Ready. Picked Up is set when student scans or staff confirms handoff.

Toggle item availability inline — `PATCH /menu/items/{id}/toggle` — so staff can mark "Dosa - Sold Out" without leaving the page.

---

## Phase 15 — Admin Panel

Four sub-pages under `/admin`:

**Menu Management (`/admin/menu`)** — full CRUD for categories and items. Item form includes image upload to Supabase Storage via the JS client. After upload, store the public URL via `PATCH /menu/items/{id}`.

```typescript
async function uploadImage(file: File): Promise<string> {
  const { data, error } = await supabase.storage.from('menu-images').upload(`items/${Date.now()}-${file.name}`, file)
  if (error) throw error
  return supabase.storage.from('menu-images').getPublicUrl(data.path).data.publicUrl
}
```

**User Management (`/admin/users`)** — paginated table of all users. Suspend/activate toggle and delete. Filter by role.

**Analytics (`/admin/analytics`)** — four cards with charts. Use Recharts. Fetch from `/analytics/orders`, `/analytics/revenue`, `/analytics/items`, `/analytics/peak-hours`. Period selector (daily / weekly / monthly) updates all charts simultaneously.

**Settings (`/admin/settings`)** — form to update open/close times, `is_open` toggle, max concurrent orders. `GET /settings` on load, `PATCH /settings` on save.

---

## Phase 16 — Deployment

### 16.1 Add the Supabase anon key to frontend env

```bash
# frontend/.env.production
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For the Vite build, Vercel will need these as environment variables — add them in the Vercel dashboard.

### 16.2 Update frontend/package.json build command

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 16.3 Push to GitHub

```bash
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/campusbite
git push -u origin main
```

### 16.4 Deploy to Vercel

- vercel.com → New Project → Import your repo
- Vercel detects the `vercel.json` — no extra config needed
- Add all environment variables in the Vercel dashboard:

Backend (set as plain env vars, not prefixed):
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `FRONTEND_URL` → your Vercel URL
- `ALLOWED_ORIGINS` → your Vercel URL

Frontend (must be prefixed with `VITE_`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

- Click Deploy. Both the React frontend and FastAPI backend deploy in one go.

### 16.5 Seed the admin user

After deployment, call the register endpoint with `role` hardcoded to `admin`. Then go to your DB in Supabase SQL editor and set the role:

```sql
update users set role = 'admin' where email = 'your@email.com';
```

Then register a staff account the same way and update:
```sql
update users set role = 'staff' where email = 'staff@email.com';
```

### 16.6 Seed menu data

Use the admin panel UI or Supabase SQL editor to insert initial categories and items before the demo.

---

## Phase 17 — Demo Prep

### 17.1 Full flow walkthrough

Run the complete happy path end to end:

1. Register as a student
2. Browse menu — confirm categories and items display
3. Add items to cart — confirm cart count updates
4. Place order — Razorpay test mode should show a test card screen
5. Use test card: `4111 1111 1111 1111`, any expiry, any CVV
6. Payment success → redirected to order detail
7. Open the staff dashboard in a second tab — order appears instantly
8. Advance order through each status — student tab updates in real time without refresh
9. When status hits "Ready", confirm the pickup token is shown clearly

### 17.2 Razorpay test mode

Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` use the test keys from your Razorpay dashboard. Test keys start with `rzp_test_`. You do not need KYC to use test mode.

### 17.3 Fix whatever breaks

Something will. Common issues:
- CORS: add your production Vercel URL to `ALLOWED_ORIGINS`
- Supabase Realtime: confirm the `orders` table is enabled for replication
- Alembic vs manual schema: if the DB schema drifts, re-run the migration SQL directly in Supabase SQL editor

---

## Phase 17 — Pre-Demo Checklist

- [ ] All env vars set in Vercel dashboard
- [ ] FastAPI `/api/health` returns `{"status": "ok"}` on production URL
- [ ] Supabase DB reachable from backend (test via `/api/menu/categories`)
- [ ] Admin user seeded and login works
- [ ] Staff user seeded and staff dashboard accessible
- [ ] At least 3 categories and 10 menu items seeded with images
- [ ] Student register → login → browse menu works
- [ ] Add to cart → update quantity → remove item works
- [ ] Place order → Razorpay test payment completes
- [ ] Order detail page shows correct pickup token
- [ ] Staff dashboard shows incoming order in real time
- [ ] Staff advancing status updates student's order page in real time
- [ ] Order history shows past orders
- [ ] Favourites add/remove works
- [ ] Rating submission works after order is picked up
- [ ] Admin menu CRUD works (create, edit, toggle availability, delete)
- [ ] Admin user management works (list, suspend)
- [ ] Analytics charts render with real data
- [ ] Canteen settings form saves correctly
- [ ] No console errors in browser DevTools on production URL
- [ ] Mobile layout is usable (resize browser to 390px wide and check key screens)

---

## Build Order Summary

| Phase | What | Why first |
|---|---|---|
| 0 | Prerequisites | Accounts and tools |
| 1 | Monorepo + project setup | Foundation everything else builds on |
| 2 | Supabase schema | All data depends on this — do it before any code |
| 3 | FastAPI foundation | Config, DB session, dependencies, security |
| 4 | Auth endpoints | Every subsequent endpoint depends on JWT |
| 5 | Menu API | Cart and orders depend on menu items existing |
| 6 | Cart API | Orders are placed from carts |
| 7 | Orders API | Payments depend on orders existing |
| 8 | Payments | Depends on orders; test with Razorpay test mode |
| 9 | Remaining routers | Favourites, ratings, notifications, analytics |
| 10 | Alembic | Lock in schema management before frontend |
| 11 | React setup | Foundation for all UI work |
| 12 | Auth UI | Must login before testing any student flow |
| 13 | Student UI | Core product — menu, cart, order tracking |
| 14 | Staff dashboard | Needs real orders to test against |
| 15 | Admin panel | Needs real data; built last because it's non-critical for demo flow |
| 16 | Deploy | Ship before demo prep |
| 17 | Demo prep | Walkthrough and fixes last |

---

*Follow phases in order. Do not skip ahead. Each phase assumes the previous one is working.*

---

## Appendix A — Pydantic Schemas

These were referenced in Phases 5–8. Create one file per resource under `backend/schemas/`.

### schemas/menu.py

```python
from pydantic import BaseModel
import uuid

class CategoryCreate(BaseModel):
    name: str
    description: str | None = None
    sort_order: int = 0

class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    sort_order: int
    model_config = {"from_attributes": True}

class MenuItemCreate(BaseModel):
    category_id: uuid.UUID | None = None
    name: str
    description: str | None = None
    price: int                       # in paise
    image_url: str | None = None
    is_available: bool = True
    available_from: str | None = None   # "08:00"
    available_until: str | None = None  # "22:00"

class MenuItemUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    name: str | None = None
    description: str | None = None
    price: int | None = None
    image_url: str | None = None
    is_available: bool | None = None
    available_from: str | None = None
    available_until: str | None = None

class MenuItemResponse(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID | None
    name: str
    description: str | None
    price: int
    image_url: str | None
    is_available: bool
    available_from: str | None
    available_until: str | None
    model_config = {"from_attributes": True}
```

### schemas/cart.py

```python
from pydantic import BaseModel
import uuid
from schemas.menu import MenuItemResponse

class AddItemRequest(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = 1
    special_instructions: str | None = None

class UpdateItemRequest(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    quantity: int
    special_instructions: str | None
    model_config = {"from_attributes": True}

class CartResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    items: list[CartItemResponse]
    model_config = {"from_attributes": True}
```

### schemas/order.py

```python
from pydantic import BaseModel
from datetime import datetime
import uuid

class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID | None
    name: str
    quantity: int
    unit_price: int
    special_instructions: str | None
    model_config = {"from_attributes": True}

class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    pickup_token: str
    status: str
    total: int
    scheduled_pickup_at: datetime | None
    payment_status: str
    created_at: datetime
    items: list[OrderItemResponse]
    model_config = {"from_attributes": True}

class UpdateStatusRequest(BaseModel):
    status: str   # confirmed | preparing | ready | picked_up | cancelled

class SchedulePickupRequest(BaseModel):
    pickup_at: datetime
```

### schemas/payment.py

```python
from pydantic import BaseModel

class InitiatePaymentRequest(BaseModel):
    order_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

class PaymentResponse(BaseModel):
    razorpay_order_id: str
    amount: int
    key_id: str
```

### schemas/rating.py

```python
from pydantic import BaseModel
import uuid

class RatingCreate(BaseModel):
    order_id: uuid.UUID
    menu_item_id: uuid.UUID
    score: int   # 1–5

class RatingResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    menu_item_id: uuid.UUID
    score: int
    model_config = {"from_attributes": True}

class ItemRatingSummary(BaseModel):
    menu_item_id: uuid.UUID
    avg_score: float
    total_ratings: int
```

### schemas/notification.py

```python
from pydantic import BaseModel
from datetime import datetime
import uuid

class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    body: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}
```

### schemas/settings.py

```python
from pydantic import BaseModel

class CanteenSettingsResponse(BaseModel):
    open_time: str
    close_time: str
    is_open: bool
    max_concurrent_orders: int
    model_config = {"from_attributes": True}

class CanteenSettingsUpdate(BaseModel):
    open_time: str | None = None
    close_time: str | None = None
    is_open: bool | None = None
    max_concurrent_orders: int | None = None
```

---

## Appendix B — Remaining Router Implementations

### routers/favourites.py

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.dependencies import get_db, get_current_user
from models.user import User
import uuid

router = APIRouter()

# Inline model — favourites table is simple enough not to need a separate models file
from sqlalchemy import Table, Column, ForeignKey, DateTime, text
from db.session import Base

class Favourite(Base):
    __tablename__ = "favourites"
    from sqlalchemy.orm import Mapped, mapped_column
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    menu_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("menu_items.id"))

@router.get("")
async def list_favourites(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Favourite).where(Favourite.user_id == current_user.id))
    return [{"id": str(f.id), "menu_item_id": str(f.menu_item_id)} for f in result.scalars().all()]

@router.post("/{item_id}", status_code=201)
async def add_favourite(item_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Favourite).where(Favourite.user_id == current_user.id, Favourite.menu_item_id == item_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already in favourites")
    fav = Favourite(user_id=current_user.id, menu_item_id=item_id)
    db.add(fav)
    await db.commit()
    return {"message": "Added to favourites"}

@router.delete("/{item_id}", status_code=204)
async def remove_favourite(item_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Favourite).where(Favourite.user_id == current_user.id, Favourite.menu_item_id == item_id))
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favourites")
    await db.delete(fav)
    await db.commit()
```

### routers/ratings.py

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from core.dependencies import get_db, get_current_user
from models.order import Order
from models.menu import MenuItem
from models.user import User
from schemas.rating import RatingCreate, RatingResponse, ItemRatingSummary
import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey, DateTime, text
from db.session import Base
from datetime import datetime

class Rating(Base):
    __tablename__ = "ratings"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("menu_items.id"))
    score: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

router = APIRouter()

@router.post("", response_model=RatingResponse, status_code=201)
async def create_rating(body: RatingCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify the order belongs to user and is picked up
    order_result = await db.execute(select(Order).where(Order.id == body.order_id))
    order = order_result.scalar_one_or_none()
    if not order or str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "picked_up":
        raise HTTPException(status_code=400, detail="Can only rate after pickup")

    # Check duplicate
    existing = await db.execute(
        select(Rating).where(Rating.user_id == current_user.id, Rating.order_id == body.order_id, Rating.menu_item_id == body.menu_item_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already rated this item for this order")

    rating = Rating(user_id=current_user.id, order_id=body.order_id, menu_item_id=body.menu_item_id, score=body.score)
    db.add(rating)

    # Update rolling average on menu_items
    await db.flush()
    avg_result = await db.execute(
        select(func.avg(Rating.score), func.count(Rating.id)).where(Rating.menu_item_id == body.menu_item_id)
    )
    avg, count = avg_result.one()
    item_result = await db.execute(select(MenuItem).where(MenuItem.id == body.menu_item_id))
    item = item_result.scalar_one_or_none()
    if item:
        item.rating_avg = round(float(avg), 2)
        item.rating_count = count

    await db.commit()
    await db.refresh(rating)
    return rating

@router.get("/item/{item_id}", response_model=ItemRatingSummary)
async def item_ratings(item_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.avg(Rating.score), func.count(Rating.id)).where(Rating.menu_item_id == item_id)
    )
    avg, count = result.one()
    return ItemRatingSummary(
        menu_item_id=uuid.UUID(item_id),
        avg_score=round(float(avg or 0), 2),
        total_ratings=count or 0,
    )
```

### routers/notifications.py

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, ForeignKey, DateTime, text
from db.session import Base
from core.dependencies import get_db, get_current_user
from models.user import User
from schemas.notification import NotificationResponse
import uuid
from datetime import datetime

class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(String)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

async def create_notification(user_id: uuid.UUID, title: str, body: str, db: AsyncSession):
    n = Notification(user_id=user_id, title=title, body=body)
    db.add(n)
    # Don't commit here — caller commits

router = APIRouter()

@router.get("", response_model=list[NotificationResponse])
async def list_notifications(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50)
    )
    return result.scalars().all()

@router.patch("/{notification_id}/read", status_code=204)
async def mark_read(notification_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id).values(is_read=True)
    )
    await db.commit()

@router.patch("/read-all", status_code=204)
async def mark_all_read(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Notification).where(Notification.user_id == current_user.id).values(is_read=True)
    )
    await db.commit()
```

Now wire notifications into order status updates. Back in `routers/orders.py`, import and call `create_notification` inside `update_status`:

```python
from routers.notifications import create_notification

# Inside update_status(), after order.status = body.status:
messages = {
    "confirmed": ("Order Confirmed", "Your order has been confirmed and will be prepared shortly."),
    "preparing": ("Preparing Your Order", "The canteen is now preparing your order."),
    "ready": ("Ready for Pickup! 🎉", f"Your order #{order.pickup_token} is ready. Head to the counter!"),
    "cancelled": ("Order Cancelled", "Your order has been cancelled."),
}
if body.status in messages:
    title, body_text = messages[body.status]
    await create_notification(order.user_id, title, body_text, db)
await db.commit()
```

### routers/analytics.py

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from core.dependencies import get_db, require_role
from models.order import Order, OrderItem
from models.user import User

router = APIRouter()

@router.get("/orders")
async def orders_over_time(
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    _: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    trunc = {"daily": "day", "weekly": "week", "monthly": "month"}[period]
    result = await db.execute(text(f"""
        SELECT date_trunc('{trunc}', created_at) as period,
               COUNT(*) as order_count,
               SUM(total) as revenue
        FROM orders
        WHERE payment_status = 'paid'
        GROUP BY 1 ORDER BY 1 DESC LIMIT 30
    """))
    return [{"period": str(r.period), "order_count": r.order_count, "revenue": r.revenue} for r in result]

@router.get("/items")
async def top_items(
    _: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.unit_price) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.payment_status = 'paid'
        GROUP BY oi.name ORDER BY total_qty DESC LIMIT 10
    """))
    return [{"name": r.name, "total_qty": r.total_qty, "revenue": r.revenue} for r in result]

@router.get("/peak-hours")
async def peak_hours(
    _: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Kolkata') as hour,
               COUNT(*) as order_count
        FROM orders
        GROUP BY 1 ORDER BY 1
    """))
    return [{"hour": int(r.hour), "order_count": r.order_count} for r in result]

@router.get("/prep-time")
async def avg_prep_time(
    _: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    # Approximate: time between 'placed' and 'ready' — requires status history.
    # For MVP, return average time from order creation to now for completed orders as a proxy.
    result = await db.execute(text("""
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_minutes
        FROM orders
        WHERE status = 'picked_up'
    """))
    row = result.one()
    return {"avg_prep_minutes": round(float(row.avg_minutes or 0), 1)}
```

Note: the `prep-time` endpoint needs an `updated_at` column on the `orders` table. Add it to your schema migration:

```sql
alter table orders add column updated_at timestamptz default now();
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger orders_updated_at before update on orders
for each row execute procedure update_updated_at();
```

### routers/users.py

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.dependencies import get_db, require_role
from models.user import User
from schemas.auth import UserResponse

router = APIRouter()

@router.get("", response_model=list[UserResponse])
async def list_users(_: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}/status", response_model=UserResponse)
async def toggle_status(user_id: str, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
```

### routers/settings.py

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Boolean, Time
from db.session import Base
from core.dependencies import get_db, get_current_user, require_role
from models.user import User
from schemas.settings import CanteenSettingsResponse, CanteenSettingsUpdate
from datetime import time

class CanteenSettings(Base):
    __tablename__ = "canteen_settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    open_time: Mapped[time] = mapped_column(Time)
    close_time: Mapped[time] = mapped_column(Time)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True)
    max_concurrent_orders: Mapped[int] = mapped_column(Integer, default=50)

router = APIRouter()

@router.get("", response_model=CanteenSettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CanteenSettings).where(CanteenSettings.id == 1))
    s = result.scalar_one()
    return CanteenSettingsResponse(
        open_time=s.open_time.strftime("%H:%M"),
        close_time=s.close_time.strftime("%H:%M"),
        is_open=s.is_open,
        max_concurrent_orders=s.max_concurrent_orders,
    )

@router.patch("", response_model=CanteenSettingsResponse)
async def update_settings(body: CanteenSettingsUpdate, _: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CanteenSettings).where(CanteenSettings.id == 1))
    s = result.scalar_one()
    if body.open_time:
        h, m = map(int, body.open_time.split(":"))
        s.open_time = time(h, m)
    if body.close_time:
        h, m = map(int, body.close_time.split(":"))
        s.close_time = time(h, m)
    if body.is_open is not None:
        s.is_open = body.is_open
    if body.max_concurrent_orders is not None:
        s.max_concurrent_orders = body.max_concurrent_orders
    await db.commit()
    return await get_settings(db)
```

---

## Appendix C — Frontend Hooks

Create these in `frontend/src/hooks/` — they're the data layer that all pages consume.

### hooks/useMenu.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Category, MenuItem } from '@/types'

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories').then(r => r.data),
  })
}

export function useMenuItems(categoryId?: string, search?: string) {
  return useQuery<MenuItem[]>({
    queryKey: ['menu-items', categoryId, search],
    queryFn: () => api.get('/menu/items', { params: { category_id: categoryId, search } }).then(r => r.data),
  })
}

export function useToggleAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => api.patch(`/menu/items/${itemId}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}
```

### hooks/useCart.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useCartStore } from '@/store/cart'
import type { Cart } from '@/types'
import { useEffect } from 'react'

export function useCart() {
  const setCart = useCartStore(s => s.setCart)
  const query = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart').then(r => r.data),
  })
  useEffect(() => {
    if (query.data) setCart(query.data)
  }, [query.data])
  return query
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { menu_item_id: string; quantity: number; special_instructions?: string }) =>
      api.post('/cart/items', payload).then(r => r.data),
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch(`/cart/items/${id}`, { quantity }).then(r => r.data),
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cart/items/${id}`).then(r => r.data),
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  })
}
```

### hooks/useOrders.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Order } from '@/types'

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  })
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function usePlaceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/orders').then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
```

---

## Appendix D — Key Component Implementations

### components/student/OrderStatusStepper.tsx

```typescript
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'placed',    label: 'Placed',    icon: '📋' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ready',     label: 'Ready!',    icon: '🔔' },
  { key: 'picked_up', label: 'Picked Up', icon: '🎉' },
]

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  const currentIndex = STEPS.findIndex(s => s.key === status)
  return (
    <div className="flex items-center gap-1 w-full">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all",
            i < currentIndex  && "bg-primary border-primary text-primary-foreground",
            i === currentIndex && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
            i > currentIndex  && "bg-muted border-border text-muted-foreground",
          )}>
            {step.icon}
          </div>
          <span className={cn("text-xs text-center", i === currentIndex ? "font-semibold" : "text-muted-foreground")}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn("absolute h-0.5 w-full mt-5", i < currentIndex ? "bg-primary" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  )
}
```

### components/student/PickupTokenDisplay.tsx

```typescript
export function PickupTokenDisplay({ token, status }: { token: string; status: string }) {
  const isReady = status === 'ready'
  return (
    <div className={`rounded-2xl p-6 text-center border-2 transition-all ${isReady ? 'border-green-500 bg-green-50 dark:bg-green-950 animate-pulse' : 'border-border bg-muted'}`}>
      <p className="text-sm text-muted-foreground mb-1">Your pickup token</p>
      <p className="text-6xl font-black tracking-widest text-primary">{token}</p>
      {isReady && <p className="text-green-600 font-semibold mt-3 text-sm">Show this at the counter →</p>}
    </div>
  )
}
```

### components/staff/OrderCard.tsx

```typescript
import { formatPrice } from '@/lib/utils'
import { useUpdateOrderStatus } from '@/hooks/useOrders'
import type { Order } from '@/types'

const NEXT_STATUS: Record<string, string> = {
  placed:    'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'picked_up',
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirm',
  preparing: 'Start Preparing',
  ready:     'Mark Ready',
  picked_up: 'Mark Picked Up',
}

export function OrderCard({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus()
  const next = NEXT_STATUS[order.status]

  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-black tracking-wider">{order.pickup_token}</span>
        <span className="text-xs text-muted-foreground">{elapsed}m ago</span>
      </div>

      <ul className="space-y-1">
        {order.items.map(item => (
          <li key={item.id} className="text-sm flex justify-between">
            <span>{item.quantity}× {item.name}</span>
            {item.special_instructions && (
              <span className="text-xs text-amber-600 italic">"{item.special_instructions}"</span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm font-medium">{formatPrice(order.total)}</span>
        {next && (
          <button
            onClick={() => updateStatus.mutate({ id: order.id.toString(), status: next })}
            disabled={updateStatus.isPending}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {STATUS_LABEL[next]}
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## Appendix E — Environment Variable Reference

Complete list of all env vars across frontend and backend.

### Backend (.env)

| Variable | Where to get it | Example |
|---|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → URI (change scheme to `postgresql+asyncpg`) | `postgresql+asyncpg://postgres:pw@db.xxx.supabase.co:5432/postgres` |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role key | `eyJ...` |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` | `a1b2c3...` |
| `ALGORITHM` | Hardcoded | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Hardcoded | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Hardcoded | `30` |
| `RAZORPAY_KEY_ID` | Razorpay dashboard → API Keys | `rzp_test_xxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard → API Keys | `xxx` |
| `FRONTEND_URL` | Your Vercel URL | `https://campusbite.vercel.app` |
| `ALLOWED_ORIGINS` | Same as FRONTEND_URL, comma-separated if multiple | `https://campusbite.vercel.app` |

### Frontend (.env / Vercel env vars)

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` public key |

