# Lab09 Scrum Project: AI Cooking App

**Mentor:** Self Mentored  

**Meeting Time:** Lab09  

**Type of Meeting:** Daily Scrum  

**Team:** Krisha[X], Daniel[X], Yuxi[X], Andy[], Mahima[X]  

This document summarizes each team member's sprint contributions.
We all continued working on CONTRIBS.md

### Yuxi

**Fix duplicate pantry items when adding to pantry** (#221)

- Ensured adding a single item via the form results in exactly one item shown in "Your Pantry Items".
- Prevented rapid double-clicks on "Add to Pantry" from creating duplicate entries.
- Existing pantry items continue to display and update correctly.

**Fix ExpirationProgressBar status logic for items expired within the same day** (#218)

- Fixed status label so items expired earlier today show "Expired" (not "Expiring Soon").
- Kept status label and time-remaining text consistent for expired items.
- Expiring Soon only applies when the item has not yet expired and expiration is within 3 days.

### Daniel

**Edit Account Page to hide userID and make preferences editable** (#175)

- Updated the account page to remove the userID.
- Enabled users to edit their preferences.

### Mahima

**Add restrictions and drop-downs** (#180)

- Added a reasonable limit on the quantity of items.
- Replaced the "what cuisine" free-text field in Recipes with a drop-down of options.

### Krisha

**Fix UI & functionality for pantry items** (#181)

- Made the "Expiration Reminders" section colors less vibrant to match the rest of the UI.
- Updated the "Pantry Items" section under Recipes to show only quantity (no expiration dates).
- Combined matching items (e.g., "Milk(1 cup)" + "Milk(1 cup)" → "Milk(2 cups)").

**Make items from pantry auto delete when recipe used** (#126)

- The app automatically deletes items from inventory when they are used in a recipe.
