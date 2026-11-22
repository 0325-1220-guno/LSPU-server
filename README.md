# LSPU Student Information and Enrollment Management System

A standalone school-project demo built with HTML, CSS, and JavaScript. It uses
browser storage only; there is no Firebase, server, or external service.

The page markup is in `index.html`. CSS is split by responsibility in `css/`:
shared defaults, landing page, account access, workspace, and responsive
styles. Browser code is organized as ES modules in `js/` (`app.js`
coordinates the portal, while `landing.js`, `security.js`, and `config.js`
hold focused functionality and shared settings).

## Run the website

Open the project in VS Code. The **Run website on port 8080** task starts
automatically when the workspace opens. In Codespaces, wait for the **LSPU
website** port to be forwarded, then open its browser link. The server must
remain running while you use the site.

To start it manually instead, run this from the project directory:

```sh
python3 -m http.server 8080 --bind 0.0.0.0
```

Then open <http://localhost:8080>. In Codespaces, use the forwarded port link
rather than `127.0.0.1` from a different machine or browser.

## Using the demo

- Login is the opening page. Choose **Explore LSPU** to view the public Home,
  About, Programs, Campuses, Admissions, and Contact sections. After sign-in,
  students start on **Home**, with shortcuts to their profile, enrollment, and
  schedule; administrators start on the dashboard. Use the **Dark mode**
  toggle on the sign-in page or in the workspace to switch themes; your choice
  is saved in this browser.
- Student sign-up asks for a name, email, course, year level, and password.
  Students choose from nine courses and year levels 1st through 4th. The
  password field shows a live strength meter and checklist. New accounts
  always receive the Student role and a unique student number in the format
  `LSPU-YYYY-0001`. Existing student accounts without a number are assigned
  one when the portal next loads.
- The Student workspace shows only the signed-in student's profile, enrollment,
  and schedule. **My Schedule** includes a month calendar with dated class
  sessions and a list of any existing weekly schedule entries.
- Students can add, replace, or remove a profile photo from **My Information**.
  The crop editor has zoom and position controls plus a center reset. Photos
  are cropped and resized in the browser, then saved with this demo's local
  data; they are not uploaded or shared between browsers. A profile-completion
  indicator highlights missing details.
- The Admin workspace can manage student profiles, enrollments, dated class
  schedules, and accounts. Enrollment and class forms prefill the student's
  selected program, which administrators can edit for a specific subject.
  Each course is limited to 100 active enrollments per semester. Classes added
  under **Class Schedule** appear on the selected student's calendar.
- A default Admin account is created the first time the page loads. Its demo
  password is set in `js/config.js`; change the value before first use. To
  change it after the Admin account was already created, clear the demo's
  browser storage so the account can be created again.
- Demo accounts and records stay in this browser's `localStorage`.
- Use **Logout** to end the saved session. **Remember me** controls whether a
  sign-in survives closing the browser.
- To clear this demo's accounts and records, clear the site's browser storage.

Passwords are stored as salted SHA-256 hashes, not plain text. This is only a
local demo: browser storage and client-side role checks are not suitable for
real student records, secure accounts, or accounts shared between devices.
