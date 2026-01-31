<h1 style="color:green">AI Cooking App</h1>

**Description:**

This app helps people who do not know how to cook, feel stuck on what to make, or want to eat healthier using the ingredients they already have. It does this by keeping track of the user's inventory of food and provides recipies that will prioritize food about to go bad in order to finish them before decaying.

**Group Members:**

<span style="color:blue">Andy Wang @a-Fat-Cat</span><br>
<span style="color:blue">Daniel Du @DanielDu-735</span><br> 
<span style="color:blue">Mahima Chaudhary @mahimac2006</span><br>
<span style="color:blue">Krisha Soneji @krishasone</span><br>
<span style="color:blue">Yuxi Ji @Yuxi-Ji</span>

**Tech Stack:**

- We chose Next.js for its seamless combination of React, server-side rendering, and API routes, allowing us to build a fast, scalable full-stack application with minimal overhead.

- We chose Vercel for its native support of Next.js, zero-config deployments, and automatic scaling, which lets us iterate quickly without managing infrastructure.

- We chose Firebase for its authentication, real-time database, and serverless backend services, enabling rapid development while maintaining security and reliability.

**User Roles:**

- The primary user is someone seeking personalized cooking support. They may be a beginner, busy student, or anyone trying to reduce food waste and build confidence in the kitchen. 

- Our web-app has one kind of user: People using it for recipes and help with reducing food waste.

- Users will be able to upload what ingredients they have, when they bought them, preferences they have like cuisine type, and if they have any allergies/restrictions. The app will then recommend recipes that match what they already own, prioritize ingredients that are closest to expiring, and send reminders when items are about to go bad.

- Their goals could be to learn how to cook and reduce food waste and our app supports this by generating recipes tailored to the user’s exact pantry, preferences, and skill level, plus step by step guidance while they cook.

**Permissions:**

- Anyone can use our app with a valid email address.

<h2>Installation</h2>

<h3>Prerequisites</h3>
<p>To use the application, users only need:</p>
<ul>
  <li>A modern web browser (Chrome, Firefox, Safari, or Edge)</li>
  <li>A valid email address (for authentication)</li>
</ul>
<p>No local installation is required for normal use.</p>

<h3>Dependencies</h3>
<ul>
  <li>Next.js / React – Frontend framework</li>
  <li>Node.js – Runtime environment</li>
  <li>npm – Dependency management</li>
  <li>GitHub Actions – Continuous integration</li>
  <li>Vercel - deployment.</li>
</ul>

<h3>Installation Steps</h3>
<p>
  Since we’re designing a web App, we will give the user the link that we
  deployed, so they can access it via the link.
</p>

<p>Or, Local:</p>
<ol>
  <li>
    Clone the repository
    <pre>
git clone git@github.com:ucsb-cs148-w26/pj02-ai-cooking.git
cd &lt;your-project-folder&gt;
    </pre>
  </li>
  <li>
    Install dependencies
    <pre>npm install</pre>
  </li>
  <li>
    Start the development server
    <pre>npm run dev</pre>
  </li>
  <li>
    Open the app in your browser
    <pre>http://localhost:3000</pre>
  </li>
</ol>

<h2>Functionality</h2>
<p>
  The AI Cooking App helps users decide what to cook based on the ingredients
  they already have, while reducing food waste.
</p>

<p><strong>Typical User Walkthrough</strong></p>

<p><strong>Sign Up / Log In</strong></p>
<ul>
  <li>Users create an account using their email address</li>
</ul>

<p><strong>Add Ingredients</strong></p>
<ul>
  <li>Users input ingredients they currently have</li>
  <li>They can specify purchase dates and expiration-related details</li>
</ul>

<p><strong>Set Preferences</strong></p>
<ul>
  <li>Users can specify dietary restrictions, allergies, and cuisine preferences</li>
</ul>

<p><strong>Recipe Recommendations</strong></p>
<ul>
  <li>The app generates recipe suggestions based on:</li>
  <li>Available ingredients</li>
  <li>Items closest to expiration</li>
  <li>User preferences and restrictions</li>
</ul>

<p><strong>Guided Cooking</strong></p>
<ul>
  <li>Recipes include step-by-step instructions to help users cook confidently</li>
  <li>
    The app prioritizes reducing food waste by suggesting recipes that use
    soon-to-expire items
  </li>
</ul>

<p><strong>Reminders</strong></p>
<ul>
  <li>Users receive reminders when ingredients are close to going bad</li>
</ul>

<h2>Known Problems</h2>
<ul>
  <li>
    Recipe recommendations may occasionally include ingredients the user does
    not have in sufficient quantity
  </li>
  <li>
    Expiration date predictions are estimates and may not always match real-world
    spoilage
  </li>
  <li>UI responsiveness may be inconsistent on very small screen sizes</li>
  <li>Error handling for incomplete ingredient entries is limited</li>
  <li>
    Most known issues are related to logic in the recipe recommendation and
    ingredient tracking components.
  </li>
</ul>

<h2>Contributing</h2>
<ul>
  <li>Fork it!</li>
  <li>Create your feature branch: <code>git checkout -b my-new-feature</code></li>
  <li>Commit your changes: <code>git commit -am 'Add some feature'</code></li>
  <li>Push to the branch: <code>git push origin my-new-feature</code></li>
  <li>Submit a pull request :D</li>
</ul>

<h2>License</h2>
<p>
  This project is licensed under the MIT License.<br>
  For details: pj02-ai-cooking/LICENSE.md at main · ucsb-cs148-w26/pj02-ai-cooking
</p>