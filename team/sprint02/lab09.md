Mentor: Self Mentored

Meeting Time: Lab09

Type of Meeting: Daily Scrum

Team: Krisha[X], Daniel[X], Yuxi[X], Andy[ ], Mahima[X]

## Mahima

**Add Restrictions and Drop Downs** (#180 - Closed)

This task is done when:
-The quantity of items has a reasonable limit
-The "what cuisine" section in Recipes has a drop-down of options instead of letting the user type anything

## Yuxi

**Fix duplicate pantry items when adding to pantry** (#221 — Open)

- Parent: As a user, I want to be able to give the website my ingredient inventory so that I can receive recipes based on what I already have.
- Acceptance criteria:
  - Adding a single item via the form results in exactly one item shown in "Your Pantry Items".
  - Rapid double-clicks on "Add to Pantry" do not create duplicate entries.
  - Existing pantry items continue to display and update correctly.

**Fix ExpirationProgressBar status logic for items expired within the same day** (#218 — Closed)

- Parent: As a user, I can view expiration reminders for my inventory items so that I can use ingredients before they spoil and reduce food waste.
- Acceptance criteria:
  - If an item expired earlier today (e.g., "Expired 5 hours ago"), the status label shows Expired (not Expiring Soon).
  - Status label and time-remaining text are consistent for expired items.
  - Expiring Soon only applies when the item has not yet expired and expiration is within 3 days.
  - No UI regressions in the progress bar display.

---

## Daniel

**Edit Account Page to hide userID and make preferences editable** (#175 — Open)

- Parent: As the user I want to be able to have my account info and preferences saved in the application so that when I log out my data is saved.
- Acceptance criteria:
  - The account page is updated to remove the userID.
  - The user is able to edit their preferences.
