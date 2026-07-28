# VOSS - COMPONENT LIBRARY

Version: 1.0

---

# PURPOSE

This document defines every reusable UI component for the VOSS MERN eCommerce platform.

The AI must create reusable components first before building pages.

Never duplicate components.

If a component already exists, reuse it.

All components must follow the Design System.

---

# GENERAL RULES

Every component must:

Be reusable

Be responsive

Support dark/light themes (future ready)

Be accessible

Be well documented

Have clean props

Support loading states

Support disabled states

Support animations

---

# LAYOUT COMPONENTS

AppLayout

MainLayout

AdminLayout

AuthLayout

Container

Section

Grid

Flex

Spacer

Divider

---

# NAVIGATION COMPONENTS

Navbar

DesktopMenu

MobileMenu

Sidebar

AdminSidebar

Breadcrumb

Pagination

BackButton

ScrollToTop

---

# BUTTON COMPONENTS

PrimaryButton

SecondaryButton

OutlineButton

GhostButton

IconButton

DangerButton

SuccessButton

LoadingButton

BackButton

ContinueButton

CheckoutButton

AddToCartButton

WishlistButton

QuantityButton

---

# FORM COMPONENTS

Input

PasswordInput

Textarea

Checkbox

Radio

Toggle

Select

MultiSelect

SearchInput

OTPInput

FileUpload

DatePicker

PhoneInput

ColorPicker

SizeSelector

QuantitySelector

CouponInput

ReviewInput

---

# PRODUCT COMPONENTS

ProductCard

FeaturedProductCard

CompactProductCard

ProductGallery

ProductImage

ProductInfo

ProductPrice

ProductRating

ProductBadge

StockIndicator

ColorSelector

SizeSelector

QuantitySelector

RelatedProducts

RecentlyViewed

---

# CATEGORY COMPONENTS

CategoryCard

CategoryBanner

CategoryGrid

CategoryFilter

CategorySidebar

---

# CART COMPONENTS

CartDrawer

CartItem

CartSummary

CartTotals

CouponBox

ShippingCalculator

SavedForLater

RecommendedProducts

FreeShippingProgress

---

# CHECKOUT COMPONENTS

CheckoutStepper

ShippingForm

BillingForm

PaymentMethod

OrderSummary

OrderReview

OrderConfirmation

InvoiceCard

---

# USER COMPONENTS

ProfileCard

AddressCard

OrderCard

WishlistCard

NotificationCard

ActivityCard

AccountMenu

DashboardStats

---

# ADMIN COMPONENTS

AdminHeader

AdminSidebar

DashboardCards

StatisticsCard

AnalyticsChart

RevenueChart

OrdersTable

ProductsTable

UsersTable

ReviewTable

SettingsForm

MediaManager

HomepageEditor

BannerEditor

CouponManager

OrderManager

UserManager

CategoryManager

ProductManager

---

# MODALS

ConfirmationModal

DeleteModal

ImagePreviewModal

QuickViewModal

SuccessModal

ErrorModal

LoadingModal

LoginModal

RegisterModal

---

# DRAWERS

CartDrawer

NotificationDrawer

FilterDrawer

MobileMenuDrawer

WishlistDrawer

---

# FEEDBACK COMPONENTS

LoadingSpinner

SkeletonLoader

ProgressBar

EmptyState

ErrorState

SuccessState

Toast

Alert

Badge

Tooltip

---

# DISPLAY COMPONENTS

Card

Accordion

Tabs

Carousel

Slider

Timeline

Avatar

Chip

Tag

Table

DataTable

List

Statistic

Counter

Countdown

---

# MEDIA COMPONENTS

Image

LazyImage

VideoPlayer

Gallery

Lightbox

ZoomViewer

---

# FOOTER COMPONENTS

Footer

Newsletter

SocialIcons

FooterLinks

ContactInfo

---

# SEARCH COMPONENTS

SearchBar

SearchResults

SearchSuggestions

SearchHistory

RecentSearches

---

# FILTER COMPONENTS

PriceFilter

CategoryFilter

ColorFilter

SizeFilter

MaterialFilter

AvailabilityFilter

SortDropdown

ClearFilters

---

# SEO COMPONENTS

MetaTags

BreadcrumbSchema

ProductSchema

OrganizationSchema

OpenGraph

---

# ANIMATION COMPONENTS

FadeIn

FadeUp

FadeDown

SlideLeft

SlideRight

ScaleIn

HoverLift

HoverGlow

PageTransition

ScrollReveal

ParallaxSection

---

# RESPONSIVE COMPONENTS

DesktopOnly

TabletOnly

MobileOnly

ResponsiveGrid

ResponsiveImage

ResponsiveTable

---

# COMMON COMPONENTS

Logo

BrandMark

ThemeToggle (Future Ready)

LanguageSwitcher (Future Ready)

CurrencySelector (Future Ready)

NotificationBell

ProfileDropdown

BackToTop

---

# COMPONENT RULES

One component = One responsibility.

Keep components small.

Keep components reusable.

Do not duplicate UI.

Pass data through props.

Do not hardcode values.

Keep styling consistent.

Use meaningful names.

Write clean code.

---

# FOLDER STRUCTURE

components/

layout/

navigation/

buttons/

forms/

products/

categories/

cart/

checkout/

user/

admin/

feedback/

display/

media/

footer/

search/

filters/

seo/

animations/

common/

---

# FINAL GOAL

The VOSS component library should serve as the foundation of the entire application.

Every page must be built using reusable components instead of custom one-off implementations.

The result should be a clean, scalable, maintainable, and production-ready React codebase.