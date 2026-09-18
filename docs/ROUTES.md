# ZOYA GOODS - ROUTES DOCUMENTATION

Version: 1.0

---

# PURPOSE

This document defines every frontend and backend route used in the ZOYA GOODS MERN eCommerce platform.

The routing system must be clean, scalable, secure, and easy to maintain.

Routes should follow RESTful principles.

Protected routes must require authentication.

Admin routes must require administrator privileges.

---

# FRONTEND ROUTES

/

Home Page

--------------------------------

/shop

Shop Page

--------------------------------

/products

All Products

--------------------------------

/product/:slug

Product Details

--------------------------------

/categories

All Categories

--------------------------------

/category/:slug

Single Category

--------------------------------

/search

Search Results

--------------------------------

/wishlist

Wishlist

Protected

--------------------------------

/cart

Shopping Cart

--------------------------------

/checkout

Checkout

Protected

--------------------------------

/order-success

Order Success

Protected

--------------------------------

/orders

My Orders

Protected

--------------------------------

/orders/:id

Order Details

Protected

--------------------------------

/login

Login

--------------------------------

/register

Register

--------------------------------

/forgot-password

Forgot Password

--------------------------------

/reset-password/:token

Reset Password

--------------------------------

/profile

User Profile

Protected

--------------------------------

/dashboard

User Dashboard

Protected

--------------------------------

/settings

Account Settings

Protected

--------------------------------

/about

About Us

--------------------------------

/contact

Contact

--------------------------------

/privacy-policy

Privacy Policy

--------------------------------

/terms

Terms & Conditions

--------------------------------

/shipping-policy

Shipping Policy

--------------------------------

/refund-policy

Refund Policy

--------------------------------

/404

Custom 404 Page

--------------------------------

*

Catch All Route

---

# ADMIN ROUTES

/admin

Dashboard

--------------------------------

/admin/products

Product Manager

--------------------------------

/admin/products/new

Create Product

--------------------------------

/admin/products/edit/:id

Edit Product

--------------------------------

/admin/categories

Category Manager

--------------------------------

/admin/orders

Orders Manager

--------------------------------

/admin/orders/:id

Order Details

--------------------------------

/admin/customers

Customers

--------------------------------

/admin/reviews

Reviews

--------------------------------

/admin/coupons

Coupons

--------------------------------

/admin/homepage

Homepage Editor

--------------------------------

/admin/media

Media Library

--------------------------------

/admin/analytics

Analytics Dashboard

--------------------------------

/admin/settings

Website Settings

--------------------------------

/admin/seo

SEO Manager

--------------------------------

/admin/profile

Administrator Profile

---

# API ROUTES

Base URL

/api/v1

---

# AUTH

POST /auth/register

POST /auth/login

POST /auth/logout

POST /auth/google

POST /auth/forgot-password

POST /auth/reset-password

GET /auth/profile

PUT /auth/profile

DELETE /auth/account

---

# PRODUCTS

GET /products

GET /products/:id

GET /products/slug/:slug

POST /products

PUT /products/:id

DELETE /products/:id

GET /products/search

GET /products/recommended

GET /products/latest

GET /products/bestsellers

---

# CATEGORIES

GET /categories

GET /categories/:slug

POST /categories

PUT /categories/:id

DELETE /categories/:id

---

# CART

GET /cart

POST /cart

PUT /cart/:id

DELETE /cart/:id

DELETE /cart

POST /cart/apply-coupon

POST /cart/save-for-later

---

# WISHLIST

GET /wishlist

POST /wishlist

DELETE /wishlist/:id

---

# ORDERS

GET /orders

GET /orders/:id

POST /orders

PATCH /orders/:id/status

PATCH /orders/:id/cancel

---

# REVIEWS

GET /reviews/:productId

POST /reviews

PUT /reviews/:id

DELETE /reviews/:id

---

# USERS

GET /users

GET /users/:id

PUT /users/:id

DELETE /users/:id

PATCH /users/:id/role

---

# COUPONS

GET /coupons

POST /coupons

PUT /coupons/:id

DELETE /coupons/:id

POST /coupons/validate

---

# PAYMENTS

POST /payments

GET /payments/:id

PATCH /payments/refund

---

# SHIPPING

GET /shipping

POST /shipping

PUT /shipping/:id

DELETE /shipping/:id

---

# MEDIA

POST /media/upload

DELETE /media/:id

GET /media

---

# HOMEPAGE

GET /homepage

PUT /homepage

PATCH /homepage/hero

PATCH /homepage/banner

PATCH /homepage/testimonials

---

# SETTINGS

GET /settings

PUT /settings

---

# ANALYTICS

GET /analytics/dashboard

GET /analytics/revenue

GET /analytics/orders

GET /analytics/products

GET /analytics/customers

---

# SEO

GET /seo

PUT /seo

---

# ROUTE PROTECTION

Public Routes

Anyone can access.

Protected Routes

Require login.

Admin Routes

Require administrator role.

Unauthorized users should be redirected to Login or Access Denied pages.

---

# ERROR ROUTES

404 Not Found

401 Unauthorized

403 Forbidden

500 Internal Server Error

Custom error pages should match the ZOYA GOODS design system.

---

# ROUTING RULES

Use React Router.

Use lazy loading for pages.

Use protected route wrappers.

Use admin route wrappers.

Use meaningful route names.

Avoid deeply nested routes.

Keep URLs clean and SEO-friendly.

---

# FINAL GOAL

The routing system should be clean, scalable, secure, and easy to extend as the ZOYA GOODS platform grows.

Every route should have a clear purpose, proper protection, and consistent naming.