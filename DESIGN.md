---
name: Panisewa
description: Water jar delivery operations platform for Nepal — sharp, fast, bilingual.
colors:
  dispatch-blue: "#1D4ED8"
  signal-blue: "#3B82F6"
  action-orange: "#EA580C"
  delivered-green: "#16A34A"
  transit-amber: "#D97706"
  alert-red: "#DC2626"
  slate-canvas: "#F1F5F9"
  white-surface: "#FFFFFF"
  mist-border: "#E2E8F0"
  ink-text: "#0F172A"
  slate-muted: "#475569"
  ghost-disabled: "#94A3B8"
typography:
  display:
    fontFamily: "Inter, var(--font-devanagari), system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, var(--font-devanagari), system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Inter, var(--font-devanagari), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
  body:
    fontFamily: "Inter, var(--font-devanagari), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, var(--font-devanagari), system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, 'Courier New', monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-orange}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "#C2410C"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  chip-active:
    backgroundColor: "{colors.dispatch-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  chip-default:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  input-default:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink-text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.white-surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Panisewa

## 1. Overview

**Creative North Star: "The Dispatch Board"**

Panisewa looks like the screen a delivery operations manager trusts every morning: dense, readable under any light, organized by priority, nothing wasted. White surfaces on a cool slate canvas. Dispatch Blue (#1D4ED8) marks authority — active states, navigation, structural anchors. Action Orange (#EA580C) fires exactly once per view: the primary submit button. Every other element earns its presence through position and weight rather than color. JetBrains Mono carries every number, because money and order IDs demand precision.

The design is bilingual by construction. Nepali text runs at 17px with a 1.75 line height; Inter-rendered English at 14px with 1.5. The system does not treat Nepali as a "localization layer" — it is a co-primary script. Layout, spacing, and component sizing must hold without layout shifts when either language is active.

This is a commercial SaaS product competing for adoption against generic admin templates and spreadsheet workflows. Every screen must communicate that the team behind it cares about craft. Not flashy. Not decorated. Earned.

**Key Characteristics:**
- Restrained color: Dispatch Blue structures, Action Orange converts — nothing else commits to color at scale
- Mono for money: all currency amounts, order numbers, and IDs use JetBrains Mono
- Bilingual geometry: spacing and line-height accommodate Devanagari without reflows
- Ambient elevation: white surfaces over slate-100 canvas; shadows are soft and functional
- Precision over personality: status badges, financial data, and timestamps are exact, not friendly

## 2. Colors: The Dispatch Palette

Two active colors, five semantic signals, five neutrals. The palette is small by design — its restraint is the identity.

### Primary
- **Dispatch Blue** (`#1D4ED8`, oklch(43% 0.22 264)): The structural anchor. Used for active navigation items, focus rings, active filter chips, links, and the primary ring on form inputs. Present wherever the system needs to say "this is selected" or "this is where you are." Not used as a background at any significant scale.
- **Signal Blue** (`#3B82F6`, oklch(59% 0.20 264)): Hover treatment for Dispatch Blue links and the lighter focus ring tint (`primary/20`). Never appears without Dispatch Blue nearby.

### Secondary
- **Action Orange** (`#EA580C`, oklch(60% 0.22 42)): The single CTA accent. Reserved for primary action buttons ("Sign in", "New Order", "Save"). Appears at most once per viewport. Its rarity is the point.

### Tertiary
- **Delivered Green** (`#16A34A`), **Transit Amber** (`#D97706`), **Alert Red** (`#DC2626`): Semantic-only. Appear exclusively inside status badges (DELIVERED, OUT_FOR_DELIVERY/WARNING, FAILED/OVERDUE/DANGER). Never used decoratively or as backgrounds outside their badge context.

### Neutral
- **Slate Canvas** (`#F1F5F9`): Page background. The depth layer everything else sits on.
- **White Surface** (`#FFFFFF`): Cards, sidebar, form containers, modals. Pure white against Slate Canvas creates depth without shadows alone.
- **Mist Border** (`#E2E8F0`): Dividers, card outlines, input borders. Used abundantly; must not feel heavy.
- **Ink Text** (`#0F172A`): Primary text — table data, headings, form values.
- **Slate Muted** (`#475569`): Secondary text — labels, subtitles, metadata, placeholder-adjacent.
- **Ghost Disabled** (`#94A3B8`): Disabled states, placeholder text, inactive controls.

### Named Rules
**The One Orange Rule.** Action Orange is forbidden in more than one interactive element per viewport. If two elements compete for "most important action," one of them is wrong. Remove it, or demote it to a ghost button.

**The Semantic Fence Rule.** Delivered Green, Transit Amber, and Alert Red are locked to status badges. Using them for decorative accents, hover treatments, or section dividers violates the system. The semantics must be unambiguous.

## 3. Typography

**Primary Font:** Inter (variable, subsets: latin)
**Nepali Font:** Noto Sans Devanagari + Mukta (subsets: devanagari)
**Mono Font:** JetBrains Mono (subsets: latin, weights 400/500)

**Character:** Inter at the operational density of a delivery manifest — tight tracking, strong weight contrast between levels. JetBrains Mono for every number and identifier: the data reads like it was typeset by someone who cared. Noto Sans Devanagari and Mukta at 17px with generous line-height so complex glyphs breathe without dominating the layout.

### Hierarchy
- **Display** (700, 2rem / 32px, line-height 1.2, tracking -0.02em): Page-level headings ("Dashboard", "Orders"). Used once per route.
- **Headline** (700, 1.5rem / 24px, line-height 1.3): Card or modal titles. One per major section.
- **Title** (600, 0.875rem / 14px, line-height 1.4, tracking +0.01em): Table column headers, section labels, form group labels. Uppercase only for status badges (via font-weight, not letter-spacing).
- **Body** (400, 0.875rem / 14px, line-height 1.5): Table rows, form input text, descriptive copy. Max line length 70ch on prose surfaces.
- **Label** (500, 0.75rem / 12px, line-height 1.4): Badge text, chip labels, help text, timestamps.
- **Mono** (JetBrains Mono 400/500, 0.875rem / 14px, line-height 1.5): All currency amounts (रू 150.00), order numbers (ORD-001), invoice numbers (INV-2081/82-000001), product SKUs, IDs. Non-negotiable.

**Nepali override** (`:lang(ne)`): 1.0625rem (17px), line-height 1.75. Applies to any element inside a `lang="ne"` ancestor. Do not suppress this override in components.

### Named Rules
**The Mono Money Rule.** Every paisa amount, order number, invoice number, or unique identifier is rendered in JetBrains Mono. No exceptions. Mixed-script rows (Nepali label, mono number) are expected and correct.

**The Weight Bridge Rule.** Adjacent type roles must differ by at least one step in either weight or size. A 14px/600 label next to 14px/400 body is acceptable. Two 14px/400 strings with different classes are invisible to hierarchy.

## 4. Elevation

Ambient and functional. The system is not flat — White Surface over Slate Canvas already implies depth, and a four-step shadow scale extends it. But shadows are never decorative: they respond to state (resting, hover, floating) rather than communicating brand personality.

The page background (`#F1F5F9`) is the base layer. All content surfaces (`#FFFFFF`) appear naturally lifted without shadow. Shadows then communicate *how lifted* — not *whether lifted*.

### Shadow Vocabulary
- **Hairline** (`0 1px 2px rgba(0,0,0,0.04)`): Table row hover, subtle input lift. Almost invisible; used where the eye needs gentle confirmation of interactivity.
- **Ambient** (`0 1px 3px rgba(0,0,0,0.08)`): Card resting state. The default lift for all surface containers.
- **Raised** (`0 4px 6px rgba(0,0,0,0.07)`): Dropdown menus, active popovers, floating labels.
- **Floating** (`0 10px 15px rgba(0,0,0,0.08)`): Modals, sheets, drawers. Maximum elevation in the system.

### Named Rules
**The Ambient Lift Rule.** Cards float at resting state via Ambient shadow. Shadows escalate only in response to state (hover, modal, floating). They are never applied for decoration, and they are never removed from cards to achieve a "flat" aesthetic.

**The Outdoor Contrast Rule.** Shadow opacity values are capped at 0.08. Heavier shadows (0.15+) look muddy on the warm ambient light of outdoor mobile screens used by drivers and field staff in Nepal.

## 5. Components

### Buttons
Clean, confident edges. No rounded-pill. No decorative gradients.

- **Shape:** Gently curved (6px radius, `rounded-md`)
- **Primary:** Action Orange (`#EA580C`) background, white text, `px-4 py-2.5`, 14px semibold (600). Hover: deepens to `#C2410C` (orange-700). Focus: 2px ring in Action Orange with 2px offset. Disabled: 60% opacity.
- **Ghost / Secondary:** White background, Mist Border border, Slate Muted text, same radius and size. Hover: Slate Canvas background. Used for filters, secondary actions, pagination.
- **Icon-only:** Square, `p-1.5`, rounded-md, text-slate-400 hover:text-dispatch-blue. No background at rest.

### Chips (Filter tabs)
- **Active:** Dispatch Blue background, white text, rounded-md, `px-3 py-1.5`, 14px medium.
- **Default:** White background, Mist Border border, Slate Muted text, same sizing. Hover: Slate Canvas background.
- **Group behavior:** One chip is always active. Clicking active chip does nothing; clicking another deactivates the current.

### Cards / Containers
The primary surface unit. All data tables, form sections, and KPI panels live inside cards.

- **Corner Style:** Gently curved (8px, `rounded-lg`)
- **Background:** White Surface (`#FFFFFF`)
- **Shadow:** Ambient (`shadow-sm`) at rest
- **Border:** Mist Border (`#E2E8F0`, 1px)
- **Internal Padding:** 24px on all sides for content cards; section headers use `px-6 py-4` with a bottom border divider before content.

### Inputs / Fields
- **Style:** White background, Mist Border (1px), rounded-md (6px), `px-3 py-2`, 14px body text
- **Focus:** 2px ring in Dispatch Blue at 20% opacity (`ring-primary/20`), border shifts to Dispatch Blue solid
- **Error:** Border shifts to Alert Red, ring in Alert Red at 20%, error message in Alert Red 12px below
- **Disabled:** Ghost Disabled text, Slate Canvas background, cursor-not-allowed
- **Password toggle:** Eye icon button at right edge, text-ghost-disabled hover:text-slate-muted, absolutely positioned

### Navigation
- **Desktop sidebar:** White surface, 240px wide, border-r Mist Border. Persistent, no collapse on desktop.
- **Nav item default:** text-slate-muted (600), `px-3 py-2 rounded-md`, `gap-3`, 14px medium. Hover: Slate Canvas bg, Ink Text color.
- **Nav item active:** Dispatch Blue 50 background (`bg-blue-50`), Dispatch Blue text, rounded-md. Uses `aria-current="page"`.
- **Mobile:** Sidebar hidden (`md:hidden`); replaced by 56px top bar (white, border-b) with hamburger and logo. Hamburger opens left Sheet drawer (288px, `max-w-[80vw]`), same nav content.
- **User footer:** Name + email in 12px, then sign-out button, separated by a top border from nav.

### Status Badge
Signature component. Appears in every data table.

- **Shape:** Fully rounded pill (`rounded`, not `rounded-full`), `px-2 py-0.5`, 12px medium
- **Delivered / Active / Paid:** Delivered Green 50 bg (`bg-green-50`), Delivered Green text
- **Out for delivery / Trial / Partial:** Transit Amber 50 bg (`bg-amber-50`), Transit Amber text
- **Draft / Inactive / Cancelled:** Slate Canvas bg (`bg-slate-100`), Ghost Disabled text
- **Failed / Overdue:** Alert Red 50 bg (`bg-red-50`), Alert Red text
- **Confirmed / Sent:** Dispatch Blue 50 bg (`bg-blue-50`), Dispatch Blue text
- **Assigned:** Indigo 50 bg (`bg-indigo-50`), indigo-700 text
- **Text:** Always uppercase

## 6. Do's and Don'ts

### Do:
- **Do** render all currency amounts, order numbers, invoice numbers, and IDs in JetBrains Mono — even inside Nepali-language contexts.
- **Do** use Dispatch Blue (`#1D4ED8`) for active/selected state indicators and structural anchors only. It is not a background color for large areas.
- **Do** reserve Action Orange (`#EA580C`) for the single primary action button per view. Everything else is ghost or secondary.
- **Do** use a `1.0625rem / 1.75` line-height override for all Nepali text via `:lang(ne)`. Do not suppress this in components.
- **Do** wrap data tables in `overflow-x-auto` inside their card containers. Mobile viewports are real; column truncation is unacceptable for financial data.
- **Do** use `shadow-sm` (Ambient) on every card at rest. White on Slate Canvas alone is insufficient; the border alone is insufficient.
- **Do** use semantic Green/Amber/Red exclusively inside status badges, and never for any other decorative purpose.
- **Do** maintain WCAG AA contrast for all text: Ink Text on White Surface and on Slate Canvas both pass. Never use Ghost Disabled text on Slate Canvas for meaningful content.

### Don't:
- **Don't** use Bootstrap/jQuery-era admin patterns: cramped sidebars stacked with icon-and-label rows, DataTables-style toolbars above tables, gray card borders on gray backgrounds. This is what Panisewa replaces.
- **Don't** add pastel or "startup-cute" treatments: excessive border-radius (no `rounded-2xl` or `rounded-full` on cards), bouncy animations, gradient CTA buttons, gradient card headers.
- **Don't** use the "SaaS dashboard monoculture": dark sidebar + white content + teal accent + 3-column KPI card grid with big numbers and gradient underlines. That aesthetic is prohibited by name.
- **Don't** apply border-left or border-right greater than 1px as a colored stripe accent on any element. Rewrite with full borders, background tints, or nothing.
- **Don't** use gradient text (`background-clip: text` + gradient). Every text element uses a single solid color.
- **Don't** import Fira Code, Source Code Pro, or any non-JetBrains mono font for numbers. The mono font stack is JetBrains Mono exclusively.
- **Don't** invent new semantic colors. Delivered Green, Transit Amber, and Alert Red are locked to their statuses. A "pending" state that needs yellow is Transit Amber, not a new color.
- **Don't** render Nepali text without the Noto Sans Devanagari / Mukta font stack. System-ui Devanagari rendering on Android is unreliable.
- **Don't** use `border-left` or `border-right` > 1px as a decorative accent stripe on any card, list item, callout, or alert.
