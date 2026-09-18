# ZOYA GOODS - PROJECT CONFIGURATION

Version: 1.0

---

# PURPOSE

This document defines the configuration standards for the ZOYA GOODS MERN eCommerce platform.

Every configuration should be secure, scalable, production-ready, and easy to maintain.

Never hardcode sensitive values.

Always use environment variables.

---

# PROJECT STRUCTURE

Root

/client

/server

/docs

/reference

README.md

.gitignore

---

# FRONTEND

Framework:

React

Bundler:

Vite

Language:

JavaScript

Styling:

Tailwind CSS

Routing:

React Router DOM

HTTP Client:

Axios

Animation:

Framer Motion

Icons:

React Icons

Forms:

React Hook Form

Notifications:

React Hot Toast

SEO:

React Helmet Async

State Management:

Context API

---

# BACKEND

Runtime:

Node.js

Framework:

Express.js

Database:

MongoDB Atlas

ODM:

Mongoose

Authentication:

JWT

Password Hashing:

bcrypt

Validation:

Express Validator

Uploads:

Multer

Cloudinary

Logging:

Morgan

Compression:

compression

Security:

Helmet

CORS

Rate Limiting

Cookie Parser

dotenv

---

# DATABASE

MongoDB Atlas

Use Mongoose.

Connection pooling.

Automatic reconnect.

Indexes enabled.

Timestamps enabled.

Validation enabled.

---

# ENVIRONMENT VARIABLES

Backend

PORT

NODE_ENV

MONGODB_URI

JWT_SECRET

JWT_EXPIRES_IN

CLIENT_URL

CLOUDINARY_NAME

CLOUDINARY_API_KEY

CLOUDINARY_API_SECRET

EMAIL_SERVICE

EMAIL_USER

EMAIL_PASSWORD

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

---

Frontend

VITE_API_URL

VITE_APP_NAME

VITE_CLOUDINARY_NAME

---

# PACKAGE MANAGEMENT

Use npm.

Keep dependencies updated.

Remove unused packages.

Avoid unnecessary dependencies.

---

# GIT

Use Git.

Use GitHub.

Never commit:

node_modules

.env

dist

build

logs

coverage

uploads

---

# ESLINT

Enable ESLint.

Fix warnings.

Avoid disabling rules unless necessary.

---

# PRETTIER

Use consistent formatting.

Single quotes.

Semicolons.

Consistent indentation.

---

# PATH ALIASES

Frontend

@

→ src

Example:

@/components

@/pages

@/hooks

@/services

---

Backend

Use clean relative imports.

Keep folder structure organized.

---

# API CONFIGURATION

Base URL

/api/v1

Centralize Axios configuration.

Use interceptors.

Automatically attach JWT tokens.

Handle expired tokens gracefully.

---

# IMAGE CONFIGURATION

Allowed Formats

jpg

jpeg

png

webp

avif

Maximum Size

5 MB

Automatically optimize images.

Generate responsive versions.

Store images in Cloudinary.

---

# SECURITY CONFIGURATION

Helmet

Rate Limiter

Input Validation

Sanitization

JWT

Password Hashing

Secure Cookies

Environment Variables

Protected Admin Routes

---

# PERFORMANCE CONFIGURATION

Enable Compression.

Enable Lazy Loading.

Optimize Images.

Code Splitting.

Tree Shaking.

Database Indexes.

Pagination.

Caching (Future Ready).

---

# ERROR HANDLING

Global Error Handler.

404 Handler.

Validation Errors.

Authentication Errors.

Database Errors.

Graceful Failure.

---

# LOGGING

Development

Detailed logs.

Production

Minimal logs.

Never log passwords or secrets.

---

# BUILD CONFIGURATION

Frontend

Generate optimized production build.

Backend

Run production server.

Validate environment variables before startup.

---

# DEPLOYMENT

Frontend

Vercel (Recommended)

Backend

Render (Recommended)

Database

MongoDB Atlas

Images

Cloudinary

---

# TESTING

Verify:

Frontend starts successfully.

Backend starts successfully.

Database connects.

API responds.

Authentication works.

Admin panel works.

Images upload correctly.

No console errors.

---

# FINAL GOAL

The project configuration should be clean, secure, scalable, and production-ready.

A new developer should be able to clone the repository, install dependencies, configure the environment variables, and run the entire ZOYA GOODS platform with minimal setup.