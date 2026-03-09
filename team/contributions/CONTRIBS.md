## Team Contributions — PantryPal

This document summarizes each team member's code and process contributions. For more detail, see the individual files in this folder (e.g. contrib_Yuxi.md, contrib_Daniel.md).

---
## Mahima Chaudhary

- When starting out, our code was disorganized and we didn’t have any of the config files so it wasn’t deploying. I reorganized the files and added the config files so we could get the initial deployment working
- I created the log in page
- I worked on navigation through the website and linked the landing page to the login/signup/onboarding pages
- I created the Firestore database to store user onboarding data and inventory data
- I implemented user authentication via Firebase
- I fixed user state to ensure the pantry items persist after page reloads
- When we would scan items, they wouldn’t show up in pantry, so I fixed that issue
- As UX/UI coordinator, I improved the UI throughout the website and ensured everything looks cohesive and uniform throughout
- I fixed the recipe generation to take into account user onboarding data, as before the recipes wouldn’t take any restrictions/allergies into consideration
- I added drop down options and restrictions for user inputs
- As scrum master, I also consistently led and maintained many scrum meetings

## Yuxi Ji

Yuxi was the initial idea person behind PantryPal and contributed across data, UX, saved recipes, bugs, documentation, and team process.

- **Idea & product direction**: Proposed the PantryPal concept and helped break it down into concrete sub-issues and acceptance criteria.
- **Data & inventory persistence**: Implemented local storage for inventory so data is saved and reloaded on app startup (Issue #39, PR #59).
- **Onboarding & preferences**: Built the onboarding flow to collect allergies and dietary preferences from new users (Issue #53, PR #81).
- **Expiration tracking & reminders**: Implemented the expiration progress bar and dashboard reminders, unified scanned data into the expiration model, and fixed same-day expiration status logic (Issues #140, #137, #218; PRs #113, #129, #130, #134, #152, #219).
- **Saved recipes backend**: Designed the Firestore collection and service layer for per-user saved recipes, including save/unsave logic, a hook to load saved IDs, and Firestore rules that restrict access by userId (Issues #183, #211; PRs #185, #186, #188).
- **Recipe ingredient selection & pantry sort**: Added UI to select which pantry items to use for recipe generation (checkboxes, Select all/Clear, generate using only selected items) and sorted pantry items by expiration (soonest first) on the Recipes tab (Issues #225, #240; PRs #239, #241).
- **Saved recipes UI & navigation**: Built the My Saved Recipes page, including list, details, unsave actions, navigation entry, and Back to Dashboard button (Issues #156, #212, #215; PRs #197, #198, #199, #201, #213, #206).
- **Bug fixes**: Fixed duplicate pantry items being created when adding to the pantry (Issue #221; PRs #222, #223).
- **Documentation & retrospectives**: Created the user manual (MANUAL.md, PR #210) and led the second team retrospective, documenting process changes and outcomes (Issue #147, RETRO_02.md).

---

## Daniel Du

Daniel was an active contributor on frontend UI, AI-powered expiration features, core pages, design docs, and agile process artifacts.

- **Account & UI features**: Created and iterated on the account page, improved UI layout, and refined the color scheme for better usability and accessibility. This included centering the main navigation bar so the **Scan**, **Pantry**, and **Recipes** buttons appear centered at the top of the interface (Subissues #232, #175, #104, #115; PRs #245, #246, #220, #133, #132, #131, #127, #119).

- **Recipe features**: Implemented save/unsave buttons and state on recipe cards so users can bookmark recipes (Subissue #155; PRs #192, #191).

- **Expiration & AI integration**: Built the expiration calendar and wired AI APIs to generate expiration dates for produce (Subissues #138, #48; PRs #153, #80, #77).

- **Home page & MVP polish**: Designed and built the initial home page and handled several MVP follow-up fixes and polish items (Subissue #33; PRs #71, #58, #117).

- **Design & documentation**: Authored and maintained DESIGN.md and made multiple improvements to the README so the project documentation stayed accurate (PRs #193, #168, #86, #52, #50, #49).

- **Sprint & process management**: Maintained sprint planning documents and scrum logs across sprints, and led the first retrospective, facilitating the team discussion and documenting outcomes (PRs #124, #110, #108, #69, #63, #56, #26, #25, #23, #20, #19, #18, #17, #62, #65; Subissue #51).

## PLaceholer for other team members
