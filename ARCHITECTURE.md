# IIMR Canteen - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │        React 18 + TypeScript + Vite         │           │
│  ├──────────────────────────────────────────────┤           │
│  │  Routes:                                     │           │
│  │  ├─ /login          (SignUp/Login)          │           │
│  │  ├─ /               (UserHome)              │           │
│  │  └─ /admin          (AdminDashboard)        │           │
│  │                                              │           │
│  │  Components:                                 │           │
│  │  ├─ MenuDisplay     (Show curries)          │           │
│  │  ├─ OrderForm       (Place orders)          │           │
│  │  ├─ AdminMenuManager  (Select menu)         │           │
│  │  └─ OrdersManagementTable (Track pickups)   │           │
│  └──────────────────────────────────────────────┘           │
│           ↓                           ↓                      │
│        Queries                   Realtime Updates           │
│           ↓                           ↓                      │
└─────────────────────────────────────────────────────────────┘
       ↓↓↓ HTTPS/WebSocket ↓↓↓
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────┐                         │
│  │    Supabase Auth (JWT)         │                         │
│  │    - Email/Password            │                         │
│  │    - Session Tokens            │                         │
│  └────────────────────────────────┘                         │
│           ↕ authenticates                                   │
│  ┌──────────────────────────────────────────────┐           │
│  │      PostgreSQL Database                     │           │
│  │    ┌──────────┐  ┌──────────┐  ┌────────┐   │           │
│  │    │  users   │  │ curries  │  │ orders │   │           │
│  │    └──────────┘  └──────────┘  └────────┘   │           │
│  │    ┌──────────────┐                          │           │
│  │    │   settings   │                          │           │
│  │    └──────────────┘                          │           │
│  │                                              │           │
│  │    Row Level Security (RLS) Policies:        │           │
│  │    - Users see only their orders             │           │
│  │    - Admins see all orders & can edit        │           │
│  │    - Settings updates limited to admins      │           │
│  └──────────────────────────────────────────────┘           │
│           ↓                           ↓                      │
│       Queries                   Realtime Events             │
│           ↓                           ↓                      │
│  ┌────────────────────────────────┐                         │
│  │   Supabase Realtime             │                         │
│  │   PostgreSQL Change Stream      │                         │
│  │   - WebSocket Connection        │                         │
│  │   - Publish/Subscribe Pattern   │                         │
│  └────────────────────────────────┘                         │
│                                                              │
│  ┌────────────────────────────────┐                         │
│  │    Supabase Storage             │                         │
│  │    - Curry Images               │                         │
│  │    - Public Read Access         │                         │
│  └────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## User Authentication Flow

```
    User
      ↓
   ┌──────────────┐
   │  SignUp Page │
   └──────────┬───┘
       ↓ (Fill form)
   ┌──────────────────┐
   │ Validate Input   │ ← Check: password 6+, email unique
   └──────┬───────────┘
       ↓ (Valid)
   ┌──────────────────┐
   │ authService      │
   │ .signUp()        │
   └──────┬───────────┘
      ↙   ↘
  Supabase Auth     Create user profile
     ↓                   ↓
  Create user         INSERT users
  Hash password       table row
     ↓                   ↓
     ↘   ↙
   ┌──────────────┐
   │  Login Page  │ ← Redirect here
   └──────┬───────┘
       ↓ (Enter email/password)
   ┌──────────────────┐
   │ authService      │
   │ .signIn()        │
   └──────┬───────────┘
       ↓
   ┌──────────────────┐
   │ Supabase Auth    │
   │ Verify password  │
   └──────┬───────────┘
       ↓ (Valid)
   ┌──────────────────┐
   │ Session Created  │
   │ JWT Token Set    │
   └──────┬───────────┘
       ↓
   ┌──────────────────┐
   │  Home Page       │
   │  (Protected by   │
   │   ProtectedRoute)│
   └──────────────────┘
```

---

## User Order Flow

```
User Portal
    ↓
┌─────────────────────────┐
│  MenuDisplay Component  │
├─────────────────────────┤
│ useSelectedCurries()    │
│   ↓ (Realtime)          │
│   Gets from settings:   │
│   selected_curries[]    │
│   ↓                     │
│   Fetch full curry      │
│   details from DB       │
│   ↓                     │
│   Display curry cards   │
│   with images           │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│   OrderForm Component   │
├─────────────────────────┤
│ 1. Check cutoff time    │
│    11:59 AM ✓           │
│    12:01 PM ✗           │
│                         │
│ 2. User selects qty:    │
│    Quantity: 1-3        │
│                         │
│ 3. Click "Place Order"  │
│    ↓                    │
│    INSERT orders table  │
│    - user_id            │
│    - quantity           │
│    - date: TODAY        │
│    - status: pending    │
│    - picked_up: false   │
│    ↓                    │
│    ✓ "Order Placed"     │
│                         │
│ 4. Show order details   │
│    ├─ Quantity          │
│    ├─ Status            │
│    └─ "Cancel" button   │
│       (before 12:00)    │
└─────────────────────────┘
```

---

## Admin Menu Management Flow

```
Admin Dashboard
    ↓
┌──────────────────────────────┐
│ AdminMenuManager Component   │
├──────────────────────────────┤
│ 1. Render all curries        │
│    from curries table        │
│    with checkboxes           │
│                              │
│ 2. Admin checks/unchecks     │
│    which ones to show        │
│    → Updates local state     │
│                              │
│ 3. Click "Update Menu"       │
│    ↓                         │
│    UPDATE settings table     │
│    SET selected_curries =    │
│    [curry_id_1, curry_id_2]  │
│    ↓                         │
│    ✓ "Menu Updated"          │
│                              │
└──────────────────────────────┘
    ↓ (Realtime Update)
┌──────────────────────────────┐
│  ALL Users Simultaneously:   │
│                              │
│ useSelectedCurries() hook    │
│ receives change event        │
│   ↓                          │
│   Fetches new curries        │
│   ↓                          │
│ MenuDisplay re-renders       │
│ with new curries             │
│   ↓                          │
│ ⚡ INSTANT MENU UPDATE ⚡    │
└──────────────────────────────┘
```

---

## Admin Settings Flow

```
Admin Portal
    ↓
┌──────────────────────────────┐
│ AdminSettingsPanel Component │
├──────────────────────────────┤
│ From settings table:         │
│                              │
│ Toggle Special Day:          │
│  ☐ Special Biryani Day      │
│ Toggle Canteen Closed:       │
│  ☐ Canteen Closed           │
│ Input Extra Plates:          │
│  [5] number field            │
│                              │
│ Click "Save Settings"        │
│   ↓                          │
│   UPDATE settings table:     │
│   - special_day: bool        │
│   - canteen_closed: bool     │
│   - extra_plates_available   │
│   ↓                          │
│   ✓ "Settings Updated"       │
└──────────────────────────────┘
    ↓ (Realtime Update)
┌──────────────────────────────┐
│   All Pages See Changes:     │
│                              │
│ MenuDisplay:                 │
│   ├─ Shows special day       │
│   │  banner if true ✓        │
│   └─ Shows extra plates      │
│                              │
│ OrderForm:                   │
│   └─ Hides if canteen        │
│      closed = true ✓         │
│                              │
│ ⚡ INSTANT SITE-WIDE UPDATE ⚡│
└──────────────────────────────┘
```

---

## Admin Order Tracking Flow

```
Admin Dashboard
    ↓
┌──────────────────────────────────┐
│ OrdersManagementTable Component  │
├──────────────────────────────────┤
│ useAllOrders() hook:             │
│   ↓                              │
│   SELECT * FROM orders           │
│   WHERE date = TODAY             │
│   JOIN users                     │
│   ↓                              │
│ Render Table:                    │
│  ┌─────────────────────┐         │
│  │ S.No │ Name│Phone│   │        │
│  │  1   │Ram │9999 │ 2 │        │
│  │  2   │Sita│8888 │ 1 │        │
│  └─────────────────────┘         │
│                                  │
│ Admin clicks row #1:             │
│   ↓                              │
│   Hotspot for pickup status      │
│   Toggle picked_up = TRUE        │
│   ↓                              │
│   UPDATE orders table            │
│   WHERE id = order_id            │
│   SET picked_up = true           │
│   ↓                              │
│ Row turns GREEN ✓                │
│                                  │
│ Notes:                           │
│ - BEFORE cutoff: All rows white  │
│ - AFTER cutoff:                  │
│   └─ Picked up rows: GREEN ✓    │
│   └─ Pending rows: RED (waiting) │
└──────────────────────────────────┘
```

---

## Real-Time Update Architecture

```
Database Change
      ↓
┌─────────────────────────┐
│ PostgreSQL Triggers     │
│ (Built-in)              │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Supabase Realtime       │
│ Change Detection        │
└────────────┬────────────┘
             ↓
  ┌──────────┴──────────┐
  ↓                     ↓
User A               User B
(Admin)              (User)
  ↓                     ↓
┌──────────────┐  ┌──────────────┐
│ useAllOrders │  │useSelectedCur │
│   .subscribe()  │ ries.subscribe│
│     ↓           │     ↓         │
│ Receives event  │ Receives event│
│     ↓           │     ↓         │
│ Re-fetches data │ Re-fetches   │
│     ↓           │     ↓         │
│ Component       │ Component     │
│ re-renders      │ re-renders    │
│     ↓           │     ↓         │
│  Screen         │  Screen       │
│  Updates        │  Updates      │
│  Instantly ✨   │  Instantly ✨ │
└──────────────┘  └──────────────┘
   (< 100ms)         (< 100ms)
```

---

## Data Flow: Place Order to Pickup

```
Timeline:
─────────────────────────────────────────

11:50 AM
└─ Order Placed
   ├─ User fills form (qty: 2)
   ├─ Clicks "Place Order"
   └─ ORDER INSERTED
      ├─ id: uuid
      ├─ user_id: user uuid
      ├─ quantity: 2
      ├─ date: 2026-02-05
      ├─ status: pending
      ├─ picked_up: FALSE
      └─ ✓ Success message

11:55 AM
└─ Admin Sees Order
   ├─ Admin opens /admin
   ├─ OrdersManagementTable hooks into DB
   ├─ Sees: "Ram | 9999 | 2 plates | ⏳ Pending"
   └─ Ready to confirm

12:15 PM (After Cutoff)
└─ Admin Marks Pickup
   ├─ Admin clicks row for Ram
   ├─ Updates: picked_up = TRUE
   ├─ Database updated
   └─ Row turns GREEN ✓

12:15 PM
└─ User Sees Status
   ├─ User refreshes page
   ├─ Or sees live update
   ├─ Status shows: "Picked Up ✓"
   └─ Perfect!
```

---

## Security: RLS Policies

```
When User requests data:
    ↓
┌────────────────────────┐
│ Request arrives with   │
│ JWT token in header    │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│ Supabase extracts:     │
│ - user_id from JWT     │
│ - is_admin from users  │
│  table                 │
└────────┬───────────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
 ADMIN      REGULAR USER
   ↓            ↓
 ✓ Read all   ✓ Read own
 ✓ Delete     ✗ Read others
 ✓ Modify     ✗ Modify others
   ↓            ↓
ALLOWED ✓    DENIED ✗
   ↓            ↓
 Full data   Empty response
```

---

## Component Hierarchy

```
App.tsx (Router)
├─ Header
│  └─ useAuth() hook
│     ├─ Shows user email
│     └─ Admin button (conditional)
│
├─ Routes
│  ├─ /login
│  │  └─ SignUp.tsx / Login.tsx
│  │
│  ├─ / (UserHome)
│  │  ├─ ProtectedRoute
│  │  │  └─ MenuDisplay.tsx
│  │  │     └─ useSelectedCurries() hook
│  │  │
│  │  └─ OrderForm.tsx
│  │     └─ useUserOrders() hook
│  │
│  └─ /admin (AdminDashboard)
│     ├─ ProtectedRoute (admin required)
│     │
│     ├─ MenuDisplay.tsx
│     │  └─ useSelectedCurries() hook
│     │
│     ├─ AdminMenuManager.tsx
│     │  └─ Fetches curries
│     │
│     ├─ AdminSettingsPanel.tsx
│     │  └─ useSettings() hook
│     │
│     └─ OrdersManagementTable.tsx
│        └─ useAllOrders() hook
```

---

## Database Relationships

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │◄────────────┐
│ name         │             │
│ phone        │             │
│ email        │             │
│ is_admin     │             │
└──────────────┘             │
      ▲                       │
      │                       │
      │                    ┌──────────────┐
      │                    │    orders    │
      │                    ├──────────────┤
      │                    │ id (PK)      │
      │                    │ user_id (FK) │■── Foreign Key
      │                    │ quantity     │
      │                    │ date         │
      │                    │ status       │
      │                    │ picked_up    │
      │                    └──────────────┘
      │
      │
    ┌─┴──────────────────────┐
    │                        │
┌──────────────┐      ┌──────────────┐
│  curries     │      │  settings    │
├──────────────┤      ├──────────────┤
│ id (PK)      │      │ id (PK=1)    │
│ title        │      │ selected_    │
│ image_url    │      │   curries[]  │■── Array of curry IDs
│              │      │ special_day  │
│              │      │ canteen_     │
│              │      │   closed     │
│              │      │ extra_plates │
│              │      │ cutoff_time  │
└──────────────┘      └──────────────┘
```

---

## API Call Timeline

```
User loads app: http://localhost:5173
           ↓
┌──────────────────────────────────────┐
│ Browser request: GET /               │
│ Vite serves index.html               │
│ Load React + TypeScript bundle       │
└──────────┬───────────────────────────┘
           ↓ (JavaScript runs)
┌──────────────────────────────────────┐
│ App.tsx mounts                       │
│   ↓                                  │
│ useAuth() hook fires                 │
│   ├─ GET /auth/session (to server)   │
│   └─ Returns current user or null    │
└──────────┬───────────────────────────┘
           ↓
    ┌──────┴────────┐
    ↓               ↓
Not logged in    Logged in
    ↓               ↓
  /login    (Conditional Routes)
page        ├─ ProtectedRoute
            │   └─ useSelectedCurries()
            │       └─ SELECT curries
            │
            └─ OrderForm
                └─ useUserOrders()
                    └─ SELECT orders

Realtime subscriptions active:
  └─ Listen for changes to:
    ├─ curries table
    ├─ orders table
    ├─ settings table
```

---

## Error Handling Flow

```
User Action
    ↓
Try {
  Validate input
    ↓
  Make API call to Supabase
    ↓
  Success?
    ↓ YES
  Show success message
  Update UI
}
Catch (err) {
    ↓ NO
  Extract error message:
    ├─ Network error → "No internet"
    ├─ Auth error → "Invalid email"
    ├─ RLS error → "Permission denied"
    ├─ Validation → "Required field"
    └─ Database → "Something went wrong"
    ↓
  Display error notice
  User can retry
}
Finally {
  Hide loading spinner
  Re-enable form
}
```

---

**These diagrams show the complete flow of data, authentication, and real-time updates in the IIMR Canteen system!**
