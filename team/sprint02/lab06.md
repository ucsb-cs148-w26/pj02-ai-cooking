# Lab 06 Scrum Project: AI Cooking App

**Mentor:** Self Mentored  
**Meeting Time:** Lab 06  
**Type of Meeting:** Retrospective 02 + Daily Scrum  
**Team:** Krisha [X], Daniel [X], Yuxi [X], Andy [X], Mahima [X]

---

## Daily Scrum (Scribed Discussion)

We defined and documented our user feedback needs in **`team/evaluation/USER_FEEDBACK_NEEDS.md`**. We decided to focus on **overall product satisfaction** (first-time and ongoing use) for the full flow: **landing → signup/onboarding → dashboard (Scan, Pantry, Recipes, Calendar)**. We want to know whether this flow feels clear and valuable to users.

---

## Retrospective 02 & Process Improvements

### Overview

For Lab 06 we also ran **Retrospective 02** (Feb 2025), led by Yuxi Ji, with the full team present. The retro is documented in **`team/retrospectives/RETRO_02.md`**.

## What We Did

### Retrospective Method

We used the **Start / Stop / Continue** format so everyone could share what to start doing, stop doing, and keep doing. The session was quick and gave each person a chance to contribute; the main themes were **merge conflicts** and **deployment setup** pain points from Sprint 01.

### Action Item & Goal

- **Goal:** Improve how we work together on overlapping files and reduce merge conflicts, and make the app feel more like a food app based on user feedback.
- **Change we committed to:**
  1. **Clearer merge and branching strategy** before the next sprint: smaller feature branches, more frequent syncs with `main`, and clearer ownership of files.
  2. **Document deployment setup** (Vercel env vars, Firebase config) so other team members can run and troubleshoot the app if needed.
- **Measurement:**
  - Fewer merge conflicts in the next sprint compared to Sprint 01.
  - At least one piece of user feedback that the app “feels more food-related” after our UI changes.

### Experiment / Change We Tried

We adopted a concrete process change:

1. **Feature branch per task or sub-issue** — instead of everyone working on the same branch.
2. **Daily sync with main** — merge `main` into our branch (or rebase) at least once per day to avoid large merge conflicts.
3. **Deployment documentation** — a short team doc or README covering Vercel env vars and Firebase config so others can deploy or troubleshoot.

Success was measured by: (a) fewer merge conflicts after the retro, and (b) at least one additional team member able to run or troubleshoot deployment using the doc.

### Results

- **Fewer merge conflicts** — most work was done on feature branches and merged in smaller chunks.
- **Broader deployment capability** — the deployment doc was used by at least one other team member to set up a local deploy path, reducing the bottleneck of having only one person connected to Vercel.
- The team agreed that **collaboration felt smoother** and we had a **shared reference for deployment**.

### Decision Going Forward

We decided to **keep** this change. We will continue using:

- Feature branches per task
- Daily sync with main
- The deployment doc for onboarding and troubleshooting

We may add a short “definition of done” for merges (e.g., PR reviewed or at least one other person acknowledged) in a future retro if we want to tighten quality further.

## Context from Sprint 01

- Sprint 01 MVP delivered core features: manual entry, login/signup, AI scanning, recipe generation, expiration progress bar, and account page. Main pain points were deployment setup and merge conflicts.
- User feedback was mostly positive on UI clarity and onboarding; concerns about gradients, readability, recipe flow length, and onboarding length were noted to guide the next sprint.
- Communities / recipe sharing remained a stretch goal for the next sprint if time permitted.

## Advice for Future Retro Leaders

From our assessment: make sure every person gets a chance to speak, and explicitly ask each person for their input for **Start**, **Stop**, and **Continue** so no one is left out.
