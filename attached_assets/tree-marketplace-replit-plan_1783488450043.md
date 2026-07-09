# Tree Marketplace — 10-Step Replit Build Plan

**Stack:** Next.js (App Router) + Supabase (Postgres + Storage) + Clerk (Auth) + bKash (Payments)

## How to use this document

Each step below is a **complete prompt** — copy the text inside the box and paste it directly into Replit's AI Agent. Do them **in order**. Don't start Step 4 until Step 3 actually works. Each step ends with a "Verify" checklist — do those checks before moving on, or the agent will build on top of broken foundations and you'll spend hours untangling it later.

Two pieces of prep before Step 1:
1. Create a free [Supabase](https://supabase.com) project. Save your Project URL and API keys.
2. Create a free [Clerk](https://clerk.com) application. Save your publishable key and secret key.

---

## Step 1 — Project Scaffold + Database Schema (Core)

```
Create a Next.js 14 project using the App Router and TypeScript, styled with Tailwind CSS and shadcn/ui.

Connect it to Supabase using these env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. Put them in .env and create a lib/supabase.ts client file (one client-side, one server-side using the service role key).

Create these Postgres tables in Supabase via a SQL migration file:

- trees (id, common_name, scientific_name, family, native_region, description, climate, soil, water_requirement, sunlight, growth_rate, height, lifespan, flowering_season, fruiting_season, uses, category, created_at)
- tree_varieties (id, tree_id references trees, variety_name, description, origin, taste, fruit_size, tree_size, yield, disease_resistance, harvest_time, best_climate, advantages, disadvantages, created_at)
- tree_images (id, tree_id nullable, variety_id nullable, image_url, image_type e.g. 'leaf'/'flower'/'fruit'/'bark'/'mature_tree', created_at)
- categories (id, name, slug) — seed with: Fruit Trees, Forest Trees, Medicinal Trees, Flower Trees, Palm Trees, Bamboo, Indoor Trees, Evergreen Trees, Conifers, Mangrove, Shade Trees, Ornamental Trees, Timber Trees, Rare Species, Native Species
- tree_categories (tree_id, category_id) — many to many

Add indexes on common_name, scientific_name, and variety_name for search.

Seed the database with 5 real sample trees (e.g. Mango, Apple, Neem, Oak, Mahogany), each with 2-3 real varieties, so I have data to test with.

Build a homepage that lists all trees as cards (image, common name, scientific name, category) pulled live from Supabase.
```

**Verify before moving on:**
- [ ] Homepage loads and shows 5 tree cards with real data
- [ ] You can see the tables in Supabase's Table Editor with seeded rows
- [ ] No console errors in the browser

---

## Step 2 — Tree Encyclopedia & Variety Pages (Public)

```
Build the public tree encyclopedia pages:

1. /trees/[slug] — a full tree detail page showing every field from the trees table (description, climate, soil, water requirement, sunlight, growth rate, height, lifespan, flowering/fruiting season, uses), an image gallery pulling from tree_images filtered by image_type, and a list of all its varieties as clickable cards linking to their variety pages.

2. /trees/[slug]/[variety-slug] — a variety detail page showing every field from tree_varieties (origin, taste, fruit size, tree size, yield, disease resistance, harvest time, best climate, advantages, disadvantages) plus its own image gallery. Leave a placeholder section at the bottom titled "Available Sellers" — we'll wire this up in Step 5.

3. A global search bar in the header that live-searches trees and varieties by name as you type (autocomplete dropdown), querying Supabase.

4. A /categories page and /categories/[slug] page listing trees by category, with filter checkboxes for: Climate, Height, Growth Speed, Sunlight, Water Requirement, Evergreen/Deciduous, Indoor/Outdoor.

Use slugs (lowercase, hyphenated) for all tree and variety URLs — add a slug column to both tables if not already present and populate it from the seeded names.
```

**Verify before moving on:**
- [ ] Clicking a tree card goes to a working detail page
- [ ] Clicking a variety goes to a working variety page
- [ ] Search bar returns results as you type
- [ ] Category filter page shows filtered results

---

## Step 3 — Auth with Clerk (Buyer / Seller / Admin Roles)

```
Integrate Clerk authentication (@clerk/nextjs) into this Next.js app.

Set up env vars NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.

Wrap the app in ClerkProvider. Add Sign In / Sign Up pages at /sign-in and /sign-up using Clerk's prebuilt components.

Add a "role" field to each user using Clerk's publicMetadata, with possible values: "buyer" (default on signup), "seller", "admin".

Create a profiles table in Supabase (id, clerk_user_id, role, display_name, created_at) that syncs automatically via a Clerk webhook whenever a user signs up — set up the webhook route at /api/webhooks/clerk.

Build middleware.ts that protects routes:
- /seller/* requires role = "seller" or "admin"
- /admin/* requires role = "admin" only
- Everything else is public

Add a "Become a Seller" button on the user's profile menu that, when clicked, updates their role to "seller" in both Clerk metadata and the profiles table, then redirects to /seller/dashboard (we'll build that dashboard in Step 4).

Show the user's avatar/name in the header when logged in, with a dropdown for Profile, Dashboard (if seller/admin), and Sign Out.
```

**Verify before moving on:**
- [ ] Sign up and log in works
- [ ] New users appear in the profiles table with role "buyer"
- [ ] Clicking "Become a Seller" changes your role and redirects
- [ ] Visiting /admin while logged in as a buyer redirects you away

---

## Step 4 — Seller Dashboard: Add Listings

```
Build the seller dashboard at /seller/dashboard, protected for users with role "seller" or "admin".

Create a listings table in Supabase (id, seller_id references profiles, variety_id references tree_varieties, price, currency default 'BDT', quantity, unit e.g. 'per plant', location, delivery_available boolean, delivery_notes, status default 'pending', images array of urls, created_at).

Build /seller/dashboard/products/new — an "Add Product" flow:
1. Search existing trees (autocomplete against the trees table — seller cannot type a new tree name, only select an existing one)
2. Once a tree is selected, search/select an existing variety under that tree (same restriction — no duplicate creation)
3. If the seller believes a needed variety doesn't exist yet, show a "Request New Variety" button instead that submits a request to a variety_requests table (id, seller_id, tree_id, requested_variety_name, notes, status default 'pending') for admin review — do NOT let sellers create varieties directly
4. Upload 1-5 images to Supabase Storage (create a "listing-images" bucket)
5. Enter price, quantity, unit, location, delivery availability and notes
6. Submit — creates a row in listings with status "pending"

Build /seller/dashboard/products — a table of the seller's own listings showing status (pending/approved/rejected), price, quantity, with Edit and Delete actions. Sellers can edit their own listings only.

Build a simple /seller/dashboard home page showing counts: total listings, pending approval, approved, total views (just show 0 for views for now, we'll wire analytics later).
```

**Verify before moving on:**
- [ ] You can log in as a seller and add a full listing end to end
- [ ] Images actually upload and display
- [ ] The listing appears in Supabase with status "pending"
- [ ] Trying to add a variety that doesn't exist shows the request form, not a create form

---

## Step 5 — Marketplace: Buyer Side (Sellers on Variety Pages)

```
Wire up the "Available Sellers" section on the variety detail page (/trees/[slug]/[variety-slug]) built in Step 2.

Query the listings table filtered by variety_id and status = 'approved'. For each listing show: seller name/logo (from profiles), price, quantity available, location, delivery availability, and a "View Seller" button. Sort by price ascending by default, with a sort dropdown (Price, Distance if location available, Newest).

Build /sellers/[seller-id] — a public seller storefront page showing: seller name, logo/banner (add logo_url and banner_url columns to profiles), rating (placeholder 0 for now), all their approved listings as a grid, and contact button.

Build a cart system:
- Add a cart_items table (id, buyer_id, listing_id, quantity, created_at)
- "Add to Cart" button on each listing card (requires login — prompt sign in if not logged in)
- A /cart page listing all cart items grouped by seller, with quantity editors and a running total, and a "Proceed to Checkout" button (checkout itself comes in Step 8 with payments)

Add a simple star-rating review system: reviews table (id, buyer_id, target_type 'tree'/'variety'/'seller', target_id, rating 1-5, comment, created_at). Show average rating and a review list + "Write a Review" form on tree pages, variety pages, and seller pages — three separate review pools as specified.
```

**Verify before moving on:**
- [ ] A seller's approved listing appears on the correct variety page
- [ ] Add to cart works and the cart page shows correct totals
- [ ] You can leave a review and see it appear immediately
- [ ] Seller storefront page loads and shows only that seller's listings

---

## Step 6 — Courier API Integration (Seller Dashboard)

```
Add a courier integration feature to the seller dashboard so sellers can connect their own courier accounts and both sellers and buyers see real-time delivery tracking.

Create a courier_integrations table (id, seller_id references profiles, courier_name e.g. 'Pathao', 'Steadfast', 'RedX', 'Sundarban', api_key, api_secret, merchant_id, is_active boolean default true, created_at). Encrypt api_key and api_secret at rest using a simple symmetric encryption helper (store the encryption key in an env var COURIER_ENCRYPTION_KEY) — never return raw keys to the frontend once saved, only show a masked version like "••••1234".

Build /seller/dashboard/courier-settings:
- A form to add a courier integration: dropdown for courier name (Pathao, Steadfast, RedX, Sundarban Courier, Other), fields for API key, API secret/token, merchant ID
- A list of the seller's connected couriers with status (Active/Inactive), a "Test Connection" button that pings the courier's API to confirm the credentials work, and Remove button
- Sellers can connect multiple couriers and choose a default one

Add a shipments table (id, order_id, seller_id, courier_integration_id, courier_tracking_id, status e.g. 'pending'/'picked_up'/'in_transit'/'delivered'/'failed', last_updated, tracking_url).

Build a courier abstraction layer at lib/couriers/ with one adapter file per courier (e.g. lib/couriers/pathao.ts, lib/couriers/steadfast.ts) that each implement a shared interface: createShipment(), getTrackingStatus(), cancelShipment(). Use placeholder/mock API calls with clear TODO comments where real courier API endpoints and auth would go, since I'll need to fill in real courier API docs later — but make the interface fully wired to the UI so swapping in real API calls later is a one-file change per courier.

On the buyer's order detail page (build a basic /orders/[id] page if it doesn't exist yet, pulling from an orders table you create with id, buyer_id, seller_id, listing_id, quantity, total_price, status, created_at), show a live tracking widget that calls the seller's connected courier's getTrackingStatus() and displays: current status, last updated time, and a tracking link if the courier provides one.

On the seller dashboard order view, show the same tracking info plus a "Create Shipment" button that calls the connected courier's createShipment() when an order is ready to ship.
```

**Verify before moving on:**
- [ ] Seller can add courier credentials and see them masked after saving
- [ ] "Test Connection" button runs (even against the mock adapter) and shows a result
- [ ] Order detail page shows a tracking widget (even with mock data)
- [ ] Swapping the mock logic in one courier adapter file doesn't require touching the UI

---

## Step 7 — Admin Dashboard

```
Build the admin dashboard at /admin, protected for role = "admin" only.

/admin — overview with counts: total trees, total varieties, total sellers, pending listings, pending variety requests, total orders.

/admin/trees — full CRUD on the trees table (Add, Edit, Delete) with an image upload for the hero image and gallery images.

/admin/varieties — full CRUD on tree_varieties, plus a dedicated /admin/variety-requests page showing pending requests from variety_requests (built in Step 4) with Approve (creates the variety and notifies the seller) or Reject buttons.

/admin/listings — table of all listings with filters by status. Approve/Reject pending listings (approving sets status to 'approved' and makes it live on the variety page). Show a reason field for rejections.

/admin/sellers — table of all sellers (profiles where role = seller) with Verify/Suspend actions. Add a is_verified boolean and is_suspended boolean to profiles. Suspended sellers' listings should not show on public pages.

/admin/categories — CRUD on categories.

/admin/orders — table of all orders across the platform with status and basic filters.

Use a shared admin layout with a left sidebar nav linking all the above sections.
```

**Verify before moving on:**
- [ ] Approving a pending listing makes it appear on the public variety page
- [ ] Approving a variety request creates a real variety sellers can now select
- [ ] Suspending a seller hides their listings from buyers
- [ ] Non-admins cannot reach /admin at all

---

## Step 8 — bKash Payments & Checkout

```
Integrate bKash Merchant API for checkout.

Env vars: BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_BASE_URL (sandbox URL for now).

Build lib/bkash.ts with functions: getBkashToken() (grant token flow), createPayment(amount, orderId), executePayment(paymentId), queryPayment(paymentId).

Build the checkout flow:
1. /checkout — pulls items from the cart, groups by seller, shows order summary and total, "Pay with bKash" button
2. On click, call createPayment(), then redirect the user to the bKash payment URL returned
3. Build /api/bkash/callback to handle bKash's redirect back — call executePayment(), and on success create rows in the orders table (one order per seller in the cart) and clear those items from cart_items
4. /orders — buyer's order history list
5. Update /orders/[id] (from Step 6) to show payment status alongside shipment tracking

Add a payments table (id, order_id, bkash_payment_id, amount, status, created_at) to log every transaction.

Use the bKash sandbox/test credentials during development — clearly comment where the code would need production credentials swapped in.
```

**Verify before moving on:**
- [ ] Checkout redirects to bKash sandbox and completes a test payment
- [ ] A real order row is created only after successful payment
- [ ] Cart clears after successful checkout
- [ ] Order history shows the new order with correct status

---

## Step 9 — SEO, Performance & Loading States

```
Improve the app for SEO and performance:

1. Add dynamic metadata (generateMetadata) to every tree page and variety page using the tree/variety name and description — include Open Graph tags and a hero image.

2. Add JSON-LD structured data (Schema.org "Product" for varieties, "Organization" for sellers) to the relevant pages.

3. Generate an XML sitemap at /sitemap.xml that includes every tree, variety, category, and seller page dynamically from the database.

4. Add a robots.txt allowing all crawling of public pages and disallowing /admin, /seller, /cart, /checkout, /orders.

5. Add loading.tsx skeleton screens for the trees list, tree detail, variety detail, and seller dashboard pages that match their final layout shape (not just a spinner).

6. Add pagination or infinite scroll to the homepage tree list and the category listing pages instead of loading everything at once.

7. Ensure all images use Next.js <Image> component with proper width/height and lazy loading for anything below the fold.
```

**Verify before moving on:**
- [ ] View page source on a tree page shows proper title/description meta tags
- [ ] /sitemap.xml loads and lists real URLs
- [ ] Slow 3G throttling in devtools shows skeleton screens, not blank white pages
- [ ] Homepage doesn't load all trees at once if you have 50+ seeded

---

## Step 10 — Polish, Reviews Aggregation & Launch Checklist

```
Final polish pass:

1. Add average rating aggregation: show computed average star rating (from the reviews table) on tree cards, variety cards, and seller cards throughout the site, not just on detail pages.

2. Add a wishlist feature: wishlist_items table (id, buyer_id, listing_id, created_at), heart icon on listing cards, and a /wishlist page.

3. Add basic email notifications using Resend or a similar provider: order confirmation to buyer, new order alert to seller, listing approved/rejected notification to seller. Env var RESEND_API_KEY.

4. Add a /help and /faq static page.

5. Do a full responsive pass — check homepage, tree page, variety page, seller dashboard, and checkout on mobile widths (375px) and fix any broken layouts.

6. Add proper error boundaries (error.tsx) and a custom 404 page.

7. Double check that no API keys or secrets are exposed in client-side code — audit every file under app/ and components/ for any use of service role keys, bKash secrets, or courier API secrets outside of server-only files (API routes, server components, or lib files marked server-only).

8. Write a README.md summarizing the project structure, env vars needed, and how to run migrations, so I can hand this off or return to it later.
```

**Verify before launch:**
- [ ] Ratings show consistently across cards and detail pages
- [ ] Wishlist add/remove works
- [ ] Test emails actually arrive
- [ ] Mobile layout doesn't break anywhere in the main flows
- [ ] Secret audit passes — nothing sensitive in client bundles
- [ ] README is accurate enough that you could resume this in 3 months

---

## Notes for later (not in the 10 steps, add if/when needed)

- AI tree identification from photo, AI climate-based recommendations, AI variety comparison — genuinely later-stage features, build only once the core marketplace has real users
- Seller subscription tiers / featured listings / commission billing — add once you have enough sellers that monetization mechanics matter
- Voice search, image search — nice-to-haves, not core
- Multi-language (Bangla/English) — worth doing early if your seller base is Bangladesh-focused, ask Replit to add `next-intl` as a Step 6.5 if so
