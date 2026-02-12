# Components & Hooks API Reference

## Components

### Header
**File**: `src/components/Header.tsx`

Main application header with navigation and authentication.

**Features**:
- Shows user email
- Admin badge for admin users
- "Admin Panel" button (admin only)
- Logout button
- Responsive navigation

**Props**: None (uses hooks internally)

**Custom Hooks Used**:
- `useAuth()` - Gets user and admin status
- `authService.signOut()` - Logout

---

### ProtectedRoute
**File**: `src/components/ProtectedRoute.tsx`

Wrapper component to protect routes that require authentication.

**Props**:
```typescript
{
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';  // Optional role check
}
```

**Behavior**:
- If not logged in → redirects to `/login`
- If `requiredRole='admin'` and user not admin → redirects to `/`
- Otherwise renders children

**Example**:
```tsx
<ProtectedRoute>
  <UserHome />
</ProtectedRoute>

<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

---

### SignUp
**File**: `src/components/SignUp.tsx`

User registration form.

**State**:
```typescript
{
  name: string;
  phone: string;
  email: string;
  password: string;
}
```

**On Submit**:
1. Validates all fields
2. Password must be 6+ characters
3. Calls `authService.signUp()`
4. Creates auth user and user profile
5. Redirects to login

---

### Login
**File**: `src/components/Login.tsx`

User authentication form.

**State**:
```typescript
{
  email: string;
  password: string;
}
```

**On Submit**:
1. Calls `authService.signIn()`
2. Establishes session
3. Redirects to home page

---

### MenuDisplay
**File**: `src/components/MenuDisplay.tsx`

Shows today's selected curries with images.

**Custom Hooks**:
- `useSelectedCurries()` - Gets selected curry list
- `useSettings()` - Gets canteen status

**Features**:
- Displays curry cards in grid
- Shows canteen closed notice
- Shows special day banner
- Shows extra plates banner
- Fallback image if curry image fails

**Props**: None

---

### OrderForm
**File**: `src/components/OrderForm.tsx`

Allows users to place/cancel orders.

**Constants**:
- `CUTOFF_TIME = "12:00:00"` - adjustable

**State**:
```typescript
{
  quantity: number (1-3);
  isCutoffTime: boolean;
  hasOrderedToday: boolean;
}
```

**Features**:
- Place order (1-3 plates)
- View order status
- Cancel order (before cutoff)
- Shows cutoff time and current time
- Prevents orders after 12:00 PM

**Custom Hooks**:
- `useAuth()` - Current user
- `useUserOrders()` - User's today's orders
- `useSettings()` - Canteen status

---

### AdminMenuManager
**File**: `src/components/AdminMenuManager.tsx`

Admin interface to select which curries appear on menu.

**State**:
```typescript
{
  allCurries: Curry[];
  selectedCurries: UUID[];
}
```

**Functions**:
- `toggleCurry(curryId)` - Add/remove curry
- `handleSave()` - Save selection to `settings.selected_curries`

**Props**: None

---

### AdminSettingsPanel
**File**: `src/components/AdminSettingsPanel.tsx`

Admin controls for global settings.

**State**:
```typescript
{
  specialDay: boolean;
  canteenClosed: boolean;
  extraPlates: number;
}
```

**Updates `settings` table**:
- `special_day` - Toggle special day banner
- `canteen_closed` - Disable ordering
- `extra_plates_available` - Show plate count

**Props**: None

---

### OrdersManagementTable
**File**: `src/components/OrdersManagementTable.tsx`

Displays all today's orders for admins.

**Constants**:
- `CUTOFF_TIME = "12:00:00"` - adjustable

**Columns**:
- S.No (index)
- Name (from users)
- Phone (from users)
- Plates (quantity)
- Pickup Status (picked_up boolean)

**Interactivity**:
- Click row to toggle `picked_up` status
- Green row = picked up
- Red/yellow row = pending

**Custom Hooks**:
- `useAllOrders()` - All today's orders with user details

**Props**: None

---

## Custom Hooks

### useAuth
**File**: `src/hooks/useData.ts`

Returns current user and admin status.

**Returns**:
```typescript
{
  user: User | null;          // Supabase Auth user
  isAdmin: boolean;           // User is admin?
  loading: boolean;           // Still fetching?
}
```

**Auto-updates**:
- Subscribes to auth state changes
- Fetches user admin status from DB

**Example**:
```tsx
const { user, isAdmin, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <div>Not logged in</div>;

return <div>Welcome {user.email}</div>;
```

---

### useSettings
**File**: `src/hooks/useData.ts`

Gets global canteen settings.

**Returns**:
```typescript
{
  settings: {
    selected_curries: UUID[];
    special_day: boolean;
    canteen_closed: boolean;
    extra_plates_available: number;
    cutoff_time: string (HH:MM:SS);
    updated_at: timestamp;
  };
  loading: boolean;
}
```

**Real-time**: ✅ Updates when settings change (via Supabase Realtime)

**Example**:
```tsx
const { settings } = useSettings();

if (settings?.special_day) {
  return <div>🎉 Special Biryani Day!</div>;
}
```

---

### useSelectedCurries
**File**: `src/hooks/useData.ts`

Gets curries selected for today.

**Returns**:
```typescript
{
  curries: Curry[];  // Full curry details with images
  loading: boolean;
}
```

**Depends on**:
- `useSettings()` - Reads `selected_curries` array
- Fetches full curry data from `curries` table

**Real-time**: ✅ Updates when settings change

**Example**:
```tsx
const { curries } = useSelectedCurries();

return (
  <>
    {curries.map(c => (
      <div key={c.id}>
        <img src={c.image_url} alt={c.title} />
        <h3>{c.title}</h3>
      </div>
    ))}
  </>
);
```

---

### useUserOrders
**File**: `src/hooks/useData.ts`

Gets logged-in user's orders for today.

**Parameters**:
```typescript
userId: string | undefined  // User ID to fetch for
```

**Returns**:
```typescript
{
  orders: Order[];  // Today's orders only
  loading: boolean;
}
```

**Order shape**:
```typescript
{
  id: UUID;
  user_id: UUID;
  quantity: number;
  date: string (YYYY-MM-DD);
  status: 'pending' | 'confirmed' | 'cancelled';
  picked_up: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Real-time**: ✅ Auto-updates

**Example**:
```tsx
const { user } = useAuth();
const { orders } = useUserOrders(user?.id);

if (orders.length > 0) {
  return <div>You ordered {orders[0].quantity} plates</div>;
}
```

---

### useAllOrders
**File**: `src/hooks/useData.ts`

Gets ALL today's orders (admin only).

**Returns**:
```typescript
{
  orders: Array<{
    id: UUID;
    user_id: UUID;
    quantity: number;
    date: string;
    status: string;
    picked_up: boolean;
    users: {        // Joined user data
      name: string;
      phone: string;
    };
    created_at: timestamp;
    updated_at: timestamp;
  }>;
  loading: boolean;
}
```

**Real-time**: ✅ Auto-updates

**Usage**: Admin orders table

---

## Services

### authService
**File**: `src/services/authService.ts`

Authentication API wrapper.

**Methods**:

#### signUp(data)
```typescript
async signUp({
  email: string;
  password: string;
  name: string;
  phone: string;
}): Promise<AuthData>
```

Creates user account and profile.

#### signIn(data)
```typescript
async signIn({
  email: string;
  password: string;
}): Promise<AuthData>
```

Authenticates user.

#### signOut()
```typescript
async signOut(): Promise<void>
```

Clears session.

#### getCurrentUser()
```typescript
async getCurrentUser(): Promise<User | null>
```

Gets current auth user.

---

## Database

### Tables

#### users
```typescript
{
  id: UUID (primary key);
  name: TEXT;
  phone: TEXT;
  email: TEXT (unique);
  is_admin: BOOLEAN (default false);
  created_at: TIMESTAMP;
  updated_at: TIMESTAMP;
}
```

#### curries
```typescript
{
  id: UUID (primary key);
  title: TEXT (unique);
  image_url: TEXT;
  created_at: TIMESTAMP;
}
```

#### orders
```typescript
{
  id: UUID (primary key);
  user_id: UUID (foreign key);
  quantity: INT (1-3);
  date: DATE;
  status: TEXT ('pending'|'confirmed'|'cancelled');
  picked_up: BOOLEAN (default false);
  created_at: TIMESTAMP;
  updated_at: TIMESTAMP;
}
```

#### settings
```typescript
{
  id: INT (primary key, always 1);
  selected_curries: UUID[];
  special_day: BOOLEAN;
  canteen_closed: BOOLEAN;
  extra_plates_available: INT;
  cutoff_time: TIME (default 12:00:00);
  updated_at: TIMESTAMP;
}
```

---

## Utility Modules

### supabase.ts
**File**: `src/lib/supabase.ts`

Initializes Supabase client from environment variables.

**Exports**:
```typescript
export const supabase: SupabaseClient
```

**Usage**:
```typescript
import { supabase } from '../lib/supabase';

// Fetch
await supabase.from('curries').select('*');

// Subscribe to realtime
supabase.channel('orders').on('postgres_changes', ...).subscribe();
```

---

## Common Patterns

### Fetch Data with Realtime

```typescript
const [data, setData] = useState(null);

useEffect(() => {
  // Initial fetch
  const fetch = async () => {
    const { data } = await supabase.from('table').select('*');
    setData(data);
  };

  fetch();

  // Subscribe to changes
  const subscription = supabase
    .channel('table_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'table' },
      (payload) => setData(payload.new)
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### Protected Async Operation

```typography
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleAction = async () => {
  setLoading(true);
  setError('');

  try {
    // Do something
    await supabase.from('table').insert([...]);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Type Safety

All TypeScript types for Supabase are auto-generated:

```typescript
import type { 
  Tables,        // Table row types
  Enums,         // Enum types
} from '../lib/database.types';

// Usage
const user: Tables<'users'> = {...};
```

To generate types:
```bash
supabase gen types typescript --local
```

---

## Styling

### Global CSS Variables
**File**: `src/styles/global.css`

```css
--primary: #d4a574;
--primary-dark: #b89563;
--primary-light: #e8c4a0;
--secondary: #8b7355;
--accent: #f0ad4e;
--success: #28a745;
--danger: #dc3545;
--warning: #ffc107;
--background: #f9f7f4;
--card: #ffffff;
--text: #333333;
--text-light: #666666;
--border: #e0dbd8;
--shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
```

### Utility Classes

```html
<!-- Buttons -->
<button class="btn-primary">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-danger">Danger</button>

<!-- Forms -->
<div class="form-group">
  <label>Label</label>
  <input type="text" />
</div>

<!-- Cards -->
<div class="card">Content</div>

<!-- Notices -->
<div class="notice notice-success">Success</div>
<div class="notice notice-error">Error</div>
<div class="notice notice-warning">Warning</div>
<div class="notice notice-info">Info</div>

<!-- Badges -->
<span class="badge badge-success">Success</span>
<span class="badge badge-danger">Danger</span>

<!-- Grid -->
<div class="grid">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

Built with TypeScript & React 18 ✨
