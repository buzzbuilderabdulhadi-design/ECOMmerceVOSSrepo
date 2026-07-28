# VOSS - PROJECT RULES

Version: 1.0

---

# PURPOSE

This document defines the mandatory development rules for the VOSS MERN eCommerce platform.

These rules are NON-NEGOTIABLE.

Every decision made throughout development must follow these rules.

Never ignore these rules.

Never replace these rules with shortcuts.

If a better engineering solution exists, explain it before implementing it.

---

# GENERAL RULES

- Think before writing code.
- Build like a senior software engineer.
- Never rush implementation.
- Always prioritize quality over speed.
- Build production-ready code only.
- Never write tutorial-level or demo code.
- Never generate placeholder code unless explicitly requested.
- Every feature must be fully functional.
- Never leave TODOs for core functionality.
- Never use quick fixes when a scalable solution exists.

---

# TECHNOLOGY RULES

Use ONLY:

- React
- Vite
- JavaScript
- Tailwind CSS
- Framer Motion
- React Router
- Node.js
- Express.js
- MongoDB
- Mongoose

Do NOT use:

- Next.js
- TypeScript
- Bootstrap
- Material UI
- Chakra UI
- jQuery
- PHP
- Laravel
- WordPress
- Any CMS
- Any page builder

The project must remain a pure MERN Stack application.

---

# CODE QUALITY

Every file must contain comments.

Every component must be documented.

Every function should have meaningful names.

Use clean code principles.

Avoid unnecessary complexity.

Avoid duplicate code.

Keep files modular.

Follow reusable architecture.

Use meaningful folder names.

Never create giant files.

Separate logic properly.

---

# COMPONENT RULES

Always create reusable React components.

Never duplicate components.

If a component already exists, reuse it.

Every component should have a single responsibility.

Keep components modular and maintainable.

---

# FOLDER STRUCTURE

Create every required folder automatically.

Create every required file automatically.

Do not wait for manual folder creation.

Organize everything professionally.

---

# RESPONSIVE DESIGN

Every page must work perfectly on:

- Desktop
- Laptop
- Tablet
- Mobile

No layout breaking.

No overflow.

No overlapping elements.

No inconsistent spacing.

---

# USER EXPERIENCE

The website must feel premium.

The interface should be elegant.

Navigation should be intuitive.

Everything should be easy to use.

Users should never feel confused.

Reduce unnecessary clicks.

Make shopping simple and enjoyable.

---

# DESIGN QUALITY

The website must NOT look like:

- A template
- A beginner project
- A generic AI-generated website

It should feel like an international luxury fashion brand.

Every detail should feel intentional.

---

# ANIMATIONS

Animations must improve the user experience.

Use smooth transitions.

Use elegant hover effects.

Use subtle micro-interactions.

Use premium page transitions.

Use scroll reveal animations.

Use loading animations.

Use image hover effects.

Use button animations.

Use smooth menu animations.

Use cart animations.

Use sidebar animations.

Use modal animations.

Animations should be smooth and professional.

Do NOT overuse flashy effects.

Performance must remain excellent.

---

# SHOPPING CART

The cart is one of the most important parts of the website.

It must provide a premium shopping experience.

Required features include:

- Product image
- Product name
- Product SKU
- Product category
- Selected size
- Selected color
- Material
- Quantity selector
- Manual quantity input
- Live arithmetic calculations
- Subtotal
- Discount
- Coupon support
- Shipping cost
- Free shipping support
- Country-based shipping
- Estimated delivery
- Tax calculation
- Grand total
- Remove item
- Save for later
- Wishlist integration
- Low stock warning
- Recently viewed products
- Recommended products
- Sticky checkout summary
- Responsive layout
- Smooth animations

All calculations must update instantly.

No page refresh should be required.

---

# PRODUCTS

Every product should support:

- Multiple images
- Multiple colors
- Multiple sizes
- Multiple materials
- Stock quantity
- Low stock warning
- Sale price
- Regular price
- SKU
- Category
- Subcategory
- Description
- Specifications
- Rating
- Reviews
- Related products

---

# SEARCH

Search should be fast.

Support:

- Product name
- SKU
- Category
- Material
- Size
- Color

Provide live search suggestions.

Support filters.

Support sorting.

Support pagination.

---

# ADMIN PANEL

The Admin Panel must be inspired by:

- Shopify
- WooCommerce
- WordPress

It should be modern, clean, intuitive, and responsive.

Only administrators may access it.

The public must never see admin pages.

Admin features include:

- Dashboard
- Homepage editor
- Product management
- Category management
- Inventory
- Low stock alerts
- Orders
- Customers
- Reviews
- Coupons
- Shipping management
- Payment settings
- SEO management
- Analytics
- Reports
- Media library
- Settings
- User management

Everything should be editable from the admin panel whenever practical.

---

# BACKEND

The backend must be fully functional.

No fake APIs.

No placeholder endpoints.

No incomplete CRUD operations.

Implement:

- Authentication
- Authorization
- Product management
- Orders
- Reviews
- Cart
- Wishlist
- Coupons
- Inventory
- Search
- Shipping
- Notifications

---

# DATABASE

Design MongoDB professionally.

Use proper collections.

Use indexes where appropriate.

Use validation.

Avoid duplicate data.

Design for scalability.

---

# SECURITY

Protect all sensitive routes.

Validate all input.

Hash passwords securely.

Use JWT authentication.

Protect against common web vulnerabilities.

Never expose secrets.

Never trust client-side validation alone.

---

# SEO

Every page must follow SEO best practices.

Include proper:

- Meta titles
- Meta descriptions
- Open Graph tags
- Structured headings
- Semantic HTML

---

# PERFORMANCE

Optimize performance.

Lazy load where appropriate.

Optimize images.

Reduce unnecessary renders.

Keep bundle size reasonable.

Maintain smooth animations without sacrificing speed.

---

# COMMENTS

Every file should contain professional comments.

Separate sections clearly.

Example:

=========================================
Imports
=========================================

=========================================
State
=========================================

=========================================
Functions
=========================================

=========================================
JSX
=========================================

---

# FINAL RULE

Whenever multiple valid implementations exist, always choose the solution that is:

- More scalable
- More secure
- More maintainable
- Easier to extend
- Better for long-term development

Never choose the easiest solution if it compromises quality.

Build VOSS as if it were a premium international fashion brand used by thousands of customers every day.