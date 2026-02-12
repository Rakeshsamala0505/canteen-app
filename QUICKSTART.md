# Quick Start - IIMR Canteen App

## ⚡ Fast Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
Create `.env.local` in project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser

## 📋 Next Steps

**For detailed setup with Supabase:**
👉 See [SETUP_GUIDE.md](SETUP_GUIDE.md)

**For full documentation:**
👉 See [README.md](README.md)

## 🗂️ Project Structure

```
my app/
├── src/
│   ├── components/              # React components
│   │   ├── Header.tsx           # App header with navigation
│   │   ├── ProtectedRoute.tsx   # Authentication wrapper
│   │   ├── Login.tsx            # Login form
│   │   ├── SignUp.tsx           # Registration form
│   │   ├── MenuDisplay.tsx      # Display selected curries
│   │   ├── OrderForm.tsx        # User order placement
│   │   ├── AdminMenuManager.tsx # Select curries to display
│   │   ├── AdminSettingsPanel.tsx # Toggle settings
│   │   └── OrdersManagementTable.tsx # Track pickups
│   ├── pages/                   # Page views
│   │   ├── UserHome.tsx         # User dashboard
│   │   └── AdminDashboard.tsx   # Admin controls
│   ├── hooks/                   # Custom React hooks
│   │   └── useData.ts           # Auth, settings, orders hooks
│   ├── services/                # API services
│   │   └── authService.ts       # Authentication functions
│   ├── lib/                     # Utilities
│   │   └── supabase.ts          # Supabase client
│   ├── styles/                  # CSS
│   │   └── global.css           # Global styles (millet theme)
│   ├── App.tsx                  # App routes
│   └── main.tsx                 # Entry point
├── .env.local                   # ⚙️ Environment variables (YOU ADD THIS)
├── DATABASE_SCHEMA.sql          # SQL to run in Supabase
├── README.md                    # Full documentation
├── SETUP_GUIDE.md               # Step-by-step setup
├── QUICKSTART.md                # This file
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── vite.config.ts               # Vite configuration
```

## 🚀 Available Commands

```bash
npm run dev     # Start dev server (http://localhost:5173)
npm run build   # Build for production
npm run lint    # Check code style
npm run preview # Preview production build
```

## 🔐 Authentication Flow

1. **Sign Up Page** (`/signup`)
   - User enters: name, phone, email, password
   - Account created in Supabase Auth
   - User profile added to `users` table
   - Redirects to login

2. **Login Page** (`/login`)
   - Email + password authentication
   - Session established
   - Redirects to home

3. **Protected Routes**
   - User dashboard (`/`) - requires login
   - Admin dashboard (`/admin`) - requires login + admin role

## 📊 Key Features

### User Side
- ✅ Browse menu (selected curries only)
- ✅ Place orders (1-3 plates)
- ✅ Cancel orders (before 12:00 PM)
- ✅ See order status (pending/picked up)
- ✅ View notices (special day, closed, extra plates)

### Admin Side
- 🎛️ Select which curries appear in menu
- 🎉 Toggle "Special Biryani Day" banner
- 🔒 Toggle "Canteen Closed" (stops orders)
- ✨ Set extra plates available
- 📦 Track all orders live (name, phone, plates)
- ✓ Mark orders as picked-up (click row)
- 🎯 Cutoff time: 12:00 PM (in code)

## 🎨 Theme Colors

The app uses a warm **millet/earth theme**:

```css
--primary:        #d4a574  (warm tan)
--primary-dark:   #b89563  (darker tan)
--primary-light:  #e8c4a0  (light tan)
--secondary:      #8b7355  (brown)
--accent:         #f0ad4e  (golden)
--success:        #28a745  (green)
--danger:         #dc3545  (red)
--background:     #f9f7f4  (off-white)
```

All in `src/styles/global.css` - customize freely!

## 🔧 Important Configuration

### Cutoff Time
Hardcoded to **12:00 PM** (noon)

Change in:
- `src/components/OrderForm.tsx` - line ~16
- `src/components/OrdersManagementTable.tsx` - line ~6

### Max Plates
Limited to **3 plates per order** (configured in HTML input `max="3"`)

### Order Date
Always **today's date** (no date picker)

## 🛠️ Setup Checklist

- [ ] Install Node.js 18+
- [ ] Run `npm install`
- [ ] Create Supabase project
- [ ] Add `.env.local` with credentials
- [ ] Run `DATABASE_SCHEMA.sql` in Supabase
- [ ] Create storage bucket `curry-images`
- [ ] Upload curry images to storage
- [ ] Create test curries with image URLs
- [ ] Sign up as user
- [ ] Make user admin via SQL update
- [ ] Run `npm run dev`
- [ ] Test user features
- [ ] Test admin features

## 📱 Responsive Design

App is fully responsive:
- Desktop (1200px+) - Full grid layout
- Tablet (768px-1199px) - 2-column layout
- Mobile (< 768px) - Single column, stacked buttons

## 🔍 Debugging Tips

### Check Console Errors
Press `F12` in browser, go to Console tab

### Verify Environment Variables
Never show credentials! But verify they're loaded:
```javascript
// In browser console:
console.log(import.meta.env.VITE_SUPABASE_URL)
```

### Database Queries
Check Supabase SQL Editor history

### Realtime Issues
Enable in Supabase > Database > Replication > Toggle tables

## 📞 Need Help?

1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) - step-by-step walkthrough
2. Check [README.md](README.md) - feature documentation
3. Check [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql) - table structure
4. Supabase Docs: https://supabase.com/docs

## 🎉 You're Ready!

```bash
npm run dev
# Open http://localhost:5173
# Sign up, login, and start building!
```

---

Happy cooking! 🍛
