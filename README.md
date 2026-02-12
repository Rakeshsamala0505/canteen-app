# IIMR Canteen Ordering System

A modern React + Vite application for managing canteen curry orders with admin controls and real-time updates powered by Supabase.

## Features

✨ **User Portal**
- Browse today's selected curries with images
- Place orders for up to 3 plates
- Cancel orders before 12:00 PM cutoff
- View order pickup status
- See special notices and available extra plates

🎛️ **Admin Portal**
- Manages menu: select which curries to display
- Toggle special day announcements
- Control canteen open/closed status
- Track available extra plates
- Live orders management table with pickup tracking
- Sees everything users see, plus admin controls

🔐 **Authentication**
- User signup with name, phone, email, password
- Secure login
- Admin designation via Supabase

⚡ **Real-Time Updates**
- Live menu updates across all users
- Real-time order status tracking
- Instant pickup confirmation

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Storage**: Supabase Storage (for curry images)
- **Styling**: Custom CSS with millet theme

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier available)
- npm or yarn

### 1. Clone & Install

```bash
cd "c:\Users\MSI\Desktop\my app"
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **Anon Key** from Project Settings > API
3. Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Initialize Database

1. In Supabase SQL Editor, run all queries from `DATABASE_SCHEMA.sql`
2. This creates tables, RLS policies, and functions

### 4. Upload Curry Images

1. Go to Supabase Storage
2. Create a bucket named `curry-images`
3. Upload your curry images
4. Copy public URLs for each image

### 5. Add Sample Data

In Supabase, run these SQL commands:

```sql
-- Insert sample curries
INSERT INTO curries (title, image_url) VALUES
  ('Hyderabadi Biryani', 'https://...'),
  ('Chettinad Chicken', 'https://...'),
  ('Butter Chicken', 'https://...');

-- Set admin user (replace user_id with actual user ID)
UPDATE users SET is_admin = TRUE WHERE id = 'user-id-here';
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Usage

### For Users

1. **Sign Up**: Create account with name, phone, email, password
2. **Browse Menu**: View today's selected curries
3. **Place Order**: Select quantity (1-3 plates), click "Place Order"
4. **Track Status**: See "Pending" or "Picked Up" status
5. **Cancel**: Click "Cancel Order" (only before 12:00 PM)

### For Admins

1. **Login** as admin user
2. **Menu Management**:
   - Select which curries appear on menu
   - Changes reflect instantly for all users
3. **Settings**:
   - Toggle "Special Biryani Day" banner
   - Toggle "Canteen Closed" to stop orders
   - Set extra plates available count
4. **Orders Table**:
   - View all today's orders with customer names & phones
   - Click row to mark as "Picked Up" (turns green)
   - After cutoff, see pending orders in red

## Important Constants

- **Order Cutoff Time**: 12:00 PM (noon)
- **Max Plates per Order**: 3
- **Order Date**: Always today

These are hardcoded for simplicity - modify as needed in:
- `src/components/OrderForm.tsx` - line with `CUTOFF_TIME`
- `src/components/OrdersManagementTable.tsx` - `CUTOFF_TIME`

## Database Schema

### users
```
id (UUID, primary key)
name (TEXT)
phone (TEXT)
email (TEXT, unique)
is_admin (BOOLEAN)
created_at, updated_at (TIMESTAMP)
```

### curries
```
id (UUID, primary key)
title (TEXT, unique)
image_url (TEXT)
created_at (TIMESTAMP)
```

### orders
```
id (UUID, primary key)
user_id (UUID, foreign key)
quantity (INT, 1-3)
date (DATE)
status (TEXT: 'pending', 'confirmed', 'cancelled')
picked_up (BOOLEAN)
created_at, updated_at (TIMESTAMP)
```

### settings
```
id (INT, primary key)
selected_curries (UUID array)
special_day (BOOLEAN)
canteen_closed (BOOLEAN)
extra_plates_available (INT)
cutoff_time (TIME)
updated_at (TIMESTAMP)
```

## Security

✅ **Row Level Security (RLS)** enabled on all tables
- Users can only access their own orders
- Admins have full access to orders and settings
- Only admins can modify menu and settings
- Automatic user profile creation on signup

✅ **Authentication**
- Supabase Auth handles password hashing
- Session tokens for secure requests
- Login required for all features

## Styling

The app uses a modern **millet theme** with warm earthy colors:
- Primary: `#d4a574` (warm tan)
- Secondary: `#8b7355` (brown)
- Accent: `#f0ad4e` (golden)

All styles in `src/styles/global.css` - customize as needed!

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Deploy to Netlify

```bash
npm run build
# Drag 'dist' folder to Netlify
```

Add environment variables in Netlify dashboard too.

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` has correct URL and key
- Restart dev server after changing `.env.local`

### RLS Policy Errors
- Ensure you're logged in
- Check RLS policies in Supabase Settings > Auth > Policies
- Verify user is set as admin if needed

### Orders not showing
- Check date in database (should be today)
- Verify RLS policies allow user to see their orders

### Real-time not updating
- Enable Realtime for `public.orders` and `public.settings` tables
- Check Supabase > Database > Replication

## File Structure

```
src/
├── components/           # React components
│   ├── Header.tsx
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── MenuDisplay.tsx
│   ├── OrderForm.tsx
│   ├── AdminMenuManager.tsx
│   ├── AdminSettingsPanel.tsx
│   ├── OrdersManagementTable.tsx
│   └── ProtectedRoute.tsx
├── pages/               # Page components
│   ├── UserHome.tsx
│   └── AdminDashboard.tsx
├── hooks/               # Custom hooks
│   └── useData.ts
├── services/            # API services
│   └── authService.ts
├── lib/                 # Utilities
│   └── supabase.ts
├── styles/              # Styles
│   └── global.css
├── App.tsx              # Routes
└── main.tsx             # Entry point
```

## Future Enhancements

- 📱 Mobile app version
- 📊 Analytics dashboard for admins
- 🔔 Push notifications for order pickup
- 💳 Payment integration
- 📅 Weekly menu planning
- 🖼️ Image gallery for curries
- 📧 Email confirmations


