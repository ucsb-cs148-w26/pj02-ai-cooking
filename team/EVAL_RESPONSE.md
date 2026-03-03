# 1) Feedback based on User Needs.md

100% of testers said they would use at least one of the three generated recipes. Even the lowest response (1 out of 3) still indicated they would try a recipe.  

Breakdown of how many recipes (out of 3) testers would use:  
3/3: 3 testers  
2/3: 3 testers  
1/3: 1 tester  

Average number of recipes testers would use:  
On average, testers would use approximately 2.3 out of 3 generated recipes, indicating strong relevance and practicality.  

Accuracy: Most testers reported that all items in their images were correctly identified. One tester estimated about 85% accuracy, and one tester was unable to test due to an upload error. Overall perceived accuracy was approximately 90–100%. The system performed well even with messy images, multiple groceries, and niche items.  

Speed: Reported detection times ranged from 2–3 seconds to 8–10 seconds, with most responses under 5 seconds. The estimated average perceived detection time is approximately 5–7 seconds.  

---

# 2) Summary of Features

Recipe Generator Page: Generates recipes, but can be manipulated through injection testing, also shows quota exceeded error messages on the website itself  

Manual Pantry Addition Page: Cool UI, but when adding a new pantry item, it sometimes glitches and adds two pantry items instead of one  

Receipt/Fridge Scanner Page: Really good image detection, however the UI of the Choose file button can be improved as it is not very obvious that it is clickable, also shows quota exceeded error messages on the website itself.  

---

# 3) Effectiveness

App has a nice, clean and intuitive UI  

It is a nice upgrade from the previous gradient UI  

Error messages from Gemini about quota exceeding limit show up to the user, needs to be hidden  

Choose file button needs to be more apparent, it is hard to find  

Recipes do not take into account the restrictions at times, and can also be manipulated through injection tests  

---

# 4) Deployment Instructions

They are unclear and misleading  

We should be more clear in directing them to the deployed site  

---

# 5) Final Closing Thoughts

They all liked the UI and found it to be clean, intuitive and user friendly  

The most impactful opportunity for improvement is improving the error handling for the Gemini API so that it does not show directly on the website to the user, and also fixing the pantry addition issue 

One final thing they all liked were the recipes that were generated, they were generally usable as long as the recipe generator was used in the way that it was intended  

---

# RESPONSE:

## 1) Decisions based on user feedback needs

Improve error handling on the gemini API so that user cannot see it  

## 2) Additional Decisions

Ensure that recipes follow user restrictions/preferences (3)  

Make choose file button more obvious (2,3)  

Improve Deployment instructions (4)  

Fix any pantry glitches (2)  

Change Gemini prompt to safeguard against injection tests (3)  
