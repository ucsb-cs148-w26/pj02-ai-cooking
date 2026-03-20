Sprint Number: sprint02

Sprint Duration: 4 weeks

Team Members: Yuxi Ji, Daniel Du, Krisha Soneji, Mahima Chaudhary, Andy Wang

---

## Sprint Goal

The primary objective of this sprint was to refine and extend the MVP from Sprint 01 based on user feedback and internal pain points. The features and improvements we delivered in this sprint were:

- Saved recipes (Firestore backend + Save/Unsave UI on recipe cards)

- Editable account page with hidden userID and editable preferences

- Auto-delete pantry items when a recipe is used

- Pantry item editing (name, quantity, category, expiration)

- Recipe generation personalized to onboarding data and user preferences

- Restrictions and drop-down options for user input in recipes

- Fix for duplicate pantry items being added

- Fix for expiration progress bar same-day status logic

- UI polish for expiration reminders (less vibrant colors, cleaner pantry item display)

- API limit fix and error message for scanner failures

- Design document (DESIGN.md), user manual (MANUAL.md), and team contribution logs (CONTRIBS.md)

- Cross-team evaluation with the Rideshare team

---

## Challenges & Blockers

- **Firestore rules complexity:** Implementing per-user saved recipes required careful Firestore security rules to restrict access by userId, which took additional iteration to get right.

- **API limits:** The AI scanner hit rate limiting and quota issues under repeated use, requiring fixes to how the API was called and clear error messaging for users.

- **Ongoing merge conflicts (early sprint):** At the start of the sprint we still experienced some overlap, though the new branching strategy we adopted progressively reduced this over the sprint.

- **Andy's availability:** Andy was absent for Lab08 and Lab09, requiring the team to coordinate around his tasks asynchronously.

---

## User Feedback

### Positive Feedback:

- App feels more polished and functional compared to Sprint 01

- Saved recipes feature was well-received as a useful addition

- Editable preferences made the account page feel more complete

- Drop-down options for recipe input made data entry faster and less error-prone

### Concerns:

- Some users still found the onboarding flow slightly long

- A few users wanted more visual feedback when items are auto-deleted after a recipe is used

- Scanner error messages could be more descriptive about what went wrong

- Users requested more granular control over which pantry items are used in recipe generation

---

## Key Learnings

We adopted a clearer branching and merge strategy this sprint — feature branches per task, daily syncs with main, and a shared deployment doc — and it made a noticeable difference. Merge conflicts dropped significantly and one additional team member was able to set up and troubleshoot deployment independently using the doc. We also got valuable outside perspective from the cross-team evaluation with the Rideshare team, which helped us see our app through fresh eyes. Overall, collaboration felt smoother and the team had more shared ownership of the codebase.

---

## Next Sprint Focus

- **Recipe ingredient selection:** Add UI for users to choose which pantry items to include when generating a recipe (checkboxes, Select All / Clear, generate from selected only).

- **Saved recipes UI:** Build out the My Saved Recipes page with list, detail view, unsave actions, and navigation.

- **Pantry sort by expiration:** Sort pantry items by soonest expiration on the Recipes tab to encourage using items before they expire.

- **Communities (stretch):** If time permits, add a feature for users to share and rate recipes with each other.

- **Definition of done for merges:** Introduce a lightweight PR review step (at least one team member acknowledgment) to tighten quality before merging.

---

## Action Items

1. Build the saved recipes page and wire it to the existing Firestore save/unsave backend.

2. Add pantry item selection checkboxes to the recipe generation flow.

3. Sort pantry items by expiration date on the Recipes tab.

4. Formalize a short "definition of done" for PRs (e.g., one peer acknowledgment before merge).

5. Improve scanner error messages to give users clearer guidance on what went wrong and how to retry.
