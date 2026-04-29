---
name: Sacred Scholarly
colors:
  surface: '#f9faee'
  surface-dim: '#dadbcf'
  surface-bright: '#f9faee'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f5e8'
  surface-container: '#eeefe3'
  surface-container-high: '#e8e9dd'
  surface-container-highest: '#e2e3d8'
  on-surface: '#1a1d15'
  on-surface-variant: '#43493a'
  inverse-surface: '#2f3129'
  inverse-on-surface: '#f0f2e6'
  outline: '#747969'
  outline-variant: '#c3c9b6'
  surface-tint: '#436909'
  primary: '#436909'
  on-primary: '#ffffff'
  primary-container: '#8cb753'
  on-primary-container: '#2a4600'
  inverse-primary: '#a8d46c'
  secondary: '#2a6a41'
  on-secondary: '#ffffff'
  secondary-container: '#abefbb'
  on-secondary-container: '#2e6f45'
  tertiary: '#416838'
  on-tertiary: '#ffffff'
  tertiary-container: '#8bb57e'
  on-tertiary-container: '#22471b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c3f185'
  primary-fixed-dim: '#a8d46c'
  on-primary-fixed: '#112000'
  on-primary-fixed-variant: '#304f00'
  secondary-fixed: '#aef2bd'
  secondary-fixed-dim: '#93d6a3'
  on-secondary-fixed: '#00210d'
  on-secondary-fixed-variant: '#0a522b'
  tertiary-fixed: '#c2efb3'
  tertiary-fixed-dim: '#a7d298'
  on-tertiary-fixed: '#002200'
  on-tertiary-fixed-variant: '#2a4f23'
  background: '#f9faee'
  on-background: '#1a1d15'
  surface-variant: '#e2e3d8'
typography:
  headline-xl:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.4'
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.7'
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system is rooted in the concept of "Sacred Academia," a visual language that bridges the gap between traditional Islamic scholarship and modern educational environments. It aims to evoke a sense of tranquility, intellectual clarity, and organic growth.

The chosen style is a blend of **Minimalism** and **Modern Corporate**, utilizing generous white space and high-quality serif typography to suggest authority and heritage. However, unlike cold corporate systems, this system uses a "living" color palette of greens to introduce an organic, peaceful energy. Visual elements should feel breathable, orderly, and intentional, reflecting the discipline and beauty of spiritual study.

## Colors

The color palette is derived from nature, symbolizing growth and renewal. **Willow Green** serves as the primary brand color, used for key actions and focal points. **Turf Green** provides depth and is used for secondary actions or structural elements to anchor the design. 

The surface logic relies heavily on **Honeydew**, which creates a soft, non-fatiguing reading environment compared to pure white. **Tea Green** and **Muted Olive** are reserved for decorative accents, subtle backgrounds for content blocks, or secondary labels. 

Contrast should be maintained by using dark Turf Green for text against the Honeydew background to ensure maximum legibility for long-form scholarly reading.

## Typography

Typography is the cornerstone of this design system, reflecting the academy’s scholarly mission. **Noto Serif** is used for all headlines to establish a classic, authoritative feel that honors the tradition of manuscripts and literature. 

**Work Sans** is the workhorse for body text and functional UI. Its clean, slightly wider proportions provide excellent readability and a contemporary balance to the serif headers. To maintain the "peaceful" vibe, body text should utilize a generous line-height (1.6 to 1.7) to allow the text to breathe. Uppercase styling should be used sparingly for small labels to create a sense of categorization without appearing aggressive.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for desktop to ensure scholarly content is framed properly, similar to the margins of a classic book. A 12-column grid is utilized with a maximum container width of 1200px.

A strict 8px spacing system maintains a rhythmic harmony across the interface. Large internal padding (xl and 2xl) is encouraged within content sections to promote a sense of "mental space" and focus. Gutters are kept wide at 24px to prevent the interface from feeling crowded, reinforcing the academic and peaceful atmosphere.

## Elevation & Depth

This design system avoids heavy shadows and floating effects in favor of **Tonal Layers**. Hierarchy is primarily achieved by placing darker or lighter containers against the Honeydew background.

When physical depth is necessary, use **Ambient Shadows**. These shadows should be extremely soft, with a large blur radius and a subtle green tint (derived from Turf Green) instead of neutral gray. This maintains the "organic" feel. Low-contrast outlines using a 1px border in Tea Green are the preferred method for defining cards and input fields, keeping the UI flat and scholarly rather than overly technical.

## Shapes

The shape language is **Rounded**, utilizing a base 0.5rem (8px) radius for standard components like buttons and inputs. Larger components like cards and featured modules use 1rem (16px) to 1.5rem (24px) corner radii.

These soft curves echo the natural forms found in organic growth and Islamic geometry, avoiding the harshness of sharp corners. The goal is to make the interface feel welcoming and safe, like a garden or a well-kept library.

## Components

### Buttons
Primary buttons use a solid Willow Green background with white text. Secondary buttons utilize a Turf Green outline with a subtle Honeydew hover state. The focus state should always be clearly visible with a Tea Green ring.

### Cards
Cards are the primary vessel for courses and lessons. They should feature a Tea Green 1px border and a background that is either pure white or a slightly lighter shade of Honeydew to distinguish them from the main surface.

### Chips & Tags
Used for academic subjects (e.g., *Arabic, Tajweed, Fiqh*). These should be pill-shaped with a background of Tea Green and text in Turf Green.

### Input Fields
Inputs use a white background with a 1px Muted Olive border. On focus, the border transitions to Willow Green. Label text should always be in Work Sans Bold for clarity.

### Scholarly Blocks
Specific to the academy, "Verse" or "Citation" blocks should be styled with a Turf Green left-accent border and an italicized Noto Serif font to denote quoted or sacred text.

### Navigation
The navigation bar should be clean and minimalist, utilizing Noto Serif for the logo and Work Sans for menu items. A subtle Tea Green bottom border can be used to separate the navigation from the content.