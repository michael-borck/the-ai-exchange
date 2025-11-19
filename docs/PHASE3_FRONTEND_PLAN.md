# Frontend Redesign - Phase 3 Implementation Plan

**Goal**: Transform basic CRUD interface into collaborative "AirTable + Notion" experience
**Timeline**: 3-4 weeks
**Status**: Starting

---

## Design System & Component Library

### Color Palette (from ui-ux-ideas.md)
- **Primary**: Curtin Navy (#012144)
- **Secondary**: Warm Grey (#F5F5F5)
- **Accent**: Curtin Gold (#F0B323)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)
- **Info**: Blue (#3B82F6)

### Typography
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Code**: Fira Code (monospace)

### Spacing System
- Base unit: 4px
- Common: 8px, 16px, 24px, 32px, 48px

### Component Library (Chakra UI)
- Cards with hover elevation
- Filter sidebar with checkboxes
- Tag/badge pills
- Button variants (primary, secondary, tertiary, danger)
- Rich text editor for descriptions
- Modal dialogs for collaboration requests

---

## Page Structure

### 1. Homepage / Landing (New)

**Route**: `/`

**Sections**:
1. **Hero Section**
   - Headline: "Discover How Colleagues Use AI Across Our School"
   - Subheading: "Share prompts, methods, and workflows • Find collaborators • Save time together"
   - Search bar (global search across all ideas)
   - CTA buttons: [Share Your Idea] [Browse All] [Find Collaborator]

2. **Role-Based Quick Navigation**
   ```
   [Teaching (52 ideas)] [Research (38 ideas)] [Professional (41 ideas)]
   View All Disciplines →
   ```

3. **Discipline Activity Grid**
   ```
   Marketing(18)  Management(15)  HR(8)       Analytics(12)
   Finance(9)     Economics(7)    Tourism(6)  Entrepreneurship(11)
   ```
   - Clickable to filter to that discipline

4. **Recent Contributions Section**
   - Grid of latest 6 resources
   - Shows: Title, Author, Discipline, Tools, Quick Summary
   - 2-3 columns responsive layout

5. **Trending This Week Section**
   - Grid of most-viewed resources this week
   - Same card format

---

### 2. Browse Page (Enhanced)

**Route**: `/resources`

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  [Search] [View: Cards/List] [Sort: ▼]         │
├──────────────┬────────────────────────────────┤
│   FILTERS    │                                │
│              │  IDEA CARD GRID (3 columns)    │
│  □ Teaching  │                                │
│  □ Research  │ ┌──────────┐ ┌──────────┐     │
│  □ Prof.     │ │ Card 1   │ │ Card 2   │     │
│              │ └──────────┘ └──────────┘     │
│  Discipline  │                                │
│  □ Marketing │ ┌──────────┐                  │
│  □ Management│ │ Card 3   │                  │
│  [Show All]  │ └──────────┘                  │
│              │                                │
│  Tools Used  │ [Load More] or [Pagination]   │
│  □ ChatGPT   │                                │
│  □ Claude    │                                │
│  [Show All]  │                                │
│              │                                │
│  Time Saved  │                                │
│  ◉ Any       │                                │
│  ○ < 30 min  │                                │
│  ○ < 1 hour  │                                │
│  ○ < 1 day   │                                │
│              │                                │
│  Collab.     │                                │
│  □ Seeking   │                                │
│  □ Proven    │                                │
│  □ Has Docs  │                                │
│              │                                │
│  [Clear All] │                                │
└──────────────┴────────────────────────────────┘
```

**Components**:

#### Filter Sidebar
- **Role**: Teaching, Research, Professional
- **Discipline**: Marketing, Management, HR, Finance, etc.
- **Tools**: ChatGPT, Claude, Copilot, Midjourney, etc.
- **Time Investment**: Quick Win (<30min), Half Day, Needs Planning, Any
- **Collaboration**: Seeking, Proven, Has Materials
- **Clear All Filters** button

#### Idea Card (Compact Browse View)
```
┌─────────────────────────────────────┐
│ [Teaching] [Marketing] [Similar: 3] │
│                                     │
│ Using Claude for MBA Case Studies   │
│ ─────────────────────────────────── │
│ Dr. Sarah Chen • 2 days ago         │
│                                     │
│ Generates industry-specific cases   │
│ aligned with learning outcomes in   │
│ under 5 minutes...                  │
│                                     │
│ Tools: Claude, ChatGPT              │
│ Time Saved: 3 hrs/week              │
│                                     │
│ [👍 Useful: 12] [✓ Tried: 5]        │
│ [Working Similar] [Save] [💬 3]     │
└─────────────────────────────────────┘
```

**Card Features**:
- Type badge (Teaching, Research, Professional)
- Discipline badge
- "Similar Count" indicator
- Title
- Author + timestamp
- Quick summary (2-3 lines)
- Tools used as pills
- Time saved metric
- Action counters (Useful, Tried)
- Action buttons (Working Similar, Save, Comments)

---

### 3. Idea Detail Page (New)

**Route**: `/ideas/{id}`

**Layout**:
```
┌────────────────────────────────────┐
│ « Back to Browse                   │
├────────────────────────────────────┤
│ Using Claude for MBA Case Studies  │
│                                    │
│ [Edit] [Delete] (author only)      │
│                                    │
│ Dr. Sarah Chen                     │
│ Senior Lecturer, Marketing Dept.   │
│ [Email] [Teams Chat] [Similar]     │
│                                    │
│ ─────────────────────────────────  │
│                                    │
│ OVERVIEW                           │
│ Description text with formatting   │
│ (Rich text content)                │
│                                    │
│ THE WORKFLOW                       │
│ 1. Start with learning outcomes    │
│ 2. Input industry context          │
│ 3. Generate case structure         │
│ 4. Review and refine               │
│                                    │
│ EXAMPLE PROMPT                     │
│ ┌──────────────────────────────┐  │
│ │ "Create a 500-word case      │  │
│ │  study for MBA students..."  │  │
│ └──────────────────────────────┘  │
│ [Copy Prompt] [Variations]        │
│                                    │
│ EVIDENCE OF SUCCESS                │
│ • Student engagement ↑ 40%         │
│ • Cases updated each semester     │
│ • Works across 3 units            │
│                                    │
│ ETHICS & LIMITATIONS               │
│ ⚠️ Always review for accuracy      │
│ ⚠️ Check industry data is current  │
│ ⚠️ Ensure diversity in examples    │
│                                    │
│ TOOLS USED                         │
│ [Claude Pro] [Grammarly] [Canvas] │
│                                    │
│ VERSION HISTORY                    │
│ Last updated: 2 days ago          │
│ Original post: 3 weeks ago        │
│ [View Changes]                     │
│                                    │
│ ─────────────────────────────────  │
│                                    │
│ [👍 Useful: 42] [✓ Tried: 18]     │
│ [I'm Working on Similar]           │
│                                    │
│ DISCUSSION (3 comments)            │
│ [Show all comments]                │
│                                    │
│ ─────────────────────────────────  │
│                                    │
│ RELATED IDEAS YOU MIGHT LIKE       │
│ • Card 1                          │
│ • Card 2                          │
│ • Card 3                          │
└────────────────────────────────────┘
```

**Sections**:

1. **Header**
   - Title
   - Edit/Delete buttons (author only)

2. **Author Card**
   - Avatar
   - Name
   - Title/Department
   - Contact buttons (Email, Teams)
   - "View Similar" link

3. **Content Sections** (with dividers)
   - Overview (rich text)
   - The Workflow (steps as list)
   - Example Prompt (code block, copyable)
   - Evidence of Success (bullet list)
   - Ethics & Limitations (warning boxes)
   - Tools Used (pills)
   - Version History (if forked)

4. **Engagement**
   - Useful counter with thumbs up
   - Tried counter with checkmark
   - "I'm Working on Similar" button → Modal

5. **Discussion**
   - Comments thread
   - Add comment form (with @ mentions)
   - Nested replies

6. **Related Ideas**
   - 3-item carousel of similar content

---

### 4. Create/Edit Resource Page (Redesign)

**Route**: `/resources/new` or `/resources/{id}/edit`

**Multi-Step Form** (from ui-ux-ideas.md):

**Step 1: What's Your Idea?**
```
Title *
[Input field]

Quick Summary * (How would you describe this to a colleague?)
[Textarea]

Type of Contribution *
○ Teaching Innovation
○ Research Method
○ Professional Practice
○ Administrative Efficiency

Primary Discipline *
[Dropdown: Marketing, Management, HR, Finance...]

[Continue →]
```

**Step 2: The Details**
```
Describe Your Workflow
[Rich Text Editor]

Example Prompts (if applicable)
[Textarea] [+ Add Another]

Tools Used *
[Search/Select: ChatGPT, Claude, etc.]

Time Investment
○ Less than 30 minutes
○ Half day to set up
○ Requires planning
○ Ongoing refinement

Time Saved (optional)
[Number] hours per [Week/Month/Semester dropdown]

Supporting Materials (optional)
[File Upload] Max 10MB

[← Back] [Continue →]
```

**Step 3: Final Details**
```
Ethics & Limitations
[Textarea]

Evidence of Success
☑ Student feedback available
☑ Quantifiable results
☑ Peer reviewed
☑ Department approved

I'm Open To:
☑ Questions about implementation
☑ Collaborating on improvements
☑ Sharing materials/templates
☑ Running a workshop
☑ Coffee chat discussions

Collaboration Status
○ Seeking Collaborators
○ Proven in Classroom
○ Has Example Materials

Responsible Use Checklist
☑ I've reviewed Curtin's AI guidelines
☑ This respects academic integrity
☑ Student privacy is protected
☑ Appropriate attribution included

[← Back] [Preview] [Submit Idea]
```

---

### 5. Prompt Library Page (New)

**Route**: `/prompts`

**Layout**:
```
┌──────────────────────────────────────┐
│ My Prompt Library    [+ New Prompt]   │
│                      [+ New Folder]   │
├──────────────────────────────────────┤
│                                      │
│ 📁 Private Prompts (24)              │
│    ├─ Teaching Prep (8)              │
│    ├─ Research Writing (10)          │
│    └─ Admin Tasks (6)                │
│                                      │
│ 📁 Shared with Department (12)       │
│    ├─ Assessment Design (5)          │
│    └─ Course Materials (7)           │
│                                      │
│ 📁 Shared with Everyone (6)          │
│    └─ General Templates (6)          │
│                                      │
│ [Browse Shared Libraries →]          │
└──────────────────────────────────────┘
```

**Prompt Editor Modal**:
```
Title: [Input]

Prompt Template:
[Textarea with {{variable}} syntax highlighting]

Variables: {{course}}, {{assignment}}, {{tone}}

Sharing Settings
Who can view this prompt?
○ Just Me (Private)
○ My Department
○ My School
○ All Curtin Staff
○ Custom

Allow others to:
☑ Fork (create their own version)
☑ Suggest improvements
☑ See usage statistics
☑ Use in their workflows

[Cancel] [Save as Draft] [Save & Share]
```

**Shared Prompts Browse**:
```
[My Department ▼] [Teaching ▼]

🔒 Department
Rubric Generator for Group Work
Dr. Sarah Chen • Marketing • Updated 2 days ago
Used 47 times • 12 forks
[Preview] [Fork to My Library] [Request Access]

🌐 Public
Literature Review Synthesizer
Prof. Kumar • Management • Updated 1 week ago
Used 128 times • 31 forks • ⭐ 4.8 rating
[Preview] [Fork to My Library] [Use Now]

🏫 School-wide
Ethics Statement Generator
Research Office • Verified • Pinned
Official template • 340 uses
[Preview] [Copy to Library] [Documentation]
```

---

### 6. User Profile Page (New)

**Route**: `/profile` or `/users/{id}`

**Layout**:
```
┌────────────────────────────────┐
│ Dr. Michael [You]              │
│ Lecturer | AI Facilitator      │
│ School of Marketing & Mgmt.    │
│                                │
│ Teaching:                      │
│ • ISYS2001: Business Prog.     │
│ • ISYS6018: Information Sec.   │
│ • ISYS6014: Knowledge Mgmt & AI│
│                                │
│ Contributions (8)              │
│ [Card] [Card] [Card]          │
│ [Card] [Card] [Card]          │
│                                │
│ Currently Working On           │
│ • Automated video grading      │
│ • Multi-modal content analysis │
│                                │
│ Open to Collaborate On         │
│ • Assessment automation        │
│ • AI literacy workshops        │
│ • Curriculum development       │
│                                │
│ [Message] [View Calendar]      │
│ [Saved Ideas: 12]              │
│                                │
│ [Edit Profile] [Preferences]   │
│ [Export Data]                  │
└────────────────────────────────┘
```

**Sections**:
- Header: Name, Title, Department
- Teaching/Research Focus
- Contribution Cards Grid
- Currently Working On (text list)
- Open to Collaborate On (text list)
- Action buttons (Message, Calendar, Saved)
- Settings buttons (Edit, Preferences, Export)

---

### 7. Collaboration Modal (New Component)

**Trigger**: "I'm Working on Something Similar" button

```
┌──────────────────────────────────┐
│ Connect with Sarah               │
│                                  │
│ How would you like to connect?   │
│                                  │
│ ○ Send email introduction        │
│ ○ Start Teams chat               │
│ ○ Save & reach out later         │
│ ○ Leave a comment/question       │
│                                  │
│ Optional message:                │
│ [Textarea - "I'm also building.."]│
│                                  │
│ [Cancel] [Connect]               │
└──────────────────────────────────┘
```

---

### 8. Dashboard Pages (New)

#### Author Analytics Dashboard
**Route**: `/dashboard/ideas`

Shows for each of user's ideas:
- Views (total & unique)
- Saves
- "Tried" count
- Forks
- Comments
- Helpful votes
- Last viewed
- Trending indicators

#### Admin Analytics Dashboard
**Route**: `/admin/analytics`

Shows:
- Total resources
- Total views/saves/tries
- Top resources
- Performance by discipline
- User activity
- Export options

---

## Implementation Order

### Week 1: Foundation
1. Design system setup (colors, typography, spacing)
2. Base layout components (Header, Sidebar, Footer)
3. Navigation structure (routing)
4. Homepage (hero, discipline grid, recent/trending)

### Week 2: Core Pages
1. Browse page with filter sidebar
2. Idea cards (reusable component)
3. Idea detail page
4. Create/edit form (step 1-2)

### Week 3: Advanced Features
1. Collaboration modal and workflow
2. Prompt library
3. Comments system with threading
4. User profiles

### Week 4: Polish & Dashboard
1. Author/admin dashboards
2. Search functionality
3. Mobile responsiveness
4. Testing & refinement

---

## Component Architecture

### Reusable Components

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── Cards/
│   │   ├── IdeaCard.tsx (browse view)
│   │   ├── PromptCard.tsx
│   │   └── AuthorCard.tsx
│   ├── Forms/
│   │   ├── ResourceForm.tsx (multi-step)
│   │   ├── PromptEditor.tsx
│   │   └── CommentForm.tsx
│   ├── Filters/
│   │   ├── FilterSidebar.tsx
│   │   ├── FilterChips.tsx
│   │   └── DisciplineGrid.tsx
│   ├── Modals/
│   │   ├── CollaborationModal.tsx
│   │   ├── PromptPreviewModal.tsx
│   │   └── ConfirmModal.tsx
│   └── Common/
│       ├── TagPill.tsx
│       ├── RatingBadge.tsx
│       └── ToolBadge.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── BrowsePage.tsx
│   ├── IdeaDetailPage.tsx
│   ├── CreateResourcePage.tsx
│   ├── PromptLibraryPage.tsx
│   ├── ProfilePage.tsx
│   ├── DashboardPage.tsx
│   └── AdminDashboardPage.tsx
├── hooks/
│   ├── useResources.ts (enhanced for filtering)
│   ├── usePrompts.ts
│   ├── useAnalytics.ts
│   └── useCollaboration.ts
├── context/
│   ├── AuthContext.tsx (existing)
│   ├── FilterContext.tsx (new)
│   └── NotificationContext.tsx (future)
└── lib/
    ├── api.ts (existing, enhance with new endpoints)
    └── constants.ts (disciplines, tools, etc.)
```

---

## API Integration Checklist

### Resources
- [x] GET /resources (enhanced with filters)
- [x] POST /resources (enhanced create)
- [x] GET /resources/{id}
- [x] PATCH /resources/{id}
- [x] DELETE /resources/{id}
- [x] GET /resources/{id}/comments
- [x] POST /resources/{id}/comments
- [x] POST /resources/{id}/view
- [x] POST /resources/{id}/tried
- [x] POST /resources/{id}/save
- [x] GET /resources/{id}/analytics
- [x] POST /resources/{id}/collaborate
- [x] GET /resources/{id}/collaboration-options
- [x] GET /resources/similar

### Prompts
- [x] GET /prompts
- [x] POST /prompts
- [x] GET /prompts/{id}
- [x] PATCH /prompts/{id}
- [x] DELETE /prompts/{id}
- [x] POST /prompts/{id}/fork
- [x] GET /prompts/{id}/usage

### Collections
- [x] GET /collections
- [x] POST /collections
- [x] GET /collections/{id}
- [x] PATCH /collections/{id}
- [x] DELETE /collections/{id}
- [x] POST /collections/{id}/subscribe

### Analytics
- [x] GET /admin/analytics
- [x] GET /admin/analytics/by-discipline

### Auth
- [x] POST /auth/login
- [x] POST /auth/register
- [x] GET /auth/me
- [x] PATCH /auth/me

---

## Design Principles

1. **Discovery First** - Make finding ideas easy through filters and search
2. **Connection Second** - Collaboration buttons and author info prominent
3. **Trust Through Transparency** - Show impact metrics (views, tries, saves)
4. **Respect User Time** - Quick summaries, time-saving metrics, 1-click actions
5. **Rich Content** - Support markdown, code blocks, images in descriptions
6. **Mobile First** - All pages responsive to tablets and phones

---

## Success Criteria

✅ Homepage converts browsers to searchers (hero + discipline grid)
✅ Advanced filters help users find relevant ideas in < 30 seconds
✅ Collaboration modal makes connecting effortless (click → modal → send)
✅ Detail page tells complete story (workflow, examples, evidence, ethics)
✅ Prompt library enables reuse and versioning
✅ Dashboards show value (your ideas' impact)
✅ Mobile responsive on 320px - 1920px
✅ All new API endpoints fully consumed

---

## Time Budget

| Task | Hours |
|------|-------|
| Design system & components | 8 |
| Homepage & navigation | 8 |
| Browse page & filters | 12 |
| Detail page & forms | 12 |
| Collaboration & comments | 8 |
| Prompt library & collections | 8 |
| Profiles & dashboards | 8 |
| Mobile responsiveness | 8 |
| Testing & refinement | 8 |
| **Total** | **80 hours** |
| **= ~2 weeks at full-time** | **or ~4 weeks part-time** |

---

**Status**: Ready to begin implementation
**Next**: Start with design system and Homepage component

