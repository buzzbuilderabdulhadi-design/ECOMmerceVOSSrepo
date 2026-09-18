# ZOYA GOODS - FOLDER STRUCTURE

Version: 1.0

---

# PURPOSE

This document defines the official folder structure for the ZOYA GOODS MERN eCommerce platform.

The AI must strictly follow this structure.

Never create unnecessary folders.

Never place files in incorrect locations.

Always organize code logically.

---

# ROOT

```
voss-ecommerce/

│

├── client/

├── server/

├── docs/

├── reference/

├── .gitignore

├── README.md

├── package.json (optional if using workspaces)

└── LICENSE (optional)
```

---

# CLIENT

```
client/

│

├── public/

│

├── src/

│   ├── assets/

│   │   ├── images/

│   │   ├── icons/

│   │   ├── fonts/

│   │   └── videos/

│   │

│   ├── animations/

│   │

│   ├── components/

│   │   ├── common/

│   │   ├── layout/

│   │   ├── ui/

│   │   ├── forms/

│   │   ├── navigation/

│   │   ├── products/

│   │   ├── categories/

│   │   ├── cart/

│   │   ├── checkout/

│   │   ├── dashboard/

│   │   ├── admin/

│   │   └── feedback/

│   │

│   ├── pages/

│   │   ├── Home/

│   │   ├── Shop/

│   │   ├── Product/

│   │   ├── Category/

│   │   ├── Cart/

│   │   ├── Checkout/

│   │   ├── Login/

│   │   ├── Register/

│   │   ├── Dashboard/

│   │   ├── Wishlist/

│   │   ├── Admin/

│   │   ├── About/

│   │   ├── Contact/

│   │   └── NotFound/

│   │

│   ├── layouts/

│   │

│   ├── routes/

│   │

│   ├── hooks/

│   │

│   ├── context/

│   │

│   ├── services/

│   │

│   ├── utils/

│   │

│   ├── constants/

│   │

│   ├── config/

│   │

│   ├── styles/

│   │

│   ├── data/

│   │

│   ├── App.jsx

│   └── main.jsx

│

├── package.json

├── vite.config.js

└── tailwind.config.js
```

---

# SERVER

```
server/

│

├── src/

│   ├── config/

│   ├── controllers/

│   ├── middleware/

│   ├── models/

│   ├── routes/

│   ├── services/

│   ├── validations/

│   ├── utils/

│   ├── helpers/

│   ├── constants/

│   ├── database/

│   ├── uploads/

│   ├── logs/

│   ├── sockets/ (future)

│   ├── jobs/ (future)

│   ├── app.js

│   └── server.js

│

├── package.json

└── .env
```

---

# DOCS

```
docs/

00_MASTER_PROMPT.md

01_PROJECT_RULES.md

02_DESIGN_SYSTEM.md

03_HOME_PAGE.md

04_PRODUCTS.md

05_CATEGORY_PAGE.md

06_PRODUCT_DETAILS.md

07_CART.md

08_CHECKOUT.md

09_AUTHENTICATION.md

10_USER_DASHBOARD.md

11_ADMIN_PANEL.md

12_DATABASE.md

13_API_DOCUMENTATION.md

14_BACKEND_ARCHITECTURE.md

15_FRONTEND_ARCHITECTURE.md

16_DEVELOPMENT_ROADMAP.md

17_DEPLOYMENT.md

18_CODING_STANDARDS.md

19_AI_DEVELOPMENT_WORKFLOW.md

ANIMATIONS.md

COMPONENT_LIBRARY.md

CONFIGURATION.md

FOLDER_STRUCTURE.md
```

---

# REFERENCE

```
reference/

designs/

wireframes/

logos/

icons/

fonts/

inspiration/

assets/
```

---

# FILE NAMING

React Components

PascalCase

Example:

ProductCard.jsx

Navbar.jsx

AdminSidebar.jsx

Folders

camelCase or lowercase

Example:

components

services

utils

Files

Meaningful names.

Avoid abbreviations.

---

# IMPORT RULES

Import from reusable components first.

Avoid long relative paths.

Prefer aliases where possible.

---

# ORGANIZATION RULES

One responsibility per file.

One component per file.

One model per collection.

One controller per resource.

One route file per resource.

One service per business domain.

Never duplicate code.

---

# FINAL GOAL

The project structure should remain clean, scalable, and easy to navigate.

A new developer should immediately understand where every file belongs.