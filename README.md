# Inventory & Quotation Management System

A production-grade, full-stack inventory tracking and quotation management system built with Next.js App Router, TypeScript, TailwindCSS, Prisma ORM, Neon PostgreSQL, and NextAuth credentials authentication.

---

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS, Lucide Icons
- **Backend**: Server Actions, NextAuth Credentials Provider
- **Database**: Neon PostgreSQL, Prisma ORM
- **Driver Adapter**: `@prisma/adapter-neon` with `@neondatabase/serverless` (fully compliant with Prisma 7)
- **Deployment**: Vercel ready

---

## Folder Structure

```
inventory-system/
├── prisma/
│   ├── schema.prisma      # Prisma 7 Database schema definition
│   └── seed.ts            # Seeding script for Admin, Seller & mock products
├── src/
│   ├── app/
│   │   ├── admin/         # Admin views (dashboard, products, inventory)
│   │   ├── seller/        # Seller views (catalog list, order draft, history)
│   │   ├── login/         # Highly aesthetic credentials login portal
│   │   ├── api/           # Route handlers for NextAuth auth flow
│   │   ├── layout.tsx     # Main wrapper injecting providers
│   │   └── page.tsx       # Root index implementing route session redirects
│   ├── components/        # Reusable client components (e.g. Navbar)
│   ├── lib/
│   │   ├── auth.ts        # NextAuth options & credentials verification
│   │   ├── conversions.ts # Unit conversions & precision calculations
│   │   └── db.ts          # Global Prisma client instance with Neon adapter
│   ├── providers/         # Context wrappers (e.g. AuthProvider)
│   ├── types/             # Custom typescript typings (e.g. next-auth.d.ts)
│   └── middleware.ts      # Middleware for route protection
├── tsconfig.json          # TS config mapping import alias @/* to ./src/*
├── prisma.config.ts       # Prisma 7 configurations mapping Schema & URL
├── .env                   # Local environment secret variables
└── README.md              # Project documentation
```

---

## Database Schema

The database model is defined inside `prisma/schema.prisma` and focuses on strict relations and precise billing calculations:

- **User**: Represents staff accounts with defined roles (`ADMIN` or `SELLER`).
- **Product**: Represents warehouse stock. Stock quantities and base units are stored in base format (`g`, `mL`, or `item`).
- **Order**: Represents quotation sheets submitted by sellers. Stores user reference, processing status, and total price.
- **OrderItem**: Represents products on a quotation. Stores ordered quantity/unit alongside base converted quantity/price to ensure historical tracking.

All price, quantity, and subtotal columns are stored as **Decimal** to avoid floating-point precision loss.

---

## Conversion Strategy

All measurements are stored in their lowest common denominator base unit internally. This ensures consistency and prevents decimal rounding errors across multiple calculations.

### Supported Conversions
- **Weight**: 
  - Standard User Unit: `kg` (Kilograms) or `g` (Grams)
  - Database Storage Unit: `g` (Grams)
  - Conversion rule: `1 kg = 1000 g`
- **Volume**: 
  - Standard User Unit: `L` (Liters) or `mL` (Milliliters)
  - Database Storage Unit: `mL` (Milliliters)
  - Conversion rule: `1 L = 1000 mL`
- **Count**: 
  - Standard User Unit: `item` (Items)
  - Database Storage Unit: `item` (Items)
  - Conversion rule: `1 item = 1 item`

Conversion functions are centralized inside `src/lib/conversions.ts` and convert numbers to Decimal before performing mathematical transformations.

---

## Pricing Strategy

Prices are stored per internal base unit to simplify billing math:

$$\text{Price Per Base Unit} = \frac{\text{Price Per User Unit}}{\text{Conversion Factor}}$$

### Example: Basmati Rice (₹120 per kg)
- Display Unit: `kg`
- Internal Base Unit: `g`
- Internal Price: `120 / 1000 = ₹0.12` per gram
- Order Checkout: If a customer buys `500g`:
  - Quantity in base unit: `500g`
  - Subtotal calculation: `500 * ₹0.12 = ₹60.00`
- Order Checkout: If a customer buys `2.5kg`:
  - Quantity in base unit: `2.5 * 1000 = 2500g`
  - Subtotal calculation: `2500 * ₹0.12 = ₹300.00`

---

## Credentials

The system seeds the database with the following demo credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **ADMIN** | `admin@inventory.com` | `Admin123!` |
| **SELLER** | `seller@inventory.com` | `Seller123!` |

---

## Setup & Local Development

### 1. Configure Environment Variables
Open the `.env` file in the root of the project and replace the connection placeholder with your actual Neon PostgreSQL credentials:

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-silent-bonus-ao12ncgr.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="f6c8d76a2e4e1a0b3c5d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Run Database Migrations
Apply the Prisma schema to your PostgreSQL database:

```bash
npx prisma migrate dev --name init
```

### 3. Seed Database
Load the default credentials and mock products into the database:

```bash
npx prisma db seed
```

### 4. Run Development Server
Start the local Next.js development server:

```bash
npm run dev
```

The application will run on `http://localhost:3000`.

---

## Deployment

Deploying this project is fully compatible with Vercel:

1. Connect your GitHub repository to Vercel.
2. In Vercel Project Settings, add the environment variables:
   - `DATABASE_URL` (Your Neon connection URL)
   - `NEXTAUTH_SECRET` (A secure random string)
   - `NEXTAUTH_URL` (Your deployed app's main URL, e.g. `https://your-app.vercel.app`)
3. Use the following build commands (automatic on Next.js setup):
   - **Build Command**: `npx prisma generate && next build`
   - **Install Command**: `npm install --legacy-peer-deps`
