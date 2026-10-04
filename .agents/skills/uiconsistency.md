# Markline CMS — UI Consistency & Modular Architecture Skill

## Purpose

You are working on the Markline Fashion CMS.

Your responsibility is to maintain a **consistent, modular, scalable, production-quality CMS interface**.

Every page must follow the Markline design system while keeping its code modular and easy to modify.

The primary goals are:

* Consistent UI across the CMS
* Modular page architecture
* Separate Create and Update forms for each CMS module
* Easy control over Create and Update experiences independently
* Reusable UI components
* shadcn/ui as the standard component library
* Consistent bordered cards
* Consistent spacing, typography, colors, and states
* No monolithic page files
* Clear separation of UI, data, validation, and business logic

---

# 1. Core Principles

Follow these principles for every implementation.

### 1.1 Consistency over invention

Before creating UI:

1. Inspect the existing project structure.
2. Inspect existing shadcn/ui components.
3. Inspect 2–3 existing CMS pages.
4. Identify the existing design patterns.
5. Identify reusable components.
6. Identify existing design tokens.
7. Reuse established patterns.
8. Only create a new pattern when the existing system genuinely cannot support the requirement.

Do not randomly introduce:

* new colors
* new font sizes
* new border radii
* new shadows
* new button styles
* new card styles
* new spacing values
* new table styles
* new modal styles

The objective is that every page looks like part of the same CMS.

---

# 2. shadcn/ui Is Mandatory

Use **shadcn/ui** for standard CMS UI components whenever an appropriate component exists.

Prefer shadcn/ui for:

* Button
* Input
* Textarea
* Select
* Checkbox
* Radio Group
* Switch
* Label
* Form
* Dialog
* Alert Dialog
* Sheet
* Drawer
* Dropdown Menu
* Popover
* Command
* Calendar
* Tabs
* Accordion
* Card
* Badge
* Table
* Pagination
* Tooltip
* Sonner / Toast
* Skeleton
* Separator
* Breadcrumb
* Avatar
* Scroll Area

Do not build custom replacements unnecessarily.

If a requirement is not directly available, compose existing shadcn/ui primitives before creating custom UI.

---

# 3. Markline Design System

Markline CMS should have a:

* Premium
* Minimal
* Clean
* Modern
* Professional
* Luxury
* Editorial
* Functional

visual language.

The CMS is an administration application.

Prioritize:

```text
Clarity
Usability
Consistency
Information hierarchy
Maintainability
```

Avoid:

* excessive gradients
* excessive shadows
* excessive animations
* overly decorative UI
* excessive colors
* inconsistent component styles
* unnecessary visual effects

---

# 4. Cards Must Use Borders

Cards are a major part of the Markline CMS visual system.

Use **visible borders** for cards and grouped content.

Prefer the existing shadcn/ui Card component and project border tokens.

Example:

```tsx
<Card className="border">
  ...
</Card>
```

or the project's established equivalent.

Cards should generally use:

* border
* consistent background
* consistent radius
* consistent padding
* minimal or no unnecessary shadow

Do not create cards with random visual treatments on different pages.

Avoid making one page use:

```text
border
```

another:

```text
shadow-lg
```

and another:

```text
border + shadow-xl
```

unless there is a deliberate system-level reason.

### Card usage

Use bordered cards to group related information such as:

* Product information
* Pricing
* Inventory
* SEO settings
* Media
* Shipping
* Customer information
* Order information
* Blog settings
* Notification settings
* Dashboard statistics
* Form sections

---

# 5. Typography System

Use the existing project typography configuration.

Preferred Markline typography:

* Plus Jakarta Sans
* Noto Sans where appropriate

Maintain a consistent hierarchy:

```text
Page Title
Section Title
Card Title
Body
Secondary Text
Helper Text
Table Text
Caption
```

Do not introduce arbitrary typography values.

Use the project's existing Tailwind/shadcn typography patterns.

---

# 6. Color System

Use semantic design tokens.

Prefer:

```text
background
foreground
primary
secondary
muted
muted-foreground
accent
border
input
ring
destructive
success
warning
```

Do not repeatedly hardcode colors.

Avoid:

```tsx
className="bg-[#111111]"
```

when an appropriate project token exists.

If a new color is genuinely required, add it to the design system instead of scattering the color throughout the application.

---

# 7. Spacing System

Maintain a consistent spacing scale.

Use consistent spacing between:

* Page header
* Filters
* Cards
* Card sections
* Form fields
* Tables
* Actions
* Dialog content
* Page sections

Do not use arbitrary spacing to fix individual pages.

If a spacing pattern appears repeatedly, use the existing pattern or create a reusable layout primitive when justified.

---

# 8. Border Radius

Use the project's established radius tokens.

Do not independently choose different radii for every component.

The following should visually belong to the same system:

```text
Buttons
Inputs
Cards
Dialogs
Tables
Badges
Dropdowns
```

---

# 9. Page Architecture

A CMS page must NOT contain every feature inside one large file.

Avoid:

```text
ProductPage.tsx
├── table
├── create form
├── update form
├── delete dialog
├── filters
├── search
├── pagination
├── API calls
├── validation
├── state management
└── UI
```

Instead, break the module into logical components.

Example:

```text
products/
├── page.tsx
├── components/
│   ├── product-header.tsx
│   ├── product-filters.tsx
│   ├── product-table.tsx
│   ├── product-create-form.tsx
│   ├── product-update-form.tsx
│   ├── product-create-dialog.tsx
│   ├── product-update-dialog.tsx
│   ├── product-delete-dialog.tsx
│   ├── product-empty-state.tsx
│   └── product-loading-state.tsx
├── hooks/
│   └── use-products.ts
├── schemas/
│   ├── product-create-schema.ts
│   └── product-update-schema.ts
├── types/
│   └── product-types.ts
└── utils/
    └── product-utils.ts
```

The exact structure can follow the existing project architecture.

Do not create folders or files unnecessarily.

---

# 10. CREATE AND UPDATE FORMS MUST BE SEPARATE

This is an important Markline CMS architecture rule.

For every CMS module that has Create and Update functionality, use **separate Create and Update form components**.

Example:

```text
ProductCreateForm
ProductUpdateForm
```

Do NOT force both workflows into one giant:

```text
ProductForm
```

when doing so makes the code difficult to control or modify independently.

### Why

Separate forms provide better control over:

* Create-specific fields
* Update-specific fields
* Default values
* Validation
* Conditional fields
* API mutations
* UX
* Future changes
* Permissions
* Different business rules

For example:

```text
ProductCreateForm
```

can contain:

* initial product information
* initial variants
* required creation fields
* creation-specific defaults

while:

```text
ProductUpdateForm
```

can contain:

* existing product data
* update-only fields
* inventory changes
* publishing controls
* update-specific behavior

---

# 11. Shared Fields Are Allowed

Separate Create and Update forms does **not** mean duplicate every field component.

Use shared field components when useful.

Example:

```text
ProductCreateForm
      │
      ├── ProductBasicFields
      ├── ProductPricingFields
      └── ProductMediaFields

ProductUpdateForm
      │
      ├── ProductBasicFields
      ├── ProductPricingFields
      └── ProductMediaFields
```

This provides both:

```text
Separate workflow control
+
Reusable field UI
```

Do not duplicate large blocks of identical JSX unnecessarily.

---

# 12. Create / Update Architecture

Recommended pattern:

```text
Product Page
│
├── Product Header
│
├── Product Filters
│
├── Product Table
│
├── Create Product
│     └── ProductCreateForm
│
├── Update Product
│     └── ProductUpdateForm
│
└── Delete Product
      └── ProductDeleteDialog
```

For another module:

```text
Blog Page
│
├── Blog Header
├── Blog Filters
├── Blog Table
├── Create Blog
│     └── BlogCreateForm
├── Update Blog
│     └── BlogUpdateForm
└── Delete Blog
      └── BlogDeleteDialog
```

Repeat the architecture for:

```text
Products
Categories
Collections
Blogs
Notifications
Shipments
Users
Coupons
Settings
```

where applicable.

---

# 13. Forms Must Be Modular

A Create or Update form should itself be divided when it becomes complex.

Example:

```text
ProductCreateForm
├── Basic Information Card
├── Pricing Card
├── Inventory Card
├── Media Card
├── SEO Card
└── Actions
```

Example UI:

```text
┌─────────────────────────────────────┐
│ Basic Information                   │
│                                     │
│ Name                                │
│ Description                         │
│ Category                            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Pricing                             │
│                                     │
│ MRP                                 │
│ Retail Price                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ SEO                                 │
│                                     │
│ SEO Title                           │
│ SEO Description                     │
│ Keywords                            │
└─────────────────────────────────────┘
```

Use bordered shadcn/ui Cards for these sections.

---

# 14. Page Responsibilities

The page should primarily compose the module.

Example:

```tsx
export default function ProductsPage() {
  return (
    <PageLayout>
      <ProductHeader />
      <ProductFilters />
      <ProductTable />

      <ProductCreateDialog />
      <ProductUpdateDialog />
      <ProductDeleteDialog />
    </PageLayout>
  );
}
```

The page should not contain hundreds of lines of:

* form JSX
* table JSX
* dialog JSX
* validation
* API calls
* business logic

---

# 15. Component Responsibilities

Each component should have a clear responsibility.

### Header

Responsible for:

* Page title
* Description
* Primary action
* Secondary actions

### Filters

Responsible for:

* Search
* Status
* Category
* Sorting
* Date filters

### Table

Responsible for:

* Data display
* Row actions
* Loading
* Empty state

### Create Form

Responsible for:

* Create-specific fields
* Create validation
* Create mutation
* Create-specific UX

### Update Form

Responsible for:

* Existing record values
* Update-specific fields
* Update validation
* Update mutation
* Update-specific UX

### Delete Dialog

Responsible for:

* Confirmation
* Destructive action
* Loading state
* Error handling

---

# 16. Tables

Use shadcn/ui Table.

Tables should consistently handle:

* Loading
* Empty state
* Error state
* Pagination
* Row actions
* Long text
* Responsive behavior
* Status badges

Prefer:

```text
ProductTable
├── ProductTableToolbar
├── ProductTableHeader
├── ProductTableRow
├── ProductTableActions
└── ProductTablePagination
```

Do not create a completely different table design for every module.

---

# 17. CRUD Pattern

Use a consistent CRUD structure throughout the CMS.

```text
Page
│
├── Page Header
│     └── Create Button
│
├── Filters / Search
│
├── Data Table
│     └── Row Actions
│
├── Create Dialog
│     └── Create Form
│
├── Update Dialog
│     └── Update Form
│
└── Delete Confirmation
```

The UI structure should remain predictable even when the underlying data differs.

---

# 18. Dialogs and Sheets

Use shadcn/ui Dialog, AlertDialog, or Sheet.

### Dialog

Use for:

* focused forms
* smaller create/update workflows
* confirmations

### Sheet

Use for:

* larger editing workflows
* detailed forms
* side-panel editing

### AlertDialog

Use for:

* Delete
* Destructive actions
* Irreversible actions

Do not create custom modal implementations unnecessarily.

---

# 19. State Handling

Every data-driven component must consider:

### Loading

Use the project's Skeleton/loading pattern.

### Empty

Use a consistent empty-state component.

### Error

Use the established error UI.

### Success

Use the existing toast/notification system.

### Mutation

Show appropriate loading/disabled states during:

* Create
* Update
* Delete
* Upload
* Publish
* Restore

Prevent accidental duplicate submissions.

---

# 20. Responsive Design

Every page must consider:

* Desktop
* Tablet
* Small screens

For tables:

* Preserve important information
* Allow horizontal scrolling where appropriate
* Keep row actions accessible

For forms:

* Use responsive grids
* Avoid excessive horizontal density
* Keep labels and controls readable

Follow the existing project's breakpoints.

---

# 21. Component Reuse

Before creating a component:

```text
Does this already exist?
```

If yes:

```text
Reuse it.
```

If similar implementations exist:

```text
Consider consolidating them.
```

Do not create unnecessary variants such as:

```text
ProductButton
OrderButton
BlogButton
UserButton
```

when the standard shadcn/ui Button can handle them.

---

# 22. Business Logic Separation

Separate:

```text
UI
Data fetching
Mutations
Validation
Business rules
Utilities
Types
```

UI components should not become repositories for every piece of application logic.

Follow the project's existing data-fetching architecture.

---

# 23. Supabase

If the CMS uses Supabase, avoid placing large Supabase queries directly inside presentational components.

Prefer the project's existing hooks/services/data layer.

Recommended:

```text
ProductTable
      ↓
useProducts()
      ↓
Supabase
```

rather than placing all database operations directly inside the table component.

---

# 24. Design Tokens

Centralize reusable design values where appropriate:

```text
Colors
Typography
Spacing
Radius
Borders
Shadows
Component heights
Container widths
```

Prefer existing Tailwind/shadcn CSS variables and tokens.

Do not duplicate design values across components.

---

# 25. Existing UI Must Be Respected

When modifying an existing page:

1. Inspect the current page.
2. Inspect neighboring CMS pages.
3. Identify reusable components.
4. Preserve existing functionality.
5. Identify the established design patterns.
6. Reuse those patterns.
7. Refactor incrementally.
8. Apply the Markline design system.
9. Do not unnecessarily redesign unrelated parts.

The objective is **consistency and maintainability**, not redesign for the sake of redesign.

---

# 26. Refactoring Monolithic Pages

If an existing page contains everything in one file, refactor it into logical modules.

Example:

```text
BEFORE

ProductPage.tsx
1000+ lines
```

Refactor toward:

```text
ProductPage.tsx

components/
├── ProductHeader.tsx
├── ProductFilters.tsx
├── ProductTable.tsx
├── ProductCreateForm.tsx
├── ProductUpdateForm.tsx
├── ProductCreateDialog.tsx
├── ProductUpdateDialog.tsx
└── ProductDeleteDialog.tsx
```

For large forms:

```text
ProductCreateForm
├── ProductBasicFields
├── ProductPricingFields
├── ProductInventoryFields
├── ProductMediaFields
└── ProductSEOFields
```

The exact extraction should be based on actual complexity.

---

# 27. Do Not Over-Engineer

Modular does not mean creating hundreds of tiny files.

Do NOT create unnecessary components such as:

```text
ProductTitle.tsx
ProductDescription.tsx
ProductLabel.tsx
ProductIcon.tsx
ProductText.tsx
```

if they have no meaningful independent responsibility or reuse.

The goal is:

```text
Logical modularity
```

not:

```text
Maximum number of files
```

---

# 28. UI Consistency Checklist

Before completing any page:

### Layout

* Page structure matches existing CMS pages
* Content width is consistent
* Header structure is consistent
* Section spacing is consistent

### Cards

* Cards use borders
* Card radius is consistent
* Card padding is consistent
* Card treatment matches existing pages
* No unnecessary shadows

### Typography

* Correct font
* Consistent heading hierarchy
* Consistent body text
* Consistent muted text

### Components

* shadcn/ui used where applicable
* Existing components reused
* Buttons consistent
* Inputs consistent
* Tables consistent
* Dialogs consistent
* Badges consistent

### Colors

* Semantic tokens used
* No unnecessary hardcoded colors
* Status colors consistent

### States

* Loading
* Empty
* Error
* Success
* Disabled
* Mutation loading

### Responsive

* Desktop
* Tablet
* Small screens
* Table overflow handled

---

# 29. Architecture Checklist

Before completing implementation:

```text
[ ] Page is primarily a composition layer
[ ] Large sections extracted into components
[ ] Create form is separate from Update form
[ ] Create dialog is separate from Update dialog
[ ] Shared field components used where appropriate
[ ] Forms are modular
[ ] Tables are separated
[ ] Filters are separated
[ ] Delete confirmation is separated
[ ] Validation is organized
[ ] Data fetching follows existing architecture
[ ] Business logic is not unnecessarily inside UI
[ ] Existing components are reused
[ ] shadcn/ui is used for standard UI
[ ] Cards use consistent borders
[ ] No unnecessary duplicate components
[ ] No unnecessary abstractions
[ ] Responsive behavior is handled
```

---

# 30. Implementation Process

Before writing code:

```text
1. Inspect project structure
2. Inspect existing shadcn/ui components
3. Inspect 2–3 existing CMS pages
4. Identify established design patterns
5. Identify reusable components
6. Identify existing hooks/services
7. Identify existing design tokens
8. Plan the component architecture
9. Separate Create and Update workflows
10. Implement
11. Review the UI against existing pages
12. Review the architecture for unnecessary duplication
```

Do not immediately start coding before understanding the existing system.

---

# 31. Final Rule

When creating or modifying Markline CMS UI:

> **Reuse first. Compose second. Separate Create and Update workflows. Create new components only when necessary.**

The final application should look like it was built using **one design system and one engineering architecture**, not as a collection of independent AI-generated pages.

Priority:

```text
Existing Markline Design System
        ↓
Existing Components
        ↓
shadcn/ui
        ↓
Reusable Module Components
        ↓
Separate Create / Update Forms
        ↓
Custom UI only when necessary
```

The page architecture should generally follow:

```text
Page
 ├── Header
 ├── Toolbar / Filters
 ├── Main Content
 │    └── Table / Cards / Content
 ├── Create UI
 │    └── Create Form
 ├── Update UI
 │    └── Update Form
 └── Delete / Confirmation UI
```

Keep pages compositional, forms independently controllable, components focused, cards consistently bordered, and the entire CMS governed by the same Markline design system.
