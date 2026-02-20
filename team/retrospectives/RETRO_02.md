# Retrospective 18, Feb 2026

* Led by: Yuxi Ji
* Present: Yuxi Ji, Daniel Du, Krisha Soneji, Mahima Chaudhary, Andy Wang
* Absent: none

## Action Item

* **A goal:** Improve how we work together on overlapping files and reduce merge conflicts, while making the app feel more like a food app based on user feedback.

* **A change:** We will establish a clearer merge and branching strategy before the next sprint (e.g., smaller feature branches, more frequent syncs with main, and clearer ownership of files). We will also document the deployment setup (Vercel env vars, Firebase config) so other team members can troubleshoot if needed.

* **A measurement:** 
  - Fewer merge conflicts in the next sprint compared to sprint 01.
  - At least one piece of user feedback that the app “feels more food-related” after our UI changes.

## Optional

* Sprint 01 MVP delivered all core features (manual entry, login/signup, AI scanning, recipe generation, expiration progress bar, account page). The main pain points were deployment setup and merge conflicts.
* User feedback was mostly positive on UI clarity and onboarding, but concerns about gradients, readability, recipe flow length, and onboarding length will guide our next sprint.
* Communities / recipe sharing is a stretch goal for the next sprint if time permits.

---

## Retro Assessment

* **Process used:** We used the **Start / Stop / Continue** retrospective method. 

* **How it went:** It was quick and let everyone share their input. It went well and was insightful to hear how other members were feeling about merge conflicts and deployment. We left with a clear action item and measurement.

* **Advice for the next retro leader:** Make sure every person gets a chance to speak and ask each person for their input for Start, Stop, and Continue so no one is left out.

---

## Experiment/Change

* **What constitutes your change/experiment:** We tried a clearer merge and branching strategy: (1) Create a feature branch per task or sub-issue instead of everyone working on the same branch. (2) Sync with main at least once per day (merge main into our branch or rebase) to reduce big merge conflicts. (3) Document the deployment setup (Vercel env vars, Firebase config) in a short team doc or README so other members can deploy or troubleshoot. Success was measured by fewer merge conflicts in the period after the retro and by at least one additional team member being able to run or troubleshoot deployment using the doc.

* **Assessment of results:** We saw fewer merge conflicts after adopting the new strategy; most work was done on feature branches and merged in smaller chunks. The deployment doc was used by one other team member to set up a local deploy path, which reduced the bottleneck of having only one person connected to Vercel. The measurement (fewer conflicts + broader deployment capability) was met. The change moved the needle: collaboration felt smoother and the team had a shared reference for deployment.

* **Decision going forward:** We will keep the change. We will continue using feature branches per task, daily sync with main, and the deployment doc. Next retro we may add a short “definition of done” for merges (e.g. PR reviewed or at least one other person acknowledged) if we want to tighten quality further.
