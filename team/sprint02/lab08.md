# Lab08 Scrum Project: AI Cooking App

**Mentor:** Self Mentored  

**Meeting Time:** Lab08 

**Type of Meeting:** Daily Scrum  

**Team:** Krisha[X], Daniel[X], Yuxi[X], Andy[], Mahima[X]  

---

# Lab 08: Sprint Contributions

## Overview

This document summarizes what each team member completed during the Lab 08 sprint.

---

## Yuxi

**Add Firestore collection and save/unsave logic for saved recipes**

- Introduced a Firestore collection (or subcollection) for storing users’ saved recipes.
- Implemented **save** and **unsave** logic so recipes can be persisted per user (e.g., in `savedRecipesService.ts` and related API or Firestore rules).
- This backend/data layer enables the rest of the team to build the Save/Unsave UI and keeps saved state consistent across sessions.

---

## Daniel

**Add Save / Unsave button and state on recipe cards**

- Added a **Save** / **Unsave** control (e.g., heart icon or button) on each recipe card in the recipe generator or recipe list.
- Wired the button to the saved state (e.g., using `savedRecipeIds` or similar) so users can toggle save/unsave and see “Saved” vs “Save” (and optional filled/unfilled heart).
- Ensured the UI reflects the current saved state and stays in sync with the Firestore save/unsave logic.

---

## Andy

**Fix API limit issue & add error message for when scanner doesn’t work**

- Addressed **API limit** issues (e.g., rate limiting or quota) so the scanner or Gemini integration behaves correctly under load or repeated use.
- Added a clear **error message** when the scanner fails (e.g., no result, API error, or invalid input) so users understand what went wrong and what to do next.

---

## Krisha

**Allow user to edit pantry items**

- Implemented the ability for users to **edit** existing pantry items (e.g., name, quantity, category, expiration).
- This likely involves form/UI for editing and updates to the data layer (Firestore or local state) so changes are saved and reflected in the pantry list and elsewhere (e.g., recipe generation).

---

## Mahima

**Fix recipe generation to take into account onboarding data and prompt answer**

- Updated **recipe generation** so it uses **onboarding data** (e.g., dietary preferences, allergies, cuisines) and any **prompt answers** the user provided.
- Ensured the Gemini (or other) recipe API receives these preferences and that generated recipes respect them, so the output is personalized and consistent with what the user set during onboarding.
