# ZOYA GOODS - BACKEND ARCHITECTURE

Version: 1.0

---

# PURPOSE

This document defines the complete backend architecture for the ZOYA GOODS MERN eCommerce platform.

The backend must be modular, scalable, secure, production-ready, and easy to maintain.

Never place everything inside a few files.

Separate every responsibility properly.

---

# TECHNOLOGY STACK

Node.js

Express.js

MongoDB

Mongoose

JWT Authentication

bcrypt

Multer

Cloudinary (Future Ready)

Express Validator

dotenv

Morgan

Cors

Cookie Parser

Helmet

Compression

Express Rate Limit

---

# SERVER FOLDER STRUCTURE

server/

├── src/
│
├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── services/
│
├── utils/
│
├── validations/
│
├── constants/
│
├── helpers/
│
├── database/
│
├── uploads/
│
├── logs/
│
├── app.js
│
└── server.js

---

# CONFIG

Contains:

Database Connection

Environment Variables

JWT Configuration

CORS

Security

Application Config

---

# MODELS

Create separate Mongoose models for:

User

Product

Category

Order

Review

Wishlist

Cart

Coupon

Notification

Address

Payment

Shipping

Settings

Homepage

Banner

SEO

---

# CONTROLLERS

Create controllers for:

Authentication

Products

Categories

Orders

Checkout

Cart

Wishlist

Reviews

Coupons

Users

Homepage

Settings

Shipping

Notifications

Payments

Media

SEO

Analytics

Controllers should ONLY contain request handling logic.

Business logic belongs inside Services.

---

# SERVICES

Contains business logic.

Example:

OrderService

ProductService

CartService

CouponService

ReviewService

AuthenticationService

ShippingService

PaymentService

NotificationService

SEOService

---

# ROUTES

Separate routes.

Never place all routes inside one file.

Example:

auth.routes.js

product.routes.js

category.routes.js

cart.routes.js

wishlist.routes.js

order.routes.js

review.routes.js

coupon.routes.js

homepage.routes.js

settings.routes.js

shipping.routes.js

payment.routes.js

seo.routes.js

admin.routes.js

---

# MIDDLEWARE

Authentication

Authorization

Error Handler

JWT Verification

Role Verification

Upload Middleware

Validation Middleware

Logging

Rate Limiter

Security Middleware

404 Handler

---

# VALIDATION

Validate:

Body

Params

Query

Files

Never trust frontend validation.

---

# ERROR HANDLING

Create centralized error handling.

Return:

Success

Message

Status Code

Error Details

Never expose internal server information.

---

# DATABASE

Use Mongoose.

Create indexes.

Use timestamps.

Use references properly.

Validate schemas.

---

# FILE UPLOADS

Support:

Product Images

Category Banners

Homepage Images

Logo

Future:

Videos

Store uploads separately.

---

# AUTHENTICATION

JWT

Refresh Tokens (Future Ready)

Password Hashing

Protected Routes

Role Based Authorization

---

# LOGGING

Log:

Errors

Warnings

Server Events

Authentication Events

Order Events

Future audit logs.

---

# API STRUCTURE

/api/v1/auth

/api/v1/products

/api/v1/categories

/api/v1/orders

/api/v1/cart

/api/v1/wishlist

/api/v1/reviews

/api/v1/coupons

/api/v1/users

/api/v1/homepage

/api/v1/settings

/api/v1/shipping

/api/v1/payments

/api/v1/media

/api/v1/seo

/api/v1/admin

---

# CODING RULES

Small functions.

Reusable code.

Professional comments.

Meaningful names.

Never duplicate logic.

Always separate concerns.

---

# PERFORMANCE

Pagination

Indexes

Aggregation

Lazy Loading

Compression

Caching (Future Ready)

Optimized Queries

---

# SECURITY

Helmet

Rate Limiting

JWT

Password Hashing

Input Validation

Sanitization

Environment Variables

Protected Routes

---

# FINAL GOAL

The backend should be scalable, secure, modular, production-ready, and easy to extend as the ZOYA GOODS platform grows.