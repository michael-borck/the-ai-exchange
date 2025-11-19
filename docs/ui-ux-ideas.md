# AI Idea Exchange Platform - Curtin School of Marketing & Management
## UI/UX Design Specification v1.0 - November 2024

### Table of Contents
1. [Platform Vision](#platform-vision)
2. [Quick Start for Developers](#quick-start-for-developers)
3. [Key Concepts](#key-concepts)
4. [Homepage Design](#homepage-design)
5. [Idea Card Design](#idea-card-design)
6. [Browse & Filter Interface](#browse--filter-interface)
7. [Submission Flow](#submission-flow)
8. [Collaboration Features](#collaboration-features)
9. [Search Interface](#search-interface)
10. [Prompt Library](#prompt-library)
11. [Comments & Discussion](#comments--discussion)
12. [Notification System](#notification-system)
13. [Mobile Experience](#mobile-experience)
14. [Error & Empty States](#error--empty-states)
15. [Moderation & Quality Control](#moderation--quality-control)
16. [Analytics & Metrics](#analytics--metrics)
17. [Visual Design System](#visual-design-system)
18. [Implementation Roadmap](#implementation-roadmap)
19. [Success Metrics](#success-metrics)
20. [Glossary](#glossary)

### Project Ownership
**Project Owner**: Michael [AI Facilitator/Leader]  
**Contact**: [project email]  
**Last Updated**: November 2024

---

## Platform Vision

**"AirTable + Notion + Academic Repository, simplified for busy staff"**

A professional, lightweight collaboration hub for sharing AI implementations across teaching, research, and professional practice within the Curtin School of Marketing & Management.

---

## Quick Start for Developers

### Technical Recommendations
- **Frontend**: React/Next.js with TypeScript
- **Styling**: Tailwind CSS for rapid development
- **Database**: PostgreSQL with Prisma ORM (or Supabase for faster setup)
- **Authentication**: Curtin SSO integration (SAML/OAuth)
- **Search**: Elasticsearch or Algolia for advanced search
- **File Storage**: S3-compatible storage for attachments
- **Real-time**: WebSockets for notifications (optional Phase 2)

### Core Requirements
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG 2.1 AA compliance minimum
- **Performance**: Core Web Vitals optimized
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **API**: RESTful API with potential GraphQL in Phase 3
- **Security**: OWASP Top 10 compliance, data encryption at rest

---

## Key Concepts

### Ideas vs Prompts
- **Ideas**: Complete workflows, teaching methods, or research implementations that solve a specific problem
- **Prompts**: Specific, reusable text templates that can be used with AI tools (can be standalone or part of ideas)
- **Workflows**: Step-by-step processes that may include multiple prompts and tools
- **Collections**: Curated groups of related ideas or prompts

### User Roles
- **Educators**: Teaching-focused staff sharing classroom innovations
- **Researchers**: Research staff sharing methodologies and analysis techniques  
- **Professional Staff**: Administrative and support staff sharing efficiency improvements
- **Administrators**: Platform moderators and analytics viewers

---

## Homepage Design

### Hero Section
```
┌─────────────────────────────────────────────────────┐
│  Discover How Colleagues Use AI Across Our School   │
│  Share prompts, methods, and workflows • Find       │
│  collaborators • Save time together                 │
│                                                      │
│  [🔍 Search ideas, tools, or disciplines...]        │
│                                                      │
│  [Share Your Idea] [Browse All] [Find Collaborator] │
└─────────────────────────────────────────────────────┘
```

### Role-Based Quick Navigation
```
┌─────────────┬─────────────┬──────────────┐
│  Teaching   │  Research   │ Professional │
│  📚 52 ideas│  🔬 38 ideas│ 💼 41 ideas  │
├─────────────┴─────────────┴──────────────┤
│         View All Disciplines →            │
└───────────────────────────────────────────┘
```

### Discipline Activity Grid
```
Marketing (18)    Management (15)    HR (8)         Analytics (12)
Finance (9)       Economics (7)      Tourism (6)    Entrepreneurship (11)
```
*Numbers show active ideas; clicking filters to that discipline*

### Recent & Trending Section
```
Recent Contributions          Trending This Week
┌──────────────────┐         ┌──────────────────┐
│ Card 1           │         │ Popular Card 1    │
│ Card 2           │         │ Popular Card 2    │
│ Card 3           │         │ Popular Card 3    │
└──────────────────┘         └──────────────────┘
```

---

## Idea Card Design

### Browse View (Compact Card)
```
┌────────────────────────────────────────────────┐
│ [Teaching] [Marketing]           [Something     │
│                                    Similar: 3]  │
│ Using Claude for Personalized MBA Case Studies  │
│ ─────────────────────────────────────────────  │
│ Dr. Sarah Chen • 2 days ago                     │
│ Generates industry-specific cases aligned with  │
│ learning outcomes in under 5 minutes...         │
│                                                 │
│ Tools: Claude, ChatGPT    Time Saved: 3hrs/week│
│                                                 │
│ [Useful: 12] [Tried It: 5] [Working Similar]    │
│ [Save] [💬 3]                                   │
└────────────────────────────────────────────────┘
```

### Detailed View (Click-through Page)
```
┌─────────────────────────────────────────────────────┐
│ « Back to Browse                                     │
│                                                      │
│ Using Claude for Personalized MBA Case Studies      │
│ ════════════════════════════════════════════════    │
│ Dr. Sarah Chen                                      │
│ Senior Lecturer, Marketing Department               │
│ [Message Sarah] [Teams Chat] [Similar Ideas]        │
│                                                      │
│ [Edit] [Delete] (only visible to author)            │
│                                                      │
│ Overview                                             │
│ ─────────                                           │
│ [Full description of the implementation...]         │
│                                                      │
│ The Workflow                                        │
│ ─────────                                           │
│ 1. Start with learning outcomes                     │
│ 2. Input industry context                          │
│ 3. Generate case structure                         │
│ 4. Review and refine                               │
│                                                      │
│ Example Prompt                                      │
│ ─────────                                           │
│ ┌──────────────────────────────────┐              │
│ │ Create a 500-word case study for │              │
│ │ MBA students studying strategic   │              │
│ │ marketing. Context: [Industry],   │              │
│ │ Focus: [Learning Outcome]...      │              │
│ └──────────────────────────────────┘              │
│ [Copy Prompt] [View Variations]                     │
│                                                      │
│ Evidence of Success                                  │
│ ─────────                                           │
│ • Student engagement increased 40%                  │
│ • Cases now updated each semester                   │
│ • Adaptable across 3 different units               │
│                                                      │
│ Ethics & Limitations                                │
│ ─────────                                           │
│ ⚠️ Always review for accuracy                       │
│ ⚠️ Check industry data is current                   │
│ ⚠️ Ensure diversity in case examples                │
│                                                      │
│ Tools Used                                          │
│ ─────────                                           │
│ [Claude Pro] [Grammarly] [Canvas LMS]              │
│                                                      │
│ Version History                                      │
│ ─────────                                           │
│ Last updated: 2 days ago                            │
│ Original post: 3 weeks ago                          │
│ [View Changes]                                      │
│                                                      │
│ [Useful: 42] [Tried It: 18] [I'm Working on        │
│                          Something Similar]         │
│                                                      │
│ Discussion (3 comments)                             │
│ ─────────────────────────                          │
│ [View Comments Section Below]                       │
│                                                      │
│ Related Ideas You Might Like                        │
│ ─────────────────────────────────                  │
│ • Automated Rubric Generation - Dr. Mike T.         │
│ • Case Study Discussion Prompts - Prof. Lee         │
│ • Student Peer Review Templates - Dr. Kumar         │
└─────────────────────────────────────────────────────┘
```

---

## Browse & Filter Interface

### Left Sidebar Filters
```
Filter Ideas
────────────
Role
□ Teaching
□ Research  
□ Professional Services
□ All Roles

Discipline
□ Marketing
□ Management
□ HR
□ Finance
□ Economics
[Show all...]

Use Case Type
□ Prompt Template
□ Workflow
□ Assessment Design
□ Data Analysis
□ Content Creation
□ Admin Efficiency

Tools
□ ChatGPT
□ Claude
□ Copilot
□ Midjourney
[Show more...]

Time Investment
○ Quick Win (<30 min)
○ Half Day Setup
○ Needs Planning
○ Any

Collaboration
□ Seeking Collaborators
□ Proven in Classroom
□ Has Example Materials
```

### Top Bar Controls
```
Showing 47 ideas     Sort: [Most Useful ▼]    View: [Cards][List]
                          Most Recent
Active Filters: Teaching  Most Tried
                Clear all  Newest First
```

---

## Submission Flow

### Step 1: What's Your Idea?
```
Share Your AI Implementation
────────────────────────────

Title *
[________________________________________________]

Quick Summary * (How would you describe this to a colleague?)
[________________________________________________]
[________________________________________________]

What type of contribution is this? *
○ Teaching Innovation
○ Research Method
○ Professional Practice
○ Administrative Efficiency
○ Other

Primary Discipline *
[Select your department ▼]

[Continue →]
```

### Step 2: The Details
```
Tell Us More
────────────

Describe Your Workflow
[Rich text editor with formatting tools]
[________________________________________________]
[________________________________________________]
[________________________________________________]

Example Prompts (if applicable)
[________________________________________________]
[+ Add Another Prompt]

Tools Used *
[Type to search and select tools...]
Selected: [ChatGPT ×] [Excel ×]

Time Investment
○ Less than 30 minutes to implement
○ Half day to set up
○ Requires planning and preparation
○ Ongoing refinement needed

Time Saved (optional)
[___] hours per [week/month/semester ▼]

Upload Supporting Materials (optional)
[📎 Attach files] (.pdf, .docx, .xlsx, max 10MB)

[← Back] [Continue →]
```

### Step 3: Collaboration & Sharing
```
Final Details
────────────

Ethics & Limitations (Any risks to note?)
[________________________________________________]
[________________________________________________]

Evidence of Success (optional)
□ Student feedback available
□ Quantifiable results
□ Peer reviewed
□ Department approved

I'm Open To:
□ Questions about implementation
□ Collaborating on improvements
□ Sharing materials/templates
□ Running a workshop
□ Coffee chat discussions

Responsible Use Checklist
☑ I've reviewed Curtin's AI guidelines
☑ This respects academic integrity
☑ Student privacy is protected
☑ Appropriate attribution included

[← Back] [Preview] [Submit Idea]
```

---

## Collaboration Features

### "I'm Working on Something Similar" Flow
When clicked, a modal appears:
```
┌─────────────────────────────────────┐
│ Connect with Sarah                  │
│                                      │
│ How would you like to connect?      │
│                                      │
│ ○ Send email introduction           │
│ ○ Start Teams chat                  │
│ ○ Save & reach out later           │
│ ○ Leave a comment/question          │
│                                      │
│ Optional message:                   │
│ [_________________________________] │
│                                      │
│ [Cancel] [Connect]                  │
└─────────────────────────────────────┘
```

### Profile Page
```
┌──────────────────────────────────────────────────┐
│ Dr. Michael [You]                                │
│ Lecturer | AI Facilitator                        │
│ School of Marketing & Management                 │
│                                                   │
│ Teaching                                          │
│ • ISYS2001: Business Programming                  │
│ • ISYS6018: Information Security                  │
│ • ISYS6014: Knowledge Management & AI             │
│                                                   │
│ Contributions (8)                                 │
│ ┌─────────────┬─────────────┬─────────────┐     │
│ │ Idea Card 1 │ Idea Card 2 │ Idea Card 3 │     │
│ └─────────────┴─────────────┴─────────────┘     │
│                                                   │
│ Currently Working On                              │
│ • Automated video assessment grading              │
│ • Multi-modal content analysis platform           │
│                                                   │
│ Open to Collaborate On                            │
│ • Assessment automation                           │
│ • AI literacy workshops                           │
│ • Curriculum development                          │
│                                                   │
│ [Message] [View Calendar] [Saved Ideas: 12]       │
│                                                   │
│ [Edit Profile] [Notification Settings] [Export]   │
└──────────────────────────────────────────────────┘
```

---

## Search Interface

### Smart Search Bar with Filters
```
┌──────────────────────────────────────────────┐
│ 🔍 Search: "assessment automation"           │
│                                               │
│ Search in: [All Fields ▼] [Teaching ▼]      │
└──────────────────────────────────────────────┘

Suggested: "automated grading" "rubric generation" "peer assessment"

Found 12 results
```

### Advanced Search Examples
```
Search Examples:
────────────────
• "video assessment" - finds all ideas about video assessments
• "Claude AND rubric" - finds ideas using Claude for rubrics
• "department:marketing time:<30min" - quick wins from marketing
• "@sarah.chen" - all contributions from Sarah
• "tag:proven tool:ChatGPT" - proven ChatGPT implementations
• "saved:>10 recent:week" - popular ideas from this week
```

---

## Prompt Library

### Personal Prompt Library Structure
```
My Prompt Library                           [+ New Prompt] [+ New Folder]
├── 📁 Private Prompts (24)
│   ├── Teaching Prep (8)
│   ├── Research Writing (10)
│   └── Admin Tasks (6)
├── 📁 Shared with Department (12)
│   ├── Assessment Design (5)
│   └── Course Materials (7)
└── 📁 Shared with Everyone (6)
    └── General Templates (6)

[Browse Shared Libraries →]
```

### Prompt Creation/Edit Interface
```
┌──────────────────────────────────────────────────┐
│ Edit Prompt                                       │
│                                                   │
│ Title: Student Feedback Generator                 │
│                                                   │
│ Prompt Template:                                  │
│ [_____________________________________________]   │
│ [_____________________________________________]   │
│                                                   │
│ Variables: {{course}}, {{assignment}}, {{tone}}   │
│                                                   │
│ Sharing Settings                                  │
│ ─────────────────                                │
│ Who can view this prompt?                        │
│                                                   │
│ ○ Just Me (Private)                              │
│ ○ My Department (Marketing)                      │
│ ○ My School (Marketing & Management)             │
│ ○ All Curtin Staff                               │
│ ○ Custom: [Select groups/individuals]            │
│                                                   │
│ Allow others to:                                 │
│ □ Fork (create their own version)                │
│ □ Suggest improvements                           │
│ □ See usage statistics                           │
│ □ Use in their workflows                         │
│                                                   │
│ [Cancel] [Save as Draft] [Save & Share]          │
└──────────────────────────────────────────────────┘
```

### Browsing Shared Prompts
```
Discover Prompts                    Filter: [My Department ▼] [Teaching ▼]

┌──────────────────────────────────────────────────┐
│ 🔒 Department                                     │
│ Rubric Generator for Group Work                   │
│ Dr. Sarah Chen • Marketing • Updated 2 days ago   │
│ Used 47 times • 12 forks                         │
│ [Preview] [Fork to My Library] [Request Access]   │
├──────────────────────────────────────────────────┤
│ 🌐 Public                                         │
│ Literature Review Synthesizer                     │
│ Prof. Kumar • Management • Updated 1 week ago     │
│ Used 128 times • 31 forks • ⭐ 4.8 rating        │
│ [Preview] [Fork to My Library] [Use Now]         │
├──────────────────────────────────────────────────┤
│ 🏫 School-wide                                    │
│ Ethics Statement Generator                        │
│ Research Office • Verified • Pinned              │
│ Official template • 340 uses                      │
│ [Preview] [Copy to Library] [Documentation]       │
└──────────────────────────────────────────────────┘
```

### Version Control & Attribution
```
Prompt History
──────────────
v3 (current) - Modified by you - Today
v2 - Forked from Dr. Chen - Last week
v1 - Original by Dr. Chen - 2 weeks ago

[View Changes] [Revert] [Compare Versions]
```

### Usage Analytics (for Shared Prompts)
```
Your Prompt Analytics
─────────────────────
"Assignment Rubric Generator"
Visibility: Department

Used by: 23 colleagues
Total uses: 89 times
Avg. satisfaction: 4.6/5
Forks created: 8
Last used: 2 hours ago

Top Users:
• Dr. Smith (12 uses)
• Prof. Jones (8 uses)
• Dr. Lee (7 uses)
```

### Collections & Folders
```
Shared Collections (Curated Sets)
─────────────────────────────────
📚 "First Year Teaching Toolkit"
   Maintained by: Teaching & Learning Committee
   15 prompts • 234 subscribers
   [Subscribe] [Preview All]

📊 "Research Data Analysis Suite"
   Maintained by: Research Office
   8 prompts • 156 subscribers
   [Subscribe] [Preview All]

🎓 "HDR Supervision Helpers"
   Maintained by: Graduate Research School
   12 prompts • 89 subscribers
   [Subscribe] [Preview All]
```

---

## Comments & Discussion

### Comment System on Ideas
```
Discussion (3 comments)
───────────────────────

┌─────────────────────────────────────────┐
│ Dr. James Wong • 2 hours ago            │
│ This worked perfectly for my MBA class! │
│ Did you try it with undergraduate       │
│ students too?                           │
│ [Reply] [Helpful: 2]                    │
├─────────────────────────────────────────┤
│  └─ Dr. Sarah Chen • 1 hour ago        │
│     Yes! Works well but needs simpler  │
│     prompts for undergrads. Happy to   │
│     share my modified version.         │
│     [Reply] [Helpful: 5]               │
├─────────────────────────────────────────┤
│ Prof. Lisa Park • Yesterday             │
│ Consider adding industry compliance     │
│ checks for finance case studies.        │
│ [Reply] [Helpful: 3]                    │
└─────────────────────────────────────────┘

[Add Comment]
```

### Comment Input
```
┌─────────────────────────────────────────┐
│ Add your comment or question:           │
│ [____________________________________]  │
│ [____________________________________]  │
│                                         │
│ □ Notify me of replies                 │
│ [Cancel] [Post Comment]                 │
└─────────────────────────────────────────┘
```

### Comment Moderation
- Auto-flag comments with certain keywords
- Report button for inappropriate content
- Author can delete comments on their ideas
- Admins can remove any comment

---

## Notification System

### User Notification Preferences
```
Notification Settings
────────────────────

Email Notifications
□ Someone works on something similar to my idea
□ New comment on my idea
□ Reply to my comment  
□ New idea in my discipline
□ Weekly digest of trending ideas
□ Someone forks my prompt
□ My saved idea is updated

In-App Notifications
□ Real-time collaboration requests
□ Mentions in comments (@username)
□ System announcements
□ Workshop invitations

Frequency
○ Immediate
○ Daily digest
○ Weekly summary
○ Never

[Save Preferences]
```

### Notification Center
```
┌─────────────────────────────────────────┐
│ 🔔 Notifications (3 new)                │
│                                         │
│ • Dr. Chen is working on something     │
│   similar to your "Video Assessment"   │
│   idea - 2 hours ago                   │
│                                         │
│ • New comment on "Automated Rubrics"   │
│   - Yesterday                          │
│                                         │
│ • 5 people tried your prompt template  │
│   - This week                          │
│                                         │
│ [Mark All Read] [Settings]              │
└─────────────────────────────────────────┘
```

---

## Mobile Experience

### Mobile Navigation
```
┌─────────────────────────────┐
│ AI Ideas    🔍  🔔  ☰       │
├─────────────────────────────┤
│                             │
│     [Content Area]          │
│                             │
│                             │
├─────────────────────────────┤
│ Browse │ Search │ + │ Saved │ Me │
└─────────────────────────────┘
```

### Mobile Card View
```
┌─────────────────────────────┐
│ Teaching • Marketing         │
│                             │
│ Claude for MBA Cases        │
│ Dr. Sarah Chen              │
│                             │
│ Saves 3hrs/week generating  │
│ custom cases...             │
│                             │
│ [Useful] [Similar] [Save]   │
└─────────────────────────────┘
```

### Mobile Submission (Step View)
```
Step 1 of 3                   [→]
──────────────────────────────
What's your idea title?

[_____________________________]

[Back] [Next]
```

### Mobile Filter Drawer
```
┌─────────────────────────────┐
│ Filters           [Apply]   │
├─────────────────────────────┤
│ Role                        │
│ ☑ Teaching                  │
│ ☐ Research                  │
│                             │
│ Discipline                  │
│ ☑ Marketing                 │
│ ☑ Management                │
│                             │
│ [Show More Filters]         │
└─────────────────────────────┘
```

---

## Error & Empty States

### No Search Results
```
┌─────────────────────────────────────┐
│           No Results Found           │
│                                      │
│     🔍                              │
│                                      │
│ We couldn't find ideas matching     │
│ "quantum marketing strategies"       │
│                                      │
│ Try:                                │
│ • Checking your spelling            │
│ • Using fewer keywords              │
│ • Browsing by category instead      │
│                                      │
│ [Clear Search] [Browse All]         │
└─────────────────────────────────────┘
```

### Empty Profile (New User)
```
┌─────────────────────────────────────┐
│     Welcome to AI Ideas Exchange!    │
│                                      │
│     📝                              │
│                                      │
│ You haven't shared any ideas yet.   │
│                                      │
│ [Share Your First Idea]             │
│                                      │
│ Or start by:                        │
│ • [Browse existing ideas]           │
│ • [Find collaborators]              │
│ • [Join a workshop]                 │
└─────────────────────────────────────┘
```

### Failed Submission
```
┌─────────────────────────────────────┐
│         ⚠️ Submission Failed         │
│                                      │
│ We couldn't save your idea.         │
│                                      │
│ Error: Network timeout               │
│                                      │
│ Your work has been saved locally.   │
│                                      │
│ [Try Again] [Save Draft] [Get Help] │
└─────────────────────────────────────┘
```

### Network Error
```
┌─────────────────────────────────────┐
│      🔌 Connection Issue             │
│                                      │
│ Check your internet connection      │
│ and try again.                      │
│                                      │
│ [Retry] [Work Offline]              │
└─────────────────────────────────────┘
```

---

## Moderation & Quality Control

### Content Moderation Flow
```
Moderation Queue (Admin View)
─────────────────────────────

Pending Review (3)
┌──────────────────────────────┐
│ "Revolutionary Teaching..."   │
│ Flagged: Potential plagiarism │
│ Submitted by: Anonymous       │
│ [Review] [Approve] [Reject]   │
└──────────────────────────────┘

Auto-Flagged Keywords:
• "guaranteed results"
• "bypass detection"
• External promotional links
```

### Quality Indicators
```
Idea Quality Badges:
🏆 Staff Pick - Curated by admins
✓ Verified Implementation - Tested in classroom
📊 Evidence-Based - Includes metrics
🏫 Department Approved - Official endorsement
⭐ Community Favorite - High engagement
```

### Reporting System
```
Report This Idea
────────────────
Why are you reporting this?
○ Inappropriate content
○ Incorrect information
○ Plagiarism suspected
○ Broken/missing materials
○ Other: [___________]

[Cancel] [Submit Report]
```

### Edit/Delete Controls
Authors can:
- Edit their ideas within 24 hours without showing edit history
- Edit after 24 hours (shows "Edited" timestamp)
- Delete their own ideas (soft delete, admins can recover)
- Archive old ideas (hidden from browse, accessible via direct link)

---

## Analytics & Metrics

### Platform Analytics Dashboard (Admin)
```
Platform Insights - November 2024
──────────────────────────────────

Overview
├─ Active Users: 127/340 (37%)
├─ Total Ideas: 341
├─ Avg. Time Saved: 4.2 hrs/week
└─ Collaboration Rate: 14%

Engagement This Month
├─ New Ideas: 47
├─ Comments: 234
├─ Prompts Shared: 89
└─ Connections Made: 23

Top Departments
1. Marketing (67 ideas)
2. Management (54 ideas)
3. Analytics (41 ideas)

Popular Tools
1. ChatGPT (68%)
2. Claude (45%)
3. Copilot (31%)

[Export Report] [View Details]
```

### Individual Idea Analytics
```
Your Idea Performance
─────────────────────
"Automated Rubric Generator"

Views: 234
Unique Viewers: 89
Saves: 34
Tried It: 12
Avg. Time on Page: 2:34
Traffic Source:
  • Search: 45%
  • Direct: 30%
  • Browse: 25%

[View Detailed Analytics]
```

---

## Visual Design System

### Colors
- **Primary**: Curtin Navy (#012144)
- **Secondary**: Warm Grey (#F5F5F5)
- **Accent**: Curtin Gold (#F0B323)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)
- **Info**: Blue (#3B82F6)

### Typography
- **Headings**: Inter Bold (or system font)
- **Body**: Inter Regular (or system font)
- **Code/Prompts**: Fira Code (or monospace)
- **Font Sizes**: 
  - H1: 2.5rem
  - H2: 2rem
  - H3: 1.5rem
  - Body: 1rem
  - Small: 0.875rem

### Components
- **Cards**: 
  - Background: White
  - Border: 1px solid #E5E7EB
  - Border Radius: 8px
  - Shadow: 0 1px 3px rgba(0,0,0,0.1)
  - Hover: Elevate shadow

- **Buttons**:
  - Primary: Filled (#012144)
  - Secondary: Outline (#012144)
  - Tertiary: Text only
  - Danger: Red (#EF4444)
  - Border Radius: 6px
  - Padding: 8px 16px

- **Forms**:
  - Input Border: 1px solid #D1D5DB
  - Focus: 2px solid #012144
  - Border Radius: 4px
  - Error State: Red border

- **Tags/Badges**:
  - Pill shape (rounded-full)
  - Muted colors
  - Small text (0.875rem)

### Spacing System
- Base unit: 4px
- Common spacings: 8px, 16px, 24px, 32px, 48px
- Container max-width: 1280px
- Container padding: 16px (mobile), 24px (desktop)

### Icons
- Use Heroicons or Feather Icons
- Size: 20px for inline, 24px for buttons
- Consistent stroke width: 2px

---

## Implementation Roadmap

### Phase 1: MVP (Weeks 1-6)
**Core Features**:
1. User authentication (Curtin SSO)
2. Basic idea submission form
3. Browse page with simple filters
4. Search functionality (basic)
5. "Working on Similar" button
6. User profiles (basic)
7. Save/bookmark ideas
8. Mobile responsive design

**Technical Setup**:
- Database schema
- API endpoints
- Basic frontend
- Authentication flow
- File upload for materials

### Phase 2: Enhanced Features (Weeks 7-12)
**New Additions**:
1. Prompt library with sharing controls
2. Advanced search and filters
3. Comments and discussion
4. Email notifications
5. Analytics for authors
6. Collections/folders
7. Version history for edits
8. Export functionality

**Improvements**:
- Performance optimization
- Advanced search (Elasticsearch)
- Real-time notifications
- Rich text editor

### Phase 3: Advanced Features (Weeks 13-20)
**Sophisticated Features**:
1. AI-powered recommendations
2. Teams/Slack integration
3. Workshop scheduling system
4. Advanced analytics dashboard
5. API for external integrations
6. Collaborative editing
7. Automated quality scoring
8. Semester planning tools

**Platform Maturity**:
- Load testing
- Security audit
- Accessibility audit
- API documentation
- User onboarding flow

### Phase 4: Scale & Optimize (Ongoing)
- Machine learning for matching
- Advanced moderation tools
- Multi-language support
- Integration with Canvas LMS
- Mobile app consideration
- Research impact tracking

---

## Success Metrics

### Adoption Metrics
- **Target**: 50% staff adoption within 6 months
- **Active Users**: Weekly active users > 30%
- **Retention**: 60% monthly return rate

### Engagement Metrics
- **Ideas Shared**: 20+ new ideas per month
- **Collaboration Rate**: 15% of ideas generate connections
- **Comments**: Average 2+ comments per idea
- **Prompt Reuse**: 40% of prompts forked/adapted

### Value Metrics
- **Time Saved**: Self-reported average 3+ hours/week
- **Quality**: 80% of ideas rated "Useful"
- **Implementation**: 30% of viewers "Try It"
- **Cross-discipline**: 25% of ideas adapted across departments

### Platform Health
- **Load Time**: <2 seconds for main pages
- **Search Success**: 70% of searches lead to clicks
- **Error Rate**: <1% failed submissions
- **Support Tickets**: <5 per month

### Reporting Cadence
- Weekly: Active users, new content
- Monthly: Full metrics dashboard
- Quarterly: Strategic review and user survey
- Annually: ROI analysis and planning

---

## Export Features

### User Data Export
Users can export:
- Their contributed ideas (JSON, CSV)
- Saved ideas list (PDF, CSV)
- Prompt library (Markdown, JSON)
- Analytics for their content (PDF report)
- Comment history (Text file)

### Admin Export Options
- Full database backup (SQL)
- Analytics reports (PDF, Excel)
- User activity logs (CSV)
- Content moderation logs (CSV)

---

## API Considerations

### Potential Integrations
- Canvas LMS (auto-import ideas to courses)
- Microsoft Teams (notifications, sharing)
- Outlook Calendar (workshop scheduling)
- Power BI (advanced analytics)
- Library systems (resource linking)

### API Endpoints (Phase 3)
```
GET    /api/ideas           - List ideas
GET    /api/ideas/:id       - Get single idea
POST   /api/ideas           - Create idea
PUT    /api/ideas/:id       - Update idea
DELETE /api/ideas/:id       - Delete idea
GET    /api/prompts         - List prompts
POST   /api/collaborate     - Request collaboration
GET    /api/analytics       - Get analytics data
```

---

## Glossary

**AI Tools**: Software applications using artificial intelligence (ChatGPT, Claude, etc.)

**Fork**: Create a personal copy of someone else's prompt to modify

**HDR**: Higher Degree by Research (PhD and Masters by Research students)

**MVP**: Minimum Viable Product - basic working version

**Prompt**: Text input given to AI tools to generate specific outputs

**SSO**: Single Sign-On - use existing Curtin credentials

**Workflow**: Step-by-step process for completing a task

**WCAG**: Web Content Accessibility Guidelines

---

## Appendix: Responsive Breakpoints

- Mobile: 320px - 767px
- Tablet: 768px - 1023px  
- Desktop: 1024px - 1279px
- Wide: 1280px+

---

## Contact & Support

**Project Owner**: Michael [AI Facilitator/Leader]  
**Technical Lead**: [TBD]  
**Design Lead**: [TBD]  
**Support Email**: [ai-ideas@curtin.edu.au]  

For technical questions, feature requests, or bug reports, please use the internal ticketing system or contact the project team directly.

---

*This document is version 1.0 - November 2024. It will be updated as the platform evolves based on user feedback and institutional requirements.*