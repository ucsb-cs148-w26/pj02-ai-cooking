# Mahima:
- I experimented with using Cursor for my sub-issue this week. My sub-issue was to make pantry items persist across page reloads and keep user state. 
- Cursor was very useful. I liked that it could see all the project files without me having to uploading files each time, which made it easier to fix cross-file behavior.
- It did take trial and error: the first fixes only addressed the Recipes tab and I had to clarify that the Pantry tab was still empty on reload before it added the same caching and logic there.
- The tool was helpful, but clear, concrete feedback like,“items show in Recipes but not in Pantry after reload,” was important to get a complete fix.
- To ensure the AI output was correct, I re-read the changed code so I understood what was added and could make sure it made sense. I also treated the suggestions as a starting point and tested it
  in my branch before merging with main.

# Andy:
- I used Cursor to help set up unit testing in our project and create an initial test suite for date validation logic.
- The main outcomes were: adding Vitest test scripts, creating `expirationDateService.test.ts`, validating edge cases (invalid dates and leap years), and documenting the work in `team/TESTING.md`.
- Cursor was useful because it sped up repetitive setup steps and helped suggest strong edge-case coverage I might have missed at first.
- Going forward, I think this is most useful for writing first-pass tests quickly, then refining them manually based on our actual requirements.
- To make sure the AI output was correct and understandable, I reviewed every code change, ran `npm test`, and checked that all tests passed before pushing.
- For fair use, I treated AI output as draft code, rewrote/improved parts to fit our codebase, and avoided copy-pasting unknown external snippets without understanding them.
- A tool pointer I would share in `help_ai`: use Cursor + Vitest together, and ask for "edge cases first" before generating tests.
