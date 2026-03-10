# NeonBoard Design System Specification

## Core Design Principles
1.  **Neon-Dark Aesthetic**: High-contrast, vibrant accents on a near-black background.
2.  **Glastomorphism**: Semi-transparent, blurred surfaces to create depth and hierarchy.
3.  **Maximum Clarity**: Clear, bold typography and distinct color-coded indicators (e.g., View/Edit modes).
4.  **Premium Feedback**: Subtle micro-animations, glows, and transitions (Framer Motion).
5.  **Technical Focus**: Clean, monospaced or modern sans-serif fonts for a "technical tutoring" feel.

---

## Color Palette

### Base Colors
- **Background**: `#050505` (Deep Black)
- **Foreground**: `#ededed` (Off-white)
- **Surface**: `#0a0a0a` (Slightly lighter black for cards/containers)
- **Border**: `rgba(255, 255, 255, 0.1)` (Subtle white borders)

### Primary Branding
- **Neon Green**: `#CCFF00`
    - Used for: Primary CTA buttons, "Edit" mode indicators, notifications, selection halos.
    - Hover: `#b3e600`
    - Glow: `rgba(204, 255, 0, 0.3)` to `0.5`

### Functional Colors
- **Success (Edit)**: `#34C759` (Apple-style green)
- **Warning (Lasso/Eraser)**: `#FFCC00` (Optional/Contextual)
- **Alert/Locked**: `#FF2D55` (Pinkish-red)
    - Used for: Force-view locks, specific destructive actions.
- **Muted/Hidden**: `#666666` (Medium Gray)

---

## Typography

### Font Families
- **Sans-Serif**: `Geist Sans` (Primary for headings and body)
- **Monospace**: `Geist Mono` (For technical indicators, room codes, "Connecting" states)

### Text Styles
- **Hero Title**: `text-5xl` to `text-7xl`, `font-black`, `tracking-tighter`, `bg-gradient-to-b from-white to-gray-500`
- **Section Heading**: `text-4xl`, `font-black`, `tracking-tight`
- **Component Label**: `font-bold`, `tracking-wider`, `text-sm`
- **Muted Text**: `text-gray-400`, `text-base`

---

## Effects & Components

### 1. Glassmorphism (Standard Surface)
- **Background**: `rgba(31, 31, 31, 0.8)` or `white/[0.02]`
- **Blur**: `backdrop-blur-3xl` or `backdrop-blur-xl`
- **Border**: `border-white/10`
- **Shadow**: `shadow-[0_0_50px_rgba(0,0,0,0.8)]`

### 2. Primary Buttons
- **Style**: `rounded-full`, `font-extrabold`, `px-8`, `py-4`
- **Background**: `#CCFF00`
- **Text**: `black`
- **Shadow**: `shadow-[0_0_40px_rgba(204, 255, 0, 0.3)]`
- **Transiton**: `hover:scale-105 active:scale-95 duration-200`

### 3. Toolbars & Overlays
- **Positioning**: Absolute (top-8 right-8, or bottom-8 center).
- **Style**: Floating, rounded-full or rounded-2xl.
- **Indicators**: 16-20px icons (`lucide-react`) within high-contrast containers.

### 4. Interactive States
- **Hover**: Transition from `white/5` to `white/10` background for secondary items.
- **Focus/Selection**: Neon Green border or glow.
- **Motion**: Use `framer-motion` for entry/exit (fade-in, zoom-in-95).

---

## Layout & Responsiveness
- **Max Width**: `1200px` for main content containers.
- **Padding**: `px-6` (Mobile), `px-8` (Desktop).
- **Dead Zones**: Ensure toolbars don't overlap critical drawing areas on mobile.
- **Breakpoints**:
    - `md`: 768px (Switch to desktop toolbar layout)
    - `lg`: 1024px (Hero graphic rotation/scaling)

---

## Implementation Guidelines for Agents
- **Icons**: Always use `lucide-react`.
- **Animations**: Prefer `framer-motion` for layout transitions.
- **Consistency**: Use CSS variables (`--background`, `--foreground`) where possible, falling back to Tailwind arbitrary values for specific neon effects.
- **Purity**: Avoid generic colors; always stick to the `#CCFF00` or `#050505` based palette.
