# ZOYA GOODS - DATABASE SPECIFICATION

Version: 1.0

---

# PURPOSE

This document defines the MongoDB database architecture for the ZOYA GOODS MERN eCommerce platform.

The database should be scalable, secure, optimized, and production-ready.

Design the database for long-term growth.

Avoid duplicate data whenever possible.

Use references where appropriate.

Use embedding only when beneficial.

---

# DATABASE

Database Name

voss_ecommerce

Use MongoDB Atlas for production.

Use Mongoose ODM.

Enable proper validation.

---

# COLLECTIONS

Create the following collections:

Users

Products

Categories

Orders

OrderItems

Cart

Wishlist

Reviews

Coupons

Addresses

Notifications

Settings

Homepage

Banners

FAQs

Testimonials

NewsletterSubscribers

ShippingMethods

Countries

Payments

ActivityLogs

Media

SEO

Sessions

RefreshTokens

---

# USERS COLLECTION

Store:

Full Name

Email

Phone Number

Password (Hashed)

Google ID

Role

Profile Picture

Status

Email Verified

Phone Verified

Wishlist

Recently Viewed

Addresses

Created At

Updated At

Last Login

---

# ROLES

Support:

Administrator

Customer

Single seller platform only.

---

# PRODUCTS COLLECTION

Store:

Product Name

Slug

SKU

Description

Short Description

Category Reference

Material

Available Colors

Available Sizes

Price

Sale Price

Discount

Stock

Low Stock Threshold

Images

Videos (Future Ready)

Rating

Review Count

Featured

Best Seller

New Arrival

Limited Edition

Published

SEO

Created At

Updated At

---

# CATEGORIES COLLECTION

Store:

Category Name

Slug

Description

Banner

Display Order

SEO

Status

Created At

Updated At

---

# ORDERS COLLECTION

Store:

Order Number

Customer

Products

Shipping Address

Billing Address

Shipping Method

Payment Method

Subtotal

Discount

Coupon

Shipping Cost

Tax

Grand Total

Order Status

Payment Status

Tracking Number

Estimated Delivery

Notes

Created At

Updated At

---

# ORDER STATUS

Pending

Confirmed

Processing

Packed

Shipped

Out For Delivery

Delivered

Cancelled

Returned

Refunded

---

# CART COLLECTION

Store:

Customer

Products

Quantity

Selected Color

Selected Size

Price Snapshot

Created At

Updated At

---

# WISHLIST COLLECTION

Store:

Customer

Products

Date Added

---

# REVIEWS COLLECTION

Store:

Customer

Product

Rating

Title

Review

Images

Verified Purchase

Helpful Votes

Created At

Updated At

---

# COUPONS COLLECTION

Store:

Coupon Code

Type

Percentage

Fixed Amount

Minimum Purchase

Maximum Discount

Expiry Date

Usage Limit

Usage Count

Status

---

# ADDRESSES COLLECTION

Store:

Customer

Full Name

Phone

Country

City

Province

Postal Code

Street

Apartment

Default Shipping

Default Billing

---

# NOTIFICATIONS COLLECTION

Store:

User

Title

Message

Type

Read Status

Created At

---

# HOMEPAGE COLLECTION

Store editable homepage content:

Hero

Announcement Bar

Featured Categories

Featured Products

Best Sellers

Luxury Banner

Testimonials

Newsletter

Footer

---

# BANNERS COLLECTION

Store:

Image

Title

Subtitle

Button

Button Link

Display Order

Status

---

# TESTIMONIALS COLLECTION

Store:

Customer Name

Country

Profile Image

Rating

Review

Display Order

Status

---

# NEWSLETTER COLLECTION

Store:

Email

Subscription Date

Status

---

# SHIPPING COLLECTION

Store:

Country

Shipping Cost

Free Shipping Limit

Estimated Delivery

Status

---

# PAYMENT COLLECTION

Store:

Order

Payment Method

Transaction ID

Status

Amount

Payment Date

---

# SETTINGS COLLECTION

Store:

Website Name

Logo

Favicon

Theme Colors

Business Information

Social Media

Contact Information

Default Currency

Maintenance Mode

---

# SEO COLLECTION

Store:

Page

Meta Title

Meta Description

Keywords

Canonical URL

Open Graph

Structured Data

---

# MEDIA COLLECTION

Store:

File Name

URL

Alt Text

Type

Size

Uploaded By

Upload Date

---

# INDEXES

Create indexes for:

Email

Phone Number

SKU

Product Slug

Category Slug

Order Number

Coupon Code

Created Date

Frequently searched fields

---

# RELATIONSHIPS

User

↓

Orders

↓

Order Items

User

↓

Wishlist

↓

Products

Category

↓

Products

Product

↓

Reviews

User

↓

Addresses

Order

↓

Payments

---

# VALIDATION

Validate every document.

Never allow invalid data.

Require mandatory fields.

Use enums where appropriate.

Validate ObjectIds.

---

# SECURITY

Never store plain text passwords.

Hash passwords using bcrypt.

Validate every request.

Sanitize user input.

Protect sensitive fields.

---

# PERFORMANCE

Use indexes.

Avoid duplicate data.

Optimize queries.

Use pagination.

Use aggregation where appropriate.

Minimize unnecessary lookups.

---

# BACKUPS

Future Ready:

Database Backups

Restore Points

Data Export

Data Import

---

# SCALABILITY

Database should support:

100 Products

1,000 Products

10,000 Products

100,000 Products

without major redesign.

---

# FINAL GOAL

The MongoDB database should be clean, scalable, secure, and easy to maintain.

It should support every feature of the ZOYA GOODS platform while remaining performant as the business grows.