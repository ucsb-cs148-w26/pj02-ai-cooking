# Mahima:
- I experimented with using Cursor for my sub-issue this week. My sub-issue was to make pantry items persist across page reloads and keep user state. 
- Cursor was very useful. I liked that it could see all the project files without me having to uploading files each time, which made it easier to fix cross-file behavior.
- It did take trial and error: the first fixes only addressed the Recipes tab and I had to clarify that the Pantry tab was still empty on reload before it added the same caching and logic there.
- The tool was helpful, but clear, concrete feedback like,“items show in Recipes but not in Pantry after reload,” was important to get a complete fix.
- To ensure the AI output was correct, I re-read the changed code so I understood what was added and could make sure it made sense. I also treated the suggestions as a starting point and tested it
  in my branch before merging with main.
