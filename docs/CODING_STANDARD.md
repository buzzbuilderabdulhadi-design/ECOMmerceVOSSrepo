# VOSS - CODING STANDARDS

Version: 1.0

---

# PURPOSE

This document defines the coding standards that must be followed throughout the VOSS eCommerce project.

Every file, component, function, API, and database model must follow these standards.

Consistency is more important than personal preference.

---

# GENERAL RULES

Write clean code.

Write readable code.

Write reusable code.

Write maintainable code.

Never rush implementation.

Never generate placeholder code if a complete implementation is possible.

---

# FILE ORGANIZATION

One file should have one responsibility.

One React component per file.

One Express controller per resource.

One model per collection.

One service per business domain.

Never place unrelated code together.

---

# NAMING CONVENTIONS

React Components

PascalCase

Example:

ProductCard.jsx

UserDashboard.jsx

Navbar.jsx

--------------------------------

Functions

camelCase

Example:

getProducts()

createOrder()

calculateShipping()

--------------------------------

Variables

camelCase

Example:

userData

cartItems

totalPrice

--------------------------------

Constants

UPPER_SNAKE_CASE

Example:

MAX_PRODUCTS

JWT_SECRET

DEFAULT_LIMIT

--------------------------------

Database Models

PascalCase

User

Product

Category

Order

Review

--------------------------------

Folders

lowercase

Example:

components

pages

services

routes

controllers

---

# REACT RULES

Use functional components only.

Never use class components.

Use Hooks.

Keep components small.

Reuse components whenever possible.

Separate UI from business logic.

---

# EXPRESS RULES

Controllers only handle requests.

Business logic belongs inside Services.

Routes should remain clean.

Validation belongs in middleware.

Never query MongoDB directly inside routes.

---

# MONGODB RULES

Use Mongoose.

Use timestamps.

Validate schemas.

Use indexes.

Reference documents correctly.

Avoid duplicated data.

---

# API RULES

RESTful APIs only.

Consistent responses.

Proper HTTP status codes.

Meaningful error messages.

Never expose internal server errors.

---

# COMMENTS

Comment complex logic.

Avoid unnecessary comments.

Write self-explanatory code whenever possible.

---

# ERROR HANDLING

Use centralized error handling.

Handle every expected error.

Never crash the server.

Return useful messages.

---

# SECURITY

Validate every request.

Sanitize inputs.

Hash passwords.

Protect routes.

Never trust client-side validation.

Never expose secrets.

---

# PERFORMANCE

Avoid unnecessary re-renders.

Lazy load large pages.

Optimize images.

Optimize database queries.

Paginate large datasets.

Use memoization only when beneficial.

---

# RESPONSIVENESS

Every page must work on:

Desktop

Laptop

Tablet

Mobile

No horizontal scrolling.

No broken layouts.

---

# ACCESSIBILITY

Semantic HTML.

Keyboard navigation.

ARIA labels.

Readable contrast.

Visible focus states.

---

# GIT

Write meaningful commit messages.

Commit after every completed feature.

Never commit secrets.

Never commit node_modules.

---

# TESTING

Every new feature should be manually tested before moving to the next task.

Fix bugs immediately.

Do not leave known issues.

---

# CODE QUALITY

No duplicate code.

No unused imports.

No unused variables.

No console.log statements in production.

No commented-out dead code.

No hardcoded secrets.

---

# AI DEVELOPMENT RULES

Always think before generating code.

Prefer reusable solutions.

Prefer scalability.

Prefer maintainability.

If multiple implementations exist, choose the cleanest and most scalable.

Do not simplify functionality unless explicitly instructed.

---

# FINAL GOAL

The entire VOSS codebase should be clean, professional, scalable, production-ready, and easy for another developer to understand and maintain.