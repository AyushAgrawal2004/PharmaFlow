# 🧬 PharmaFlow - Precision Pharmacy Inventory OS

![PharmaFlow Banner](public/pharmaflow_banner.png)

A production-ready, highly aesthetic pharmacy inventory tracking and medication billing system built with Next.js App Router, TypeScript, Tailwind CSS, Prisma ORM, Neon PostgreSQL, and NextAuth credentials authentication. Designed for precision medical stock control and billing.

---

## ⚡ Tech Stack & Architecture

- **Core Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & React 19
- **Type Safety**: [TypeScript](https://www.typescript.org/) & [Zod](https://zod.dev/) for data schema validation
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with class-based Native Dark Mode
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/) (Fully serverless connection pooler adapter)
- **Database ORM**: [Prisma v7](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v4](https://next-auth.js.org/) credentials flow
- **Visuals & Icons**: [Lucide React](https://lucide.dev/) for sleek modern indicators

---

## ✨ Features & Redesign Upgrades

* 🌗 **Seamless Dark Mode**: Dynamically switches background and text colors from light slate to deep space navy with Zero Flash on reload using a blocking SSR inject script.
* 📏 **Precise Unit Management**: Allows billing and stock tracking in items, milligrams (`mg`), grams (`g`), or milliliters (`mL`). Price conversions calculations support up to **6 decimal places** for compounding chemicals.
* 📦 **Warehouse Minimum Purchase Limits**: Custom purchase limits set on individual products are validated both on the client cart page and via server-side database transaction hooks.
* 🔑 **Seller Operators Onboarding**: Integrated a premium glassmorphic seller signup page allowing quick self-registration for pharmacists with secure bcrypt hashing.
* 📊 **Interactive Dashboard**: Modern interactive cards showing out-of-stock indicators, low-stock notifications, recent invoices, and custom compounding order logs.

---

## 📂 Project Architecture

```
inventory-system/
├── prisma/
│   ├── schema.prisma      # Database schema (Models: User, Product, Order, OrderItem)
│   └── seed.ts            # Seeding script for default users & pharmacy stock
├── src/
│   ├── app/
│   │   ├── admin/         # Admin views (Dashboard, Products CRUD, Stock warnings)
│   │   ├── seller/        # Pharmacist views (Interactive catalog, Cart, Order log)
│   │   ├── login/         # Sleek glassmorphic sign-in page
│   │   ├── signup/        # Modern self-registration seller signup card
│   │   ├── api/           # API routes (NextAuth backend endpoints)
│   │   ├── layout.tsx     # Main wrapper injecting global themes & AuthProviders
│   │   └── page.tsx       # Root entry redirecting users based on session role
│   ├── components/        # Reusable elements (Navbar with Theme switcher)
│   ├── lib/
│   │   ├── auth.ts        # NextAuth settings & encrypted credentials validation
│   │   ├── conversions.ts # Multi-unit decimal calculations
│   │   └── db.ts          # Global Prisma adapter connected to Neon PostgreSQL
│   ├── providers/         # Global provider contexts (Theme Context, NextAuth Session)
│   ├── types/             # TypeScript type overrides & interface declarations
│   └── middleware.ts      # Edge middleware route protection (forces login)
├── prisma.config.ts       # Database schema compile directives
└── package.json           # Scripts and dependency versions
```

---

## 🧮 Conversion & Precision Math

To prevent floating-point rounding errors (like `0.1 + 0.2 = 0.30000000000000004`), PharmaFlow converts all fractional weight and volume quantities into the **lowest common denominator base unit** inside Neon DB.

### 📐 Measurement Rules
1. **Weight**: Stored in **grams (`g`)**.
   - Input `2.5 kg` is stored in DB as `2500`.
   - Conversions: `1 kg = 1000 g`.
2. **Volume**: Stored in **milliliters (`mL`)**.
   - Input `1.5 L` is stored in DB as `1500`.
   - Conversions: `1 L = 1000 mL`.
3. **Count**: Stored as **item (`item`)**.
   - Conversions: `1 item = 1 item`.

All calculations are executed using `decimal.js` internally before storing or displaying numbers, preserving precision up to 6 decimal places for custom prescription compounds:

$$\text{Subtotal} = \text{Converted Quantity in Base Unit} \times \text{Price Per Base Unit}$$

---

## 🔐 Credentials Seeding

The seed data provides two default roles out of the box:

| Role | Username / Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | `admin@inventory.com` | `Admin123!` | Full stock CRUD, warehouse dashboard, stock management |
| **`SELLER`** | `seller@inventory.com` | `Seller123!` | Product ordering catalog, shopping cart, private order log |

---

## 🚀 Quick Local Setup

Follow these simple commands to run PharmaFlow locally on your machine.

### 1. Install Dependencies
Clone the repository and install packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Neon PostgreSQL Connection URL
DATABASE_URL="postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-silent-bonus-ao12ncgr.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth Configuration
NEXTAUTH_SECRET="your-32-char-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Synchronize Database Schema
Push the schema structure to your Neon database:
```bash
npx prisma db push
```

### 4. Seed Seed-Data
Load default admin, seller accounts, and mock chemical items:
```bash
npx prisma db seed
```

### 5. Launch Development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## ☁️ Vercel Deployment

PharmaFlow is optimized for Vercel:

1. **Prisma Client Hooks**: The codebase includes a `postinstall` script in `package.json` to compile the database engine correctly on Vercel deployment servers.
2. **Set Environment Variables**: Add `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` under your Vercel Project Environment Settings.
3. **Redeploy**: Ensure you redeploy the latest changes to allow environment variables to take effect!
