# Tasks: Notion to Slides Chrome Extension

**Input**: Design documents from `/specs/001-notion-to-slides/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included based on Constitution V (Test-First Discipline) requirement. All user stories have acceptance tests written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Browser Extension**: `src/pages/`, `src/components/`, `src/lib/`, `src/types/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Paths follow existing Presenotion template structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic configuration

- [X] T001 Install testing dependencies (vitest, @vitest/ui, playwright, @playwright/test, @axe-core/playwright) via bun
- [X] T002 Create vitest.config.ts with jsdom environment and test setup configuration
- [X] T003 Create playwright.config.ts with Chrome extension loading configuration
- [X] T004 Create tests/setup.ts for global test setup and mocks
- [X] T005 [P] Update manifest.json with Notion permissions and keyboard commands
- [X] T006 [P] Create src/types/notion.ts with NotionBlock, Slide, SlideDeck, NavigationState, ExtensionMessage interfaces

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create src/lib/slideGenerator.ts with basic slide generation skeleton (H1 boundary detection logic)
- [X] T008 Create src/lib/fontScaler.ts with dynamic font scaling calculation algorithm
- [X] T009 [P] Create src/lib/keyboardHandler.ts with keyboard event handling setup
- [X] T010 [P] Create src/pages/content/parser.ts with Notion DOM parsing using ARIA roles and CSS selectors
- [X] T011 Create src/components/SlideViewer/SlideViewer.tsx with main slide viewer component skeleton
- [X] T012 [P] Create src/components/SlideViewer/Slide.tsx with individual slide rendering component
- [X] T013 [P] Create src/components/SlideViewer/Navigation.tsx with navigation controls (prev/next buttons)
- [X] T014 [P] Create src/components/SlideViewer/SlideCounter.tsx with "slide X of Y" counter component

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Notion Page to Slide Conversion (Priority: P1) 🎯 MVP

**Goal**: Users can click extension icon to convert Notion page into slides with H1 boundaries and navigate with keyboard

**Independent Test**: Open any Notion page, click extension icon, verify slide presentation appears with keyboard navigation working

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014a [P] [US1] E2E test for extension loading and configuration in tests/e2e/extensionLoad.spec.ts (5 automated tests)
- [X] T015 [P] [US1] E2E test for popup activation and slide display in tests/e2e/basicConversion.spec.ts (4 manual test cases - see tests/e2e/README.md)
- [X] T016 [P] [US1] E2E test for keyboard navigation (arrows, Escape) in tests/e2e/basicConversion.spec.ts (9 manual test cases - see tests/e2e/README.md)
- [X] T017 [P] [US1] Unit test for H1 boundary slide generation in tests/unit/slideGenerator.test.ts
- [X] T018 [P] [US1] Unit test for Notion DOM parsing with H1 headings in tests/unit/parser.test.ts
- [X] T019 [P] [US1] Integration test for full parsing to slide generation flow in tests/integration/notionParsing.test.ts

> **E2E Testing Strategy**:
> - **Automated** (5 tests): Extension loading, manifest validation, file existence
> - **Manual** (13 test cases): User interactions, popup activation, keyboard navigation
> - See `tests/e2e/README.md` for manual testing checklist

### Implementation for User Story 1

- [X] T020 [US1] Implement parseNotionPage() in src/pages/content/parser.ts to extract NotionBlocks using ARIA role="heading" and data-block-id
- [X] T021 [US1] Implement generateSlides() in src/lib/slideGenerator.ts to group blocks by H1 headings
- [X] T022 [US1] Implement useSlideNavigation() custom hook in src/lib/keyboardHandler.ts with arrow keys, Escape handlers
- [X] T023 [US1] Implement SlideViewer component in src/components/SlideViewer/SlideViewer.tsx with slide state management
- [X] T024 [US1] Implement Slide component rendering in src/components/SlideViewer/Slide.tsx with title and basic content display
- [X] T025 [US1] Update src/pages/popup/Popup.tsx to send start_presentation message to content script
- [X] T026 [US1] Implement message listener in src/pages/content/index.tsx to receive start_presentation and trigger parsing
- [X] T027 [US1] Inject SlideViewer overlay into Notion page DOM in src/pages/content/index.tsx
- [X] T028 [US1] Add close button handler to Navigation component to send close_presentation message
- [X] T029 [US1] Implement slide counter display in SlideCounter component showing "slide X of Y"

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP complete!)

---

## Phase 4: User Story 2 - Content Structure Preservation (Priority: P2)

**Goal**: Notion page formatting (bold, italic, lists, images, code blocks) is preserved in slide rendering

**Independent Test**: Create Notion page with various formatting, convert to slides, verify all formatting appears correctly

### Tests for User Story 2 ⚠️

- [ ] T030 [P] [US2] E2E test for text formatting preservation (bold, italic) in tests/e2e/formatting.spec.ts
- [ ] T031 [P] [US2] E2E test for list rendering (bullet, numbered) in tests/e2e/formatting.spec.ts
- [ ] T032 [P] [US2] E2E test for image display with alt text in tests/e2e/formatting.spec.ts
- [ ] T033 [P] [US2] E2E test for code block rendering with monospace font in tests/e2e/formatting.spec.ts
- [ ] T034 [P] [US2] Unit test for TextFormatting extraction from Notion DOM in tests/unit/parser.test.ts

### Implementation for User Story 2

- [ ] T035 [P] [US2] Extend parseNotionPage() in src/pages/content/parser.ts to extract TextFormatting (bold, italic, underline)
- [ ] T036 [P] [US2] Extend parseNotionPage() to extract bullet lists with role="list" and listItems
- [ ] T037 [P] [US2] Extend parseNotionPage() to extract numbered lists and preserve list type
- [ ] T038 [P] [US2] Extend parseNotionPage() to extract images with imageUrl and imageAlt attributes
- [ ] T039 [P] [US2] Extend parseNotionPage() to extract code blocks with codeLanguage attribute
- [ ] T040 [US2] Implement formatted text rendering in Slide component with <strong>, <em>, <u> tags
- [ ] T041 [US2] Implement list rendering in Slide component with <ul> and <ol> elements
- [ ] T042 [US2] Implement image rendering in Slide component with <img> tags and alt text
- [ ] T043 [US2] Implement code block rendering in Slide component with monospace font and syntax preservation
- [ ] T044 [US2] Add CSS styling in src/pages/content/style.css for formatted content in slides

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently with professional formatting

---

## Phase 5: User Story 3 - Slide Navigation and Controls (Priority: P3)

**Goal**: Enhanced navigation with Home/End keys, number jump, and visual slide counter

**Independent Test**: Open slide presentation, verify all navigation methods (keyboard shortcuts, slide counter) work correctly

### Tests for User Story 3 ⚠️

- [ ] T045 [P] [US3] E2E test for Home key navigation to first slide in tests/e2e/navigation.spec.ts
- [ ] T046 [P] [US3] E2E test for End key navigation to last slide in tests/e2e/navigation.spec.ts
- [ ] T047 [P] [US3] E2E test for number key + Enter navigation in tests/e2e/navigation.spec.ts
- [ ] T048 [P] [US3] Unit test for slide counter display logic in tests/unit/SlideCounter.test.ts

### Implementation for User Story 3

- [ ] T049 [P] [US3] Extend useSlideNavigation() hook to handle Home key (jump to first slide)
- [ ] T050 [P] [US3] Extend useSlideNavigation() hook to handle End key (jump to last slide)
- [ ] T051 [US3] Implement number key + Enter handler in useSlideNavigation() for direct slide jump
- [ ] T052 [US3] Update SlideCounter component to display current/total with visual styling
- [ ] T053 [US3] Add keyboard shortcut hints UI to Navigation component (optional overlay)

**Checkpoint**: All user stories should now be independently functional with complete navigation

---

## Phase 6: Font Scaling & Edge Cases (Cross-Cutting Enhancement)

**Goal**: Automatically scale font for long content and handle edge cases gracefully

**Purpose**: Improvements that affect multiple user stories

- [ ] T054 [P] [US1] Implement calculateFontSize() in src/lib/fontScaler.ts with viewport ratio algorithm
- [ ] T055 [US1] Integrate font scaling into Slide component to measure content height and apply fontSize
- [ ] T056 [P] Unit test for font scaling algorithm in tests/unit/fontScaler.test.ts
- [ ] T057 [P] Handle empty Notion page edge case with "No content to display" message in parser.ts
- [ ] T058 [P] Handle page with no headings edge case by treating entire page as single slide in slideGenerator.ts
- [ ] T059 [P] Handle unsupported content types (databases, embeds) with placeholder "[Unsupported content]" in parser.ts
- [ ] T060 Handle non-Notion page activation by checking domain in src/pages/content/index.tsx and showing error

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [ ] T061 [P] Add ARIA labels to SlideViewer for screen reader accessibility (role="region", aria-label)
- [ ] T062 [P] Add ARIA live region for slide counter announcements
- [ ] T063 [P] Implement keyboard focus management for slide navigation
- [ ] T064 [P] Add WCAG AA color contrast validation for slide UI using axe-core
- [ ] T065 [P] Create quickstart.md validation test to verify development setup works
- [ ] T066 [P] Add error boundary component to catch and display parsing errors gracefully
- [ ] T067 Code cleanup and refactoring for consistency across all components
- [ ] T068 [P] Performance optimization: Measure and log parsing/rendering times per SC-001 and SC-003
- [ ] T069 [P] Security review: Validate image URL sanitization and XSS protection
- [ ] T070 Run full E2E test suite and verify all acceptance scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Font Scaling & Edge Cases (Phase 6)**: Depends on User Story 1 completion (needs basic slides)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends User Story 1 parser but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends User Story 1 navigation but independently testable

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Parser extensions before slide rendering
- Core navigation logic before enhanced shortcuts
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T006)
- All Foundational tasks marked [P] can run in parallel (T008-T014)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel (T015-T019, T030-T034, T045-T048)
- Models/components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "E2E test for popup activation and slide display in tests/e2e/basicConversion.spec.ts"
Task: "E2E test for keyboard navigation in tests/e2e/basicConversion.spec.ts"
Task: "Unit test for H1 boundary slide generation in tests/unit/slideGenerator.test.ts"
Task: "Unit test for Notion DOM parsing in tests/unit/parser.test.ts"
Task: "Integration test for full parsing flow in tests/integration/notionParsing.test.ts"

# Launch all foundational components for User Story 1 together:
Task: "Implement parseNotionPage() in src/pages/content/parser.ts"
Task: "Implement generateSlides() in src/lib/slideGenerator.ts"
Task: "Implement useSlideNavigation() in src/lib/keyboardHandler.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T014) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T015-T029)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready (basic slide conversion works!)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (T015-T029) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (T030-T044) → Test independently → Deploy/Demo (professional formatting!)
4. Add User Story 3 (T045-T053) → Test independently → Deploy/Demo (enhanced navigation!)
5. Add Font Scaling & Edge Cases (T054-T060) → Test robustness
6. Polish (T061-T070) → Final quality pass
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T014)
2. Once Foundational is done:
   - Developer A: User Story 1 (T015-T029)
   - Developer B: User Story 2 (T030-T044) - can start in parallel
   - Developer C: User Story 3 (T045-T053) - can start in parallel
3. Stories complete and integrate independently
4. Team converges on Font Scaling & Polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary

**Total Tasks**: 70
**User Story 1 (MVP)**: 15 tasks (T015-T029)
**User Story 2**: 15 tasks (T030-T044)
**User Story 3**: 9 tasks (T045-T053)
**Setup + Foundational**: 14 tasks (T001-T014)
**Edge Cases & Polish**: 17 tasks (T054-T070)

**Parallel Opportunities**: 45 tasks marked [P] can run in parallel within their phases

**MVP Scope**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1) = 29 tasks for minimum viable product

**Independent Testing**: Each user story phase includes tests and can be deployed independently after completion
