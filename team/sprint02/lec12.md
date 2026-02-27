Project: AI Cooking App

Mentor: Self Mentored

Meeting Time: lect12

Type of Meeting: Daily Scrum

Team: Krisha[X], Daniel[X], Yuxi[X], Andy[X], Mahima[X]

Scribed Discussion:

### Part 1: Design document work

During Lecture 12, our team worked together on the **PantryPal design document** linked at `./docs/DESIGN.md`.

As a group, we:
- Reviewed our existing code (landing page, dashboard, pantry/scan/recipes, expiration calendar, preferences service, Firebase setup).
- Agreed on a **high-level system architecture** (Next.js frontend, Firebase Auth, Firestore, AI services, localStorage caches) and captured it in a diagram and explanation.
- Summarized **important team decisions** since the start of the project, referencing earlier docs such as `team/SPRINT01_REVIEW.md` and `team/retrospectives/RETRO_02.md`.
- Started a **UX considerations section**, including a high-level user/task flow from landing → signup/onboarding → dashboard (Scan, Pantry, Recipes, Calendar) and early UX questions we want to answer with user testing.

This work satisfies the Lab07 design document requirements and will be expanded in future labs.

### Part 2: Review and Plan Leadership Roles

We also discussed leadership roles for the rest of the quarter.

#### Leadership role assignments

Following the constraints in the lab handout (Product Owner ≠ Scrum Master; different people for multiple retros; avoid any one person taking on three roles before others have two), we assigned:

- **Product Owner:** **Yuxi Ji**  
  - Co-leads upcoming sprint planning with the Scrum Master.  
  - Responsible for ensuring we have a clear set of **“final”** user stories and that these are labeled appropriately (similar to MVP).

- **Scrum Master:** **Mahima Chaudhary**  
  - Responsible for making sure there is a set of **issues** tied to the final user stories and for helping the team keep issues moving across the Kanban board.

- **Testing/QA Coordinator:** **Andy Wang**  
  - Ensures that user stories and issues have clear **acceptance criteria** and that these are checked before pull requests are merged.  
  - Coordinates any TDD/BDD efforts we decide to adopt.

- **Retro 3 Leader (Week 9):** **Krisha Soneji**  
  - Will prepare and lead the third required retrospective and ensure that outcomes and action items are logged in the repo.

- **UX Coordinator:** **Mahima Chaudhary**  
  - Owns the overall look-and-feel and interaction patterns of PantryPal.  
  - Works closely with others to collect and apply UX feedback (e.g., from `team/evaluation/USER_FEEDBACK_NEEDS.md`).

- **Design Document Coordinator:** **Daniel Du**  
  - Responsible for the ongoing maintenance of `./docs/DESIGN.md` and for making sure new architectural and UX decisions are documented.  
  - Also responsible for copying these role assignments into `team/LEADERSHIP.md`.

- **Deployment Document Coordinator:** **Daniel Du**  
  - Owns the deployment documentation (future `./docs/DEPLOY.md`), including Firebase/Vercel configuration and any additional setup steps.  
  - Ensures by Lab08 that there is a usable first version and that it stays up-to-date.

- **User Manual Coordinator:** **Yuxi Ji**  
  - Will coordinate the user manual documentation starting in Lab08, aligning it with the UX flow from the design document and the user feedback plan.

- **Final Presentation Leader (Week 9/10):** **Krisha Soneji**  
  - Coordinates the final class presentation, including slide structure, demo flow, and ensuring that multiple presenters are prepared and the app is ready to show.

These assignments ensure that the Product Owner and Scrum Master are different people, that Retro 3 has a distinct leader, and that leadership responsibilities are distributed across the team while keeping any one person from holding too many roles.

