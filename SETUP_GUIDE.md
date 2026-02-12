# IIMR Canteen - Complete Setup Guide

This guide walks you through setting up the entire application from scratch.

## Step 1: Prepare Your Machine

### Install Node.js
1. Download from https://nodejs.org/ (LTS version)
2. Install and verify:
```bash
node --version  # Should show v18+
npm --version   # Should show 10+
```

## Step 2: Set Up Project Files

```bash
cd "c:\Users\MSI\Desktop\my app"
npm install
```

You now have:
- React 18 app with Vite
- Supabase client library
- React Router for navigation
- TypeScript support

## Step 3: Create Supabase Project

### 3.1 Create Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

### 3.2 Create Organization & Project
1. Click "New project"
2. Select organization
3. **Project name**: `iimr-canteen` (or your choice)
4. **Database password**: Create strong password and save it!
5. **Region**: Choose closest to you
6. Click "Create new project"

⏳ **Wait 2-3 minutes** for project to initialize

### 3.3 Get API Credentials
1. Go to **Settings** (bottom left gear icon)
2. Click **API**
3. Copy and save:
   - **Project URL** (under "URL")
   - **Anon Key** (under "Project API keys")

### 3.4 Configure Environment
1. In VS Code, open `.env.local` file
2. Replace placeholder values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```
3. Save the file
4. **Restart dev server** (Ctrl+C in terminal, then `npm run dev`)

## Step 4: Set Up Database

### 4.1 Open SQL Editor
1. In Supabase dashboard, go to **SQL Editor**
2. Click **+ New Query**

### 4.2 Copy Database Schema
1. Open `DATABASE_SCHEMA.sql` file from project
2. Copy **ALL** the content
3. Paste into Supabase SQL Editor
4. Click **Run** (or Ctrl+Enter)

⏳ **Wait** for queries to complete - you should see no errors

### 4.3 Verify Tables Created
1. Go to **Table Editor** in left sidebar
2. You should see:
   - `users`
   - `curries`
   - `orders`
   - `settings`

✅ If all 4 tables appear, you're good!

## Step 5: Enable Real-Time

Real-time updates depend on this. Do this for each table:

1. Go to **Replication** (under Database settings)
2. For each table, toggle ON:
   - `curries`
   - `orders`
   - `settings`

## Step 6: Upload Curry Images

### 6.1 Create Storage Bucket
1. Go to **Storage** in sidebar
2. Click **Create a new bucket**
3. Name: `curry-images`
4. Privacy: **Public**
5. Click **Create bucket**

### 6.2 Upload Images
1. Click the bucket name
2. Click **Upload file**
3. Select curry images from your computer
4. Upload multiple images

### 6.3 Get Public URLs
For each image you uploaded:
1. Click the image file
2. Click **Copy URL**
3. Save these URLs - you'll use them in Step 7

**Example URLs look like:**
```
https://your-project.supabase.co/storage/v1/object/public/curry-images/chicken.jpg
```

## Step 7: Add Initial Data

### 7.1 Add Curries
1. Go back to **SQL Editor**
2. Create new query
3. Paste and modify (add your image URLs):

```sql
INSERT INTO curries (title, image_url) VALUES
  ('Hyderabadi Biryani', 'https://your-project.supabase.co/storage/v1/object/public/curry-images/biryani.jpg'),
  ('Chettinad Chicken', 'https://your-project.supabase.co/storage/v1/object/public/curry-images/chettinad.jpg'),
  ('Butter Chicken', 'https://your-project.supabase.co/storage/v1/object/public/curry-images/butter.jpg'),
  ('Lamb Curry', 'https://your-project.supabase.co/storage/v1/object/public/curry-images/lamb.jpg');
```

4. Click **Run**

### 7.2 Verify Curries Added
1. Go to **Table Editor**
2. Click `curries` table
3. You should see 4 rows with your curry data

## Step 8: Create an Admin Account

### 8.1 Create User via App
1. Start dev server: `npm run dev`
2. Go to http://localhost:5173
3. Click **Sign Up**
4. Fill in form:
   - Name: Your name
   - Phone: Your phone
   - Email: your-email@example.com
   - Password: Create strong password
5. Click **Sign Up**
6. You'll be redirected to login page

### 8.2 Make Yourself Admin
1. Back in Supabase, go to **SQL Editor**
2. Create new query:

```sql
-- Replace with the email you just signed up with
UPDATE users SET is_admin = TRUE WHERE email = 'your-email@example.com';
```

3. Click **Run**

### 8.3 Verify Admin Status
1. Go back to app at http://localhost:5173
2. **Refresh the page** (Ctrl+R)
3. You should now see **"(Admin)"** next to your email in header
4. You should see **"Admin Panel"** button

✅ You're now an admin!

## Step 9: Test the Application

### Admin Functions
1. Click **Admin Panel**
2. You should see:
   - User view (menu with curries)
   - **Manage Menu** - checkboxes for your 4 curries
   - **Admin Settings** - toggles and input fields
   - **Orders Management** - empty table (no orders yet)

3. Try:
   - Checking 2-3 curries in "Manage Menu", click "Update Menu"
   - Toggle "Special Biryani Day", click "Save Settings"
   - Toggle "Canteen Closed", click "Save Settings"
   - Set "Extra Plates Available" to 5, click "Save Settings"

### User Functions
1. Click **IIMR Canteen** header to go home
2. You should see:
   - Selected curries displayed with images
   - Notices about special day/closed/extra plates
   - Order form (if not closed)
3. Try placing an order for 2 plates

### Real-Time Test
Open 2 browser windows:
1. **Window 1**: Logged in as admin at `/admin`
2. **Window 2**: Logged in as same user at `/`
3. In Window 1: Change settings or toggle curries
4. In Window 2: Changes should appear instantly! ✨

## Step 10: Create Additional Test Accounts

Create 2-3 more test users to see orders:

1. In another browser/incognito:
   - Go to http://localhost:5173
   - Sign up with different email
   - Place an order

2. Back in admin panel (`/admin`):
   - Go to **Orders Management** table
   - You should see the order with user's name & phone
   - Click the row to toggle "Picked Up" status (turns green)

## Troubleshooting

### "Cannot find environment variables"
- Check `.env.local` exists in **root** of project
- Verify values are correct (no spaces, no quotes)
- Stop and restart `npm run dev`

### Curries not showing in menu
- Check `curries` table has data
- Admin selected curries in "Manage Menu"? Check `settings.selected_curries`
- Real-time enabled for `curries` table?

### Orders not saving
- Are you logged in? (check header)
- Is cutoff time past 12:00 PM? (orders locked after cutoff)
- Check browser console for error messages (F12)

### Images not loading
- Check image URLs are correct and public
- Go to Storage bucket, click image, verify it's **Public**
- Copy fresh URLs from browser

### Real-time not working
- Go to Supabase > Database > Replication
- Check toggles are ON for `orders`, `curries`, `settings`
- Refresh the page

### RLS Policy Errors
- Ensure you're logged in (check header)
- Verify user exists in `users` table
- Check `is_admin` for admin operations
- View RLS policies: Settings > Policies > (table)

## Production Deployment

### Before Deploying
1. Update package.json `"name"` field to your project name
2. Test all features locally
3. Get fresh Supabase credentials (if using separate prod project)
4. Store credentials securely (never in code!)

### Deploy to Vercel (Easiest)

1. Push code to GitHub
2. Go to https://vercel.com
3. Click "Add New" > "Project"
4. Select your GitHub repository
5. Add environment variables:
   - `VITE_SUPABASE_URL` = your-project.supabase.co
   - `VITE_SUPABASE_ANON_KEY` = your-anon-key
6. Click **Deploy**

Your app is now live! 🎉

### Custom Domain
1. In Vercel dashboard, go to your project
2. Click **Settings** > **Domains**
3. Add your domain
4. Follow DNS setup instructions

## What's Next?

- Add more curry items
- Invite real users
- Monitor orders in real-time
- Customize colors in `src/styles/global.css`
- Add more features (notifications, analytics, etc.)

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vite.dev
- **TypeScript**: https://www.typescriptlang.org/docs

---

**Congratulations!** You have a complete, production-ready canteen ordering system! 🎉
