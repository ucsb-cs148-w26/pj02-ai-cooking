# My Contributions — Team Member Draft

## Overview

I am the **initial idea person** behind PantryPal. I proposed the concept and have been deeply involved in turning it from an idea into a working product. I enjoy the process of breaking down the vision into concrete sub-issues, defining acceptance criteria, and seeing each piece implemented step by step. My contributions span data persistence, onboarding, recipe UX (including selecting which pantry items to use for generation and sorting them by expiration), expiration tracking, saved recipes (including Firestore backend and UI), bug fixes, and team process leadership (second retrospective). Below is a detailed breakdown of the sub-issues I owned and the pull requests that implemented them.

---

## Data & Persistence

### Save inventory data locally initially — Issue #39

**Acceptance criteria:** Inventory data persists locally; data loads on app startup.

- **PR #59** — *yuxi's update* — Implemented inventory data persistence using `localStorage`. Inventory data automatically saves when modified and loads from `localStorage` on app startup. Tested and verified. Documented that this can be upgraded to Firebase in a future iteration.

---

## Onboarding & User Preferences

### Create onboarding form for user allergies/preferences — Issue #53

**Acceptance criteria:** New or first-time users are directed to an onboarding flow that collects allergies and preferences; form captures allergies (checkboxes/multi-select and/or free text) and dietary preferences (diet type, cuisine preferences, cooking skill level or similar).

- **PR #81** — *update by yuxi* — Built the onboarding form and flow so users can set allergies and dietary preferences before or after sign-up.

---

## Recipe UX

### Replace "Preferences" section in Recipes with "What kind of food do you want today?" — Issue #120

**Task:** Replace the "Preferences" section in Recipes with the friendlier prompt "What kind of food do you want today?"

- **PR #121, #122** — *task by yuxi* — Updated the Recipes UI copy and section label as specified.

### Allow selecting which pantry items to use for recipe generation — Issue #225

**Acceptance criteria:** On the Recipes tab, the pantry section shows each pantry item with a way to select/deselect it (e.g. checkbox or toggle); "Select all" selects every pantry item and "Clear" / "Deselect all" deselects every item; generating recipes uses only the currently selected items (if none are selected, the user sees an error and no API call is made); when the pantry list first loads or updates, all items are selected by default; existing behavior (cuisine, restrictions, save recipe, etc.) still works when using a subset of ingredients.

- **PR #239** — *Allow selecting which pantry items to use for recipe generation* — Implemented checkboxes and Select all/Clear in RecipeGenerator; generate uses only selected items.

### Sort pantry items by expiration (soonest first) on Recipes tab — Issue #240

**Acceptance criteria:** On the Recipes tab, pantry items are displayed in order of expiration date: soonest to expire first; items with no expiration or unparseable expiry are listed after items with valid expiration dates; sorting is done in application code only (no Firestore Console or schema changes).

- **PR #241** — *Sort pantry items by expiration (soonest first) on Recipes tab* — Added sort by expiration in RecipeGenerator onSnapshot callback with a parseExpirationTime helper.

---

## Expiration Tracking & Progress Bar

### Expiration progress bar for inventory items — Issue #140

**Acceptance criteria:** App tracks expiration dates for inventory items; identifies items expired or expiring soon (within 2–3 days); displays clear expiration reminders on the dashboard. (Optional: email reminders.)

- **PR #113, #129** — *Expiration reminder for inventory items* — Implemented expiration tracking and reminders on the dashboard.
- **PR #130** — *upload* — Further updates to expiration reminder behavior.
- **PR #134** — *Yj expiration reminder* — Completed and polished the expiration progress bar and reminder logic.

### Unify Scan data: map expiryEstimate to expiration for expiration progress bar compatibility — Issue #137

**Acceptance criteria:** Scanned items are saved with both `expiration` and `expiryEstimate` where available; scanned items appear in the expiration progress bar; expiration reminders include scanned items.

- **PR #152** — *yuxi's task* — Mapped scan data so `expiryEstimate` feeds into the unified expiration field, ensuring scanned items work with the expiration progress bar and reminders.

### Fix ExpirationProgressBar status logic for items expired within the same day — Issue #218

**Acceptance criteria:** If an item expired earlier today (e.g. "Expired 5 hours ago"), status shows "Expired" (not "Expiring Soon"); status and time-remaining text are consistent; "Expiring Soon" only when not yet expired and within 3 days; no UI regressions.

- **PR #219** — *Fix expiration logic* — Corrected same-day expiration status so labels and logic match the criteria.

*Code note:* Expiration state is computed in `components/ExpirationProgressBar.tsx`: items are classified as "Expired", "Expiring Soon" (within 3 days), or "Fresh" based on the item’s `expiration` date. The fix in PR #219 ensured that when an item’s expiration is earlier today, it is shown as "Expired" with consistent time-remaining text, not "Expiring Soon".

---

## Saved Recipes — Backend & Firestore

### Add Firestore collection and save/unsave logic for saved recipes — Issue #183

**Acceptance criteria:** Saving a recipe creates a Firestore document with correct `userId` and recipe data; unsave removes that document; callers can determine whether a recipe is saved for the current user (for "Saved" vs "Save" UI).

- **PR #185** — *Add savedRecipesService with saveRecipe* — Implemented the service and `saveRecipe`.
- **PR #186** — *Add unsaveRecipe and getSavedRecipeIds to savedRecipesService* — Added unsave and ID lookup.
- **PR #188** — *Add useSavedRecipeIds hook* — Added the hook so the UI can show saved state.

*Code note:* The backend lives in `services/savedRecipesService.ts`: `saveRecipe` and `unsaveRecipe` use Firestore `addDoc` / `deleteDoc` on the `savedRecipes` collection with `userId` and full recipe fields; `getSavedRecipeIds` queries by `userId` and returns document IDs so the UI can show Saved vs Save. The `hooks/useSavedRecipeIds.ts` hook loads those IDs for the current user and is used by recipe cards and the My Saved Recipes page.

### Add Firestore rules for "Save Recipe" — Issue #211

**Acceptance criteria:** Writes to `savedRecipes` succeed when the user is logged in; users can only read/write documents where `userId` matches `request.auth.uid`; no "permission denied" or Firestore rules errors when saving or unsaving.

- **Implementation note:** I wrote the Firestore rules; **Mahima** deployed them to the Firebase console when I didn’t have access (we later added more admins).

---

## Saved Recipes — UI & Navigation

### Add "My Saved Recipes" view to list and open saved recipes — Issue #156

**Acceptance criteria:** User can open "My Saved Recipes" and see all saved recipes; each shows title and can be opened for full details (ingredients, instructions); empty state when there are none; (optional) remove from saved in this view.

- **PR #197** — *upload saved-recipes* — Initial saved-recipes view and wiring.
- **PR #198, #199** — *Show saved recipes list on /saved-recipes* — List page and route.
- **PR #201** — *Add details and unsave actions to My Saved Recipes view* — Full recipe details and unsave from the list.

### Add Back to Dashboard button on My Saved Recipes page — Issue #212

**Acceptance criteria:** Visible "Back to Dashboard" at the top of My Saved Recipes; clicking navigates to `/dashboard` without errors; layout and styling consistent on desktop and mobile.

- **PR #213** — *add Back button* — Added the Back to Dashboard control with consistent styling.

### Add saved recipes navigation entry in Layout — Issue #215

**Acceptance criteria:** Logged-in users see "My Saved Recipes" in the desktop header linking to `/saved-recipes`; logged-in users see "Saved" in the mobile bottom nav linking to `/saved-recipes`; links hidden when not authenticated.

- **PR #206** — *add My Saved Recipes icon* — Added desktop and mobile nav entries, gated by auth.

---

## Bug Fixes & Polish

### Fix duplicate pantry items when adding to pantry — Issue #221

**Acceptance criteria:** Adding a single item via the form results in exactly one item in "Your Pantry Items"; rapid double-clicks on "Add to Pantry" do not create duplicates; existing pantry items continue to display and update correctly.

- **PR #222, #223** — *Fix Duplicate Pantry Items* — Resolved duplicate entries on add and on double-click.

---

## Documentation

### User Manual Coordinator — MANUAL.md

As **User Manual Coordinator**, I created `MANUAL.md` for the project.

- **PR #210** — *upload MANUAL.md* — Added the user manual documentation.

---

## Team Process & Retrospective

### Lead team in second retro — Issue #147

I **led the second team retrospective** (documented in `team/retrospectives/RETRO_02.md`). I documented what we did across lectures and labs, facilitated the session, and captured outcomes. We used the **Start / Stop / Continue** method; the discussion covered MVP delivery, deployment and merge-conflict pain points, and user feedback on UI and onboarding. We defined an action item: improve collaboration on overlapping files and reduce merge conflicts, and make the app feel more food-focused. We also agreed on a clearer merge and branching strategy (feature branches per task, daily sync with main) and on documenting deployment (Vercel env vars, Firebase config) so others could troubleshoot. The experiment was assessed as successful: fewer merge conflicts and at least one other team member used the deployment doc. I added advice for the next retro leader: ensure everyone has a chance to speak and to ask each person for Start, Stop, and Continue input so no one is left out.

---

## Notes on Commit Attribution

Some of my contributions may not be fully reflected in the GitHub Contributors graph if commits were made under different account configurations, or if pair programming sessions were committed by another team member. The pull requests listed above represent my personal work and can be verified through the PR history and linked issues in the repository.

---

*This draft was written by Yuxi Ji for inclusion in `team/contributions/CONTRIBS.md`.*
