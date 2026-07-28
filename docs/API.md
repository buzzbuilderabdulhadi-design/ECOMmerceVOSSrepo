# VOSS - API DOCUMENTATION

Version: 1.0

---

# PURPOSE

This document defines every REST API endpoint required for the VOSS MERN eCommerce platform.

The API must be:

- RESTful
- Secure
- Scalable
- Well documented
- Production Ready
- Consistent

All responses should return proper HTTP status codes.

Every endpoint should validate incoming data.

Never trust client-side validation.

---

# API BASE URL

/api/v1

Example:

/api/v1/products

---

# RESPONSE FORMAT

Success

{
    success: true,
    message: "",
    data: {}
}

Failure

{
    success: false,
    message: "",
    errors: []
}

---

# HTTP STATUS CODES

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# AUTHENTICATION

POST

/auth/register

Register new customer

------------------------------------------------

POST

/auth/login

Customer login

------------------------------------------------

POST

/auth/google

Google Login

------------------------------------------------

POST

/auth/logout

Logout

------------------------------------------------

POST

/auth/forgot-password

------------------------------------------------

POST

/auth/reset-password

------------------------------------------------

GET

/auth/profile

------------------------------------------------

PUT

/auth/profile

Update profile

------------------------------------------------

PUT

/auth/change-password

------------------------------------------------

DELETE

/auth/account

Delete account

------------------------------------------------

GET

/auth/verify-email

------------------------------------------------

POST

/auth/resend-verification

---

# PRODUCTS

GET

/products

Get all products

------------------------------------------------

GET

/products/:id

------------------------------------------------

GET

/products/slug/:slug

------------------------------------------------

POST

/products

Admin only

------------------------------------------------

PUT

/products/:id

Admin only

------------------------------------------------

DELETE

/products/:id

Admin only

------------------------------------------------

PATCH

/products/:id/stock

------------------------------------------------

PATCH

/products/:id/feature

------------------------------------------------

PATCH

/products/:id/bestseller

------------------------------------------------

PATCH

/products/:id/new

------------------------------------------------

GET

/products/search

------------------------------------------------

GET

/products/filter

------------------------------------------------

GET

/products/recommended

------------------------------------------------

GET

/products/trending

------------------------------------------------

GET

/products/latest

------------------------------------------------

GET

/products/bestsellers

---

# CATEGORIES

GET

/categories

------------------------------------------------

GET

/categories/:slug

------------------------------------------------

POST

/categories

Admin

------------------------------------------------

PUT

/categories/:id

------------------------------------------------

DELETE

/categories/:id

------------------------------------------------

PATCH

/categories/order

---

# CART

GET

/cart

------------------------------------------------

POST

/cart

Add Product

------------------------------------------------

PUT

/cart/:id

Update Quantity

------------------------------------------------

DELETE

/cart/:id

Remove Product

------------------------------------------------

DELETE

/cart

Clear Cart

------------------------------------------------

POST

/cart/save-for-later

------------------------------------------------

POST

/cart/move-to-wishlist

------------------------------------------------

POST

/cart/apply-coupon

---

# WISHLIST

GET

/wishlist

------------------------------------------------

POST

/wishlist

------------------------------------------------

DELETE

/wishlist/:id

------------------------------------------------

POST

/wishlist/move-to-cart

---

# CHECKOUT

POST

/checkout

------------------------------------------------

GET

/checkout/shipping

------------------------------------------------

POST

/checkout/coupon

------------------------------------------------

POST

/checkout/payment

---

# ORDERS

GET

/orders

------------------------------------------------

GET

/orders/:id

------------------------------------------------

POST

/orders

------------------------------------------------

PATCH

/orders/:id/status

Admin

------------------------------------------------

PATCH

/orders/:id/cancel

------------------------------------------------

PATCH

/orders/:id/refund

------------------------------------------------

GET

/orders/history

------------------------------------------------

GET

/orders/track/:trackingNumber

---

# REVIEWS

GET

/reviews/:productId

------------------------------------------------

POST

/reviews

------------------------------------------------

PUT

/reviews/:id

------------------------------------------------

DELETE

/reviews/:id

------------------------------------------------

PATCH

/reviews/:id/helpful

---

# COUPONS

GET

/coupons

Admin

------------------------------------------------

POST

/coupons

------------------------------------------------

PUT

/coupons/:id

------------------------------------------------

DELETE

/coupons/:id

------------------------------------------------

POST

/coupons/validate

---

# HOMEPAGE

GET

/homepage

------------------------------------------------

PUT

/homepage

Admin

------------------------------------------------

PATCH

/homepage/hero

------------------------------------------------

PATCH

/homepage/banner

------------------------------------------------

PATCH

/homepage/testimonials

---

# USERS

GET

/users

Admin

------------------------------------------------

GET

/users/:id

------------------------------------------------

PUT

/users/:id

------------------------------------------------

DELETE

/users/:id

------------------------------------------------

PATCH

/users/:id/status

------------------------------------------------

PATCH

/users/:id/role

---

# NOTIFICATIONS

GET

/notifications

------------------------------------------------

PATCH

/notifications/read

------------------------------------------------

DELETE

/notifications/:id

---

# SHIPPING

GET

/shipping

------------------------------------------------

POST

/shipping

Admin

------------------------------------------------

PUT

/shipping/:id

------------------------------------------------

DELETE

/shipping/:id

---

# PAYMENTS

GET

/payments

Admin

------------------------------------------------

POST

/payments

------------------------------------------------

GET

/payments/:id

------------------------------------------------

PATCH

/payments/refund

---

# MEDIA

POST

/media/upload

------------------------------------------------

DELETE

/media/:id

------------------------------------------------

GET

/media

---

# SEO

GET

/seo

------------------------------------------------

PUT

/seo

Admin

---

# SETTINGS

GET

/settings

------------------------------------------------

PUT

/settings

Admin

---

# ANALYTICS

GET

/analytics/dashboard

------------------------------------------------

GET

/analytics/revenue

------------------------------------------------

GET

/analytics/orders

------------------------------------------------

GET

/analytics/products

------------------------------------------------

GET

/analytics/customers

---

# SEARCH

GET

/search

Global Search

Search:

Products

Categories

Orders

Customers

Coupons

Reviews

---

# SECURITY

Every protected route must require JWT authentication.

Role-based authorization is required.

Only Administrators may access admin routes.

Validate every request.

Sanitize every input.

Rate limit authentication endpoints.

Log important security events.

---

# VALIDATION

Every endpoint should:

Validate Body

Validate Params

Validate Query

Return meaningful error messages

Prevent invalid data from entering the database.

---

# PAGINATION

Support:

page

limit

sort

search

filters

Return:

Current Page

Total Pages

Total Results

Next Page

Previous Page

---

# FINAL GOAL

The VOSS API should be consistent, secure, scalable, and easy to extend.

It should serve as the foundation for a production-ready MERN eCommerce platform capable of supporting future features without major redesign.