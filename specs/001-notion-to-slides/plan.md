# Implementation Plan: Notion to Slides

**Branch**: `001-notion-to-slides` | **Date**: 2025-11-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-notion-to-slides/spec.md`

## Summary

Convert Notion pages into presentation slides entirely within the browser. The extension parses Notion page content (headings, text, lists, images) and displays it in a full-screen slide view with keyboard navigation. H1 headings define slide boundaries. All processing occurs locally without external server communication. Target performance: <5 seconds from click to presentation, <100ms navigation response.

## Technical Context

**Language/Version**: TypeScript 5.8+ with React 19
**Primary Dependencies**:
- React 19.1.0 (UI components)
- webextension-polyfill 0.12.0 (cross-browser compatibility)
- Tailwind CSS 4.1+ (styling)
- Vite 6.3+ (build tool)

**Storage**: None (no persistent storage required per FR-013)
**Testing**: Vitest 2.1+ (unit/integration), Playwright 1.51+ (E2E), axe-core (accessibility)
**Target Platform**: Chrome browser with Manifest V3, Firefox support via webextension-polyfill
**Project Type**: Browser extension (single project structure with extension pages)
**Performance Goals**:
- <5 seconds: Click to presentation start (SC-001)
- <100ms: Navigation response time (SC-003)
- Support 20+ slide presentations without degradation (SC-005)

**Constraints**:
- Local-only processing (no external API calls, FR-002)
- No data persistence beyond session (FR-013)
- Must work offline after page load (FR-012, SC-004)
- Notion DOM structure dependency (fragile, may break with Notion updates)

**Scale/Scope**:
- Single-user, client-side only
- Target: Typical Notion pages (10-50 content blocks, 5-20 slides)
- Edge case: Up to 100+ slides with performance testing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. User Experience First ✅

**Compliance**: PASS
- Extension activates with single click (FR-001, acceptance scenario 1)
- Keyboard shortcuts for all navigation (FR-007, arrow keys/Escape)
- Intuitive slide counter UI (FR-011, "slide X of Y")
- No setup required, works immediately on Notion pages

**Verification**: User testing with 5-10 Notion users confirming <30 seconds to first successful presentation

### II. Performance as a Feature ✅

**Compliance**: PASS
- Performance budgets defined in spec (SC-001: <5s, SC-003: <100ms)
- Success criteria explicitly measure response times
- FR-015 addresses long content with font scaling instead of degrading UX

**Verification**: Performance regression tests track parsing time, render time, navigation latency

### III. Security by Design ✅

**Compliance**: PASS
- No data transmission (FR-002, SC-007 verifiable via network monitoring)
- No persistent storage (FR-013, ephemeral session data only)
- Content stays in browser, never leaves user's machine
- Minimal permissions required (activeTab for Notion page access)

**Threat Model**:
- Attack surface: Notion DOM parsing (potential XSS if malicious content injected)
- Mitigation: Use React's built-in XSS protection, sanitize extracted content
- No auth/credentials required, so no credential theft risk

**Verification**: Manual network audit, automated security dependency scanning

### IV. Accessibility Without Compromise ✅

**Compliance**: PASS
- Full keyboard navigation mandatory (FR-007)
- Screen reader compatibility required (announce slide numbers, content changes)
- Color contrast for slide UI components (WCAG AA)
- Alt text preservation from Notion images (FR-010)

**Verification**:
- Automated: axe-core accessibility testing in CI
- Manual: Screen reader testing (NVDA/JAWS) for slide navigation

### V. Test-First Discipline ✅

**Compliance**: PASS
- Spec defines acceptance scenarios for each user story (3 stories, 9 scenarios total)
- Tests must validate FR-001 through FR-015
- Test categories: Unit (parsing logic), Integration (DOM extraction), E2E (full user flow)

**Test Strategy**:
1. Write E2E tests for acceptance scenarios before implementation
2. Unit tests for slide generation logic (H1 boundary detection, font scaling)
3. Integration tests for Notion DOM parsing

**Verification**: All acceptance scenarios have corresponding automated tests that fail pre-implementation

### Constitution Check Result: ✅ PASS

No violations identified. Feature aligns with all five core principles. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-notion-to-slides/
├── plan.md              # This file
├── research.md          # Phase 0 output (technology decisions)
├── data-model.md        # Phase 1 output (data structures)
├── quickstart.md        # Phase 1 output (usage guide)
├── contracts/           # Phase 1 output (content script API)
└── checklists/
    └── requirements.md  # Spec quality checklist (completed)
```

### Source Code (repository root)

```text
src/
├── pages/
│   ├── content/         # Content script for Notion page parsing
│   │   ├── index.tsx    # Entry point, DOM observer
│   │   ├── parser.ts    # Notion DOM parsing logic
│   │   └── style.css    # Content script styles
│   ├── popup/           # Extension popup (trigger button)
│   │   ├── index.tsx    # Popup UI
│   │   └── Popup.tsx    # Main popup component
│   └── background/      # Background service worker (if needed)
│       └── index.ts     # Message passing coordinator
├── components/          # Shared React components
│   └── SlideViewer/     # Slide presentation component
│       ├── SlideViewer.tsx       # Main slide viewer
│       ├── Slide.tsx             # Individual slide component
│       ├── Navigation.tsx        # Navigation controls
│       └── SlideCounter.tsx      # Slide counter UI
├── lib/                 # Core business logic
│   ├── slideGenerator.ts         # Convert Notion blocks to slides
│   ├── fontScaler.ts             # Automatic font size adjustment
│   └── keyboardHandler.ts        # Keyboard shortcut management
└── types/
    └── notion.ts        # TypeScript interfaces for Notion content

tests/
├── unit/
│   ├── slideGenerator.test.ts   # Slide generation logic
│   ├── fontScaler.test.ts       # Font scaling algorithm
│   └── parser.test.ts           # DOM parsing logic
├── integration/
│   └── notionParsing.test.ts    # Full DOM extraction flow
└── e2e/
    ├── basicConversion.spec.ts  # User Story 1 scenarios
    ├── formatting.spec.ts       # User Story 2 scenarios
    └── navigation.spec.ts       # User Story 3 scenarios

public/
├── icon-128.png         # Extension icons
├── icon-32.png
└── contentStyle.css     # Injected styles for slide overlay

manifest.json            # Extension manifest (Manifest V3)
```

**Structure Decision**: Single project (browser extension) structure. Extension uses:
- **Content script** (`src/pages/content/`) to parse Notion DOM and inject slide viewer
- **Popup** (`src/pages/popup/`) as activation trigger (alternative to content script button)
- **Shared components** (`src/components/SlideViewer/`) for slide presentation UI
- **Core logic** (`src/lib/`) for platform-agnostic slide generation

This structure separates concerns (parsing, generation, presentation) while keeping all extension code in one project, matching existing Presenotion template organization.

## Complexity Tracking

> **No complexity violations identified** - Constitution Check passed without requiring justifications.
