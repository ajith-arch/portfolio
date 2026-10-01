Flipkart Payments Case Study — complete export
================================================

WHAT IS INCLUDED
- website/             Ready-to-serve HTML, CSS, JavaScript, favicon and locally bundled fonts. No Google Fonts request is needed to view it.
- source/              Original editable React/TypeScript components, all CSS files, public files and build configuration from the Replit workspace.
- phone-design-reference.png   The provided screenshot used as a visual reference.
- font-licenses/ and FONT-LICENSES.txt   Licenses/notices for the bundled font files.

VIEW THE WEBSITE
Unzip and serve the website directory using any static HTTP server. For example:
  cd website
  python3 -m http.server 8000
Then open http://localhost:8000/ in a browser. You can also upload the entire website directory to a static web host. Keep index.html and assets/ together. Browser restrictions may prevent JavaScript modules from running correctly when index.html is opened directly with file://, so use a server.

EDIT THE DESIGN
The original, readable source is in source/src/ (App.tsx, CaseStudySections.tsx, VisualProof.tsx, and the CSS files). This is a snapshot from a pnpm monorepo: its package.json uses workspace catalog entries and its Vite config expects PORT and BASE_PATH. To rebuild that source unmodified, place it back in the original Replit workspace. The ready-to-serve website/ does not need pnpm or the Replit workspace. The exported website's CSS/JS is optimized build output, not the recommended place to edit copy or layouts.

NOTES
- The phone/payment flows are illustrative concepts, not a live payment system or an official Flipkart page.
- The site's six proof-image areas remain intentionally labelled placeholders; they are not replaced by fabricated screenshots.
- Website asset URLs are relative, so the folder can be served under a subdirectory.
- No node_modules, private workspace secrets, or server/database files are included.
