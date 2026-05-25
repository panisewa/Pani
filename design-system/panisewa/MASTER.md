# Design System Master File — Panisewa (पानीसेवा)

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Panisewa (पानीसेवा)
**Generated:** 2026-05-17
**Stack:** Next.js 14 + Tailwind CSS + shadcn/ui + TypeScript
**Category:** B2B SaaS — Logistics / Water Delivery — Data-Dense Dashboard
**Languages:** English (Latin) + Nepali (Devanagari)
**Target:** Desktop-primary (admin dashboard), mobile-adaptive (driver app parity)

---

## Color Palette

| Role          | Hex       | Tailwind     | CSS Variable          | Notes                         |
|---------------|-----------|--------------|-----------------------|-------------------------------|
| Primary       | `#1D4ED8` | `blue-700`   | `--color-primary`     | Trust / authority             |
| Primary Light | `#3B82F6` | `blue-500`   | `--color-primary-lt`  | Hover states, secondary UI    |
| Accent / CTA  | `#EA580C` | `orange-600` | `--color-accent`      | Delivery orange — CTAs, badges|
| Success       | `#16A34A` | `green-600`  | `--color-success`     | Delivered, paid, in-stock     |
| Warning       | `#D97706` | `amber-600`  | `--color-warning`     | Low stock, pending, overdue   |
| Danger        | `#DC2626` | `red-600`    | `--color-danger`      | Failed, cancelled, error      |
| Surface       | `#FFFFFF` | `white`      | `--color-surface`     | Card / panel background       |
| Background    | `#F1F5F9` | `slate-100`  | `--color-bg`          | Page background               |
| Border        | `#E2E8F0` | `slate-200`  | `--color-border`      | Dividers, card borders        |
| Text Primary  | `#0F172A` | `slate-900`  | `--color-text`        | All body / label text         |
| Text Muted    | `#475569` | `slate-600`  | `--color-text-muted`  | Secondary labels, hints       |
| Text Disabled | `#94A3B8` | `slate-400`  | `--color-text-disabled` | Disabled states             |

**Forbidden:** No purple (#7C3AED, etc.), no pink (#EC4899, etc.), no lime green, no gradient backgrounds.

### Semantic Status Colors (Order / Payment / Inventory)

| State             | Color     | Hex       |
|-------------------|-----------|-----------|
| DRAFT             | slate-400 | `#94A3B8` |
| CONFIRMED         | blue-500  | `#3B82F6` |
| ASSIGNED          | indigo-500| `#6366F1` |
| OUT_FOR_DELIVERY  | amber-500 | `#F59E0B` |
| DELIVERED         | green-600 | `#16A34A` |
| FAILED            | red-600   | `#DC2626` |
| CANCELLED         | slate-500 | `#64748B` |
| PAID              | green-600 | `#16A34A` |
| OVERDUE           | red-600   | `#DC2626` |
| LOW_STOCK         | amber-600 | `#D97706` |

---

## Typography

### Latin (English) — Primary UI Font

| Role          | Font       | Weights     | Notes                          |
|---------------|------------|-------------|--------------------------------|
| UI Headings   | Inter      | 600, 700    | SaaS standard, excellent at small sizes |
| Body / Labels | Inter      | 400, 500    | Same family for visual unity   |
| Tabular Data  | JetBrains Mono | 400, 500 | Numbers, amounts, IDs, codes   |

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

```js
// tailwind.config.ts
fontFamily: {
  sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### Devanagari (Nepali) — Critical Requirement

**Font stack order:**
```css
font-family: 'Noto Sans Devanagari', 'Mukta', system-ui, sans-serif;
```

Load Noto Sans Devanagari alongside Inter:
```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');
```

**Rules:**
- `lang="ne"` on `<html>` when Nepali is active (triggers browser shaping)
- BS dates (२०८१-०३-१५), amounts in Devanagari numerals → use `font-mono` still fine
- Never use Fira Code, Space Mono, JetBrains Mono for Nepali prose — fall back to Noto
- Product name labels in Nepali (`name_ne`) use `font-sans` (Noto covers it)
- Minimum 17px for Devanagari body text (glyphs have more vertical complexity)

---

## Spacing System

| Token        | Value         | Tailwind | Usage                          |
|--------------|---------------|----------|--------------------------------|
| `--space-xs` | `4px / 0.25rem`  | `p-1`  | Tight: badge padding, chip gaps |
| `--space-sm` | `8px / 0.5rem`   | `p-2`  | Icon gaps, inline elements     |
| `--space-md` | `16px / 1rem`    | `p-4`  | Standard card padding          |
| `--space-lg` | `24px / 1.5rem`  | `p-6`  | Section padding, modal body    |
| `--space-xl` | `32px / 2rem`    | `p-8`  | Large section gaps             |
| `--space-2xl`| `48px / 3rem`    | `p-12` | Page-level margins             |

---

## Shadow Scale

| Level          | Value                              | Usage                    |
|----------------|------------------------------------|--------------------------|
| `--shadow-xs`  | `0 1px 2px rgba(0,0,0,0.04)`      | Table rows on hover      |
| `--shadow-sm`  | `0 1px 3px rgba(0,0,0,0.08)`      | Cards, KPI tiles         |
| `--shadow-md`  | `0 4px 6px rgba(0,0,0,0.07)`      | Dropdowns, popovers      |
| `--shadow-lg`  | `0 10px 15px rgba(0,0,0,0.08)`    | Modals, command palettes |

---

## Border Radius

| Component     | Radius  | Tailwind        |
|---------------|---------|-----------------|
| Cards         | `8px`   | `rounded-lg`    |
| Buttons       | `6px`   | `rounded-md`    |
| Badges/Tags   | `4px`   | `rounded`       |
| Inputs        | `6px`   | `rounded-md`    |
| Avatars       | `50%`   | `rounded-full`  |
| Modals        | `12px`  | `rounded-xl`    |

---

## Component Specs

### Buttons

```tsx
// Primary — CTA action (Create Order, Confirm, Pay)
<Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-md transition-colors duration-150 cursor-pointer">
  Create Order
</Button>

// Primary Blue — navigation actions
<Button className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-md transition-colors duration-150 cursor-pointer">
  View Details
</Button>

// Destructive
<Button variant="destructive" className="bg-red-600 hover:bg-red-700">
  Cancel Order
</Button>

// Ghost / secondary
<Button variant="ghost" className="text-slate-600 hover:bg-slate-100">
  Export
</Button>
```

**Rules:**
- Disable + show spinner during async (never double-submit)
- Minimum touch target: `h-10` (40px) — pad to 44px on mobile
- Loading state: replace label with `<Loader2 className="animate-spin" />`

### KPI Cards (most-used component)

```tsx
<div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
  <p className="text-sm font-medium text-slate-500">Orders Today</p>
  <p className="text-2xl font-bold text-slate-900 font-mono mt-1">142</p>
  <p className="text-xs text-green-600 mt-1">↑ 12% vs yesterday</p>
</div>
```

**Rules:**
- Numbers always `font-mono` (tabular figures, no layout shift)
- Money: always `रू 1,234.00` format (formatPaisa helper)
- Delta indicators: `↑` green-600, `↓` red-600, `→` slate-500

### Data Tables

```tsx
// shadcn/ui Table + TanStack Table
// Required: sticky header, sortable columns, row hover
<Table>
  <TableHeader className="sticky top-0 bg-white z-10">
    <TableRow className="border-b border-slate-200">
      <TableHead className="font-semibold text-slate-700">Order #</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer">
      <TableCell className="font-mono text-sm">ORD-2081-000142</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Rules:**
- Alternating row color: NO (prefer hover highlight only)
- Status column: always colored badge, never plain text
- Amounts: right-aligned, `font-mono`
- Empty state: centered illustration + action button

### Status Badges

```tsx
const statusConfig = {
  DELIVERED:        { label: 'Delivered',        class: 'bg-green-100 text-green-700 border-green-200' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  CONFIRMED:        { label: 'Confirmed',        class: 'bg-blue-100 text-blue-700 border-blue-200' },
  DRAFT:            { label: 'Draft',            class: 'bg-slate-100 text-slate-600 border-slate-200' },
  FAILED:           { label: 'Failed',           class: 'bg-red-100 text-red-700 border-red-200' },
  CANCELLED:        { label: 'Cancelled',        class: 'bg-slate-100 text-slate-500 border-slate-200' },
}

<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusConfig[status].class}`}>
  {statusConfig[status].label}
</span>
```

### Forms & Inputs

```tsx
// shadcn/ui Input + Label
<div className="space-y-1.5">
  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
    Phone Number
  </Label>
  <Input
    id="phone"
    placeholder="98XXXXXXXX"
    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
  />
  <p className="text-xs text-slate-500">Nepal mobile: 97/98 + 8 digits</p>
</div>
```

**Rules:**
- Every input has `<Label>` — no placeholder-only labels
- Error state: red border + `text-red-600` message below input
- Currency inputs: suffix "रू" or "paisa" indicator
- Nepali date pickers: show BS date primary, AD secondary in tooltip

### Modals / Sheets

```tsx
// Use shadcn Sheet for forms, Dialog for confirmations
// Confirmation dialogs (destructive actions):
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancel Order ORD-2081-000142?</AlertDialogTitle>
      <AlertDialogDescription>
        This cannot be undone. Stock will not be automatically restocked.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep Order</AlertDialogCancel>
      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
        Cancel Order
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Layout System

### Dashboard Shell

```
┌─────────────────────────────────────────────────┐
│ Sidebar (240px fixed) │ Main Content Area        │
│                       │                          │
│ Logo                  │ ┌─ Topbar (64px) ───────┐│
│ Nav Items             │ │ Page title  | Actions  ││
│ ─────────             │ └─────────────────────────┘│
│ Tenant info           │ ┌─ Content (scrollable) ─┐│
│ User menu             │ │ KPI row                ││
│                       │ │ Chart / Table          ││
│                       │ └─────────────────────────┘│
└─────────────────────────────────────────────────┘
```

```tsx
// Sidebar: w-60, bg-white, border-r border-slate-200
// Main: flex-1, bg-slate-100, min-h-screen
// Topbar: h-16, bg-white, border-b border-slate-200, sticky top-0 z-30
// Content: p-6, max-w-none
```

### Responsive Breakpoints

| Breakpoint | Sidebar      | Columns | Notes                   |
|------------|--------------|---------|-------------------------|
| `< 768px`  | Drawer (off-canvas) | 1 | Driver-friendly mobile  |
| `768-1024` | Collapsed (icons)   | 2 | Tablet                  |
| `> 1024px` | Full (240px)        | 3-4 | Desktop dashboard        |

### Grid for KPI Cards

```tsx
<div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* 4 KPIs on desktop, 2 on mobile */}
</div>
```

---

## Charts (Recharts — used by shadcn/ui Charts)

| Data Need               | Chart Type         | Notes                             |
|-------------------------|--------------------|-----------------------------------|
| Orders per day trend    | Line / Area        | 30-day rolling, fill 15% opacity  |
| Revenue vs target       | Bar + reference line | Horizontal bar for categories   |
| Order status breakdown  | Donut (≤5 slices)  | Use status color map above        |
| Inventory levels        | Horizontal bar     | Sorted descending, threshold line |
| Payment method split    | Donut              | Cash / eSewa / Khalti / Credit    |
| Aging report buckets    | Grouped bar        | 0-30, 31-60, 61-90, 90+ days      |

**Rules:**
- All amounts on chart axes: abbreviated `रू 12.5K` not full number
- Recharts `<ResponsiveContainer width="100%" height={240}>` — always responsive
- Tooltip: show full amount + BS date
- No pie charts with > 5 slices — use bar instead
- Axis labels: `text-xs text-slate-500`

---

## Animation Rules

**Allowed (functional only):**
- State transitions: `transition-colors duration-150`
- Loading spinners: `animate-spin` on Lucide `<Loader2>`
- Skeleton loading: `animate-pulse bg-slate-200`
- Sheet/Modal open: shadcn default (transform + opacity, 200ms)
- Table sort icon rotation: `transition-transform duration-150`

**Forbidden:**
- `animate-bounce` on any UI element
- Parallax scroll effects
- Number counting animations (use static values)
- Page transition animations
- Any animation that delays showing data

```css
/* Always respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## Nepali / i18n Implementation Rules

```tsx
// app/[lang]/layout.tsx — set lang attribute
<html lang={params.lang}> {/* "en" or "ne" */}

// Product names — always show both
<span>{product.name_en}</span>
<span className="text-sm text-slate-500">{product.name_ne}</span>

// BS dates — primary display
import { adToBs } from '@panisewa/shared'
const bsDate = adToBs(order.created_at)
// Renders: "२०८१-०३-१५" or "2081-03-15" based on locale

// Money — always paisa → formatted
import { formatPaisa } from '@panisewa/shared'
<span className="font-mono">{formatPaisa(order.total)}</span>
// Renders: "रू 1,500.00"

// Invoice numbers — fiscal year in header
// INV-2081/82-000001
```

---

## Accessibility Checklist

- [ ] Color contrast ≥ 4.5:1 for all text (check `#475569` on `#FFFFFF` → passes)
- [ ] All interactive elements reachable via Tab
- [ ] Focus ring: `ring-2 ring-blue-500 ring-offset-2` on focus-visible
- [ ] All icon-only buttons have `aria-label`
- [ ] Status badges don't use color alone — include text label
- [ ] Tables have `<caption>` or `aria-label`
- [ ] `lang="ne"` set for Devanagari content blocks
- [ ] Minimum tap target 44×44px on mobile
- [ ] Skeleton loaders instead of layout-shifting spinners

---

## Anti-Patterns (Do NOT Use)

- ❌ Purple / pink / gradient backgrounds
- ❌ Glassmorphism (`backdrop-blur` on content cards)
- ❌ Decorative animations that delay data display
- ❌ Fira Code / Space Mono for Nepali prose
- ❌ Floating point for money — always integer paisa
- ❌ Raw Supabase errors surfaced to UI — use AppError
- ❌ Placeholder-only form labels
- ❌ `text-blue-900` (`#1E40AF`) for body text — too low contrast on blue-tinted bg
- ❌ Pie charts with > 5 segments
- ❌ Emojis as icons — use Lucide React exclusively
- ❌ Hardcoded strings — use `packages/shared/src/i18n/en.ts` + `ne.ts`
- ❌ Non-monospace font for amounts / IDs / order numbers

---

## shadcn/ui Component Map (Panisewa → shadcn)

| Panisewa UI Need          | shadcn Component            |
|---------------------------|-----------------------------|
| Data tables               | `Table` + TanStack Table    |
| Order status filter       | `Tabs` or `ToggleGroup`     |
| Date range picker         | `Calendar` + `Popover`      |
| Driver assignment         | `Command` (combobox)        |
| Confirmation dialogs      | `AlertDialog`               |
| Form panels               | `Sheet` (side panel)        |
| Toast notifications       | `Sonner` (toaster)          |
| Charts                    | `ChartContainer` (Recharts) |
| Navigation                | Custom sidebar + `Tooltip`  |
| Tenant switcher           | `DropdownMenu`              |

---

## Pre-Delivery Checklist

Before delivering any UI code:

- [ ] No emojis as icons (Lucide React only)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states use `transition-colors duration-150` (not layout-shifting transforms)
- [ ] Body text: `text-slate-900` or `text-slate-700` — never `text-blue-900`
- [ ] All amounts use `font-mono` and `formatPaisa()`
- [ ] Status badges include text label (not color-only)
- [ ] Devanagari text: `lang="ne"`, Noto Sans Devanagari in font stack
- [ ] Loading states: spinner on button, skeleton on content
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Focus states visible (`focus-visible:ring-2`)
