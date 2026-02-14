## Mahima:
- I experimented with using Cursor for my sub-issue this week. My sub-issue was to make pantry items persist across page reloads and keep user state. 
- Cursor was very useful. I liked that it could see all the project files without me having to uploading files each time, which made it easier to fix cross-file behavior.
- It did take trial and error: the first fixes only addressed the Recipes tab and I had to clarify that the Pantry tab was still empty on reload before it added the same caching and logic there.
- The tool was helpful, but clear, concrete feedback like,“items show in Recipes but not in Pantry after reload,” was important to get a complete fix.
- To ensure the AI output was correct, I re-read the changed code so I understood what was added and could make sure it made sense. I also treated the suggestions as a starting point and tested it
  in my branch before merging with main.

## Andy:
- I used Cursor to help set up unit testing in our project and create an initial test suite for date validation logic.
- The main outcomes were: adding Vitest test scripts, creating `expirationDateService.test.ts`, validating edge cases (invalid dates and leap years), and documenting the work in `team/TESTING.md`.
- Cursor was useful because it sped up repetitive setup steps and helped suggest strong edge-case coverage I might have missed at first.
- Going forward, I think this is most useful for writing first-pass tests quickly, then refining them manually based on our actual requirements.
- To make sure the AI output was correct and understandable, I reviewed every code change, ran `npm test`, and checked that all tests passed before pushing.
- For fair use, I treated AI output as draft code, rewrote/improved parts to fit our codebase, and avoided copy-pasting unknown external snippets without understanding them.
- A tool pointer I would share in `help_ai`: use Cursor + Vitest together, and ask for "edge cases first" before generating tests.

## Krisha:
- I experimented with using Cursor for my subissue this week, which was to make pantry items deletable
- I found it very useful as it was able to easily identify what part of the code needed to be changed and quickly generate code for a delete button
- When I first created the button it did not work and kept saying “permission denied” when I clicked on it, and I was able to ask Cursor how to solve this
- Without it, it would have been very difficult for me to identify that it was a Firebase permissions issue since I didn’t have access to the Firebase log in
- In class I was able to fix it with my team member who manages the Firebase account
- To ensure that the output was correct I used my previous knowledge of html/css to ensure that it created the button properly
- I also checked the Firebase permissions and ensured that they would only alter the delete functionality

## Yuxi: Expiration Progress Bar (Gradescope-style)

**AI Tool Utilized:** Cursor (AI-first IDE with built-in code generation and editing)

**Outcomes Produced:**
- Created `ExpirationProgressBar.tsx` component with Gradescope-style visual design
- Horizontal progress bar showing timeline from item creation to expiration
- Status indicators (Fresh / Expiring Soon / Expired) with colored dots and "X days, Y hours left" countdown
- Integrated `ExpirationReminders` dashboard section and refactored pantry list to use progress bars for all items

**Reflections:**
*Usefulness:* The AI was very effective for rapid prototyping. Providing a reference image (Gradescope UI) and acceptance criteria allowed it to generate a working component structure quickly. It handled Tailwind CSS styling, date calculations, and React patterns without manual scaffolding. For future work, this tool could speed up UI component creation, especially when clear design references exist.

*Correctness & Fair Use:* I reviewed all generated code before committing. Steps taken: (1) Ran the dev server to verify the progress bar renders correctly; (2) Checked date logic for edge cases (expired items, missing `createdAt`); (3) Ensured no hardcoded secrets or improper dependencies. The AI output required minor fixes (e.g., fallback for missing `createdAt`). The design was inspired by Gradescope’s layout but implemented from scratch with our own data and styling—no direct copying of proprietary code.

**Useful Tool Pointer:** [Cursor](https://cursor.com) — AI-assisted IDE that integrates chat and inline edits with your codebase; strong for iterative UI and component development.

## Daniel: Account Page Integration (Login-State Header)

**AI Tool Utilized:** Cursor (AI-first IDE)

**Outcomes Produced:**
- Updated `Layout.tsx` to show an account circle instead of Log In / Sign Up when the user is logged in
- Added `AuthProvider.tsx` context to fix auth state synchronization across navigation
- Added account link to mobile bottom navigation
- Wired the account circle to the existing `/account` page (email, User ID, Member Since, logout)

**Reflections:**
*Usefulness:* The AI helped diagnose why the account circle did not appear after login (race condition between `useAuth()` and `router.push`). It proposed an AuthProvider pattern so auth state is shared at the app root, which resolved the timing issue. For future work, this approach is useful for cross-page shared state and navigation-related bugs.

*Correctness & Fair Use:* I verified the fix by logging in and confirming the account circle appears on the home page. I also checked that unauthenticated users still see Log In / Sign Up. The AuthProvider pattern is a standard React approach; the AI provided a correct, minimal implementation. No external code or assets were copied.

**Useful Tool Pointer:** [Cursor](https://cursor.com) — Helpful for debugging and refactoring, especially when you can describe the symptom (“still see login buttons after login”) and the AI suggests architectural changes like adding a context provider.
