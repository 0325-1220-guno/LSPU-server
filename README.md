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

- The public landing page includes Home, About, Programs, Campuses, Admissions,
  and Contact sections. Its university-inspired navy and green palette,
  subtle entrance and hover animations, and reduced-motion support are designed
  to keep the experience polished and accessible. Student login and account
  creation are available in the Student Portal panel.
- Student sign-up asks for a name, email, course, year level, and password.
  Students choose from three courses and year levels 1st through 4th. New
  accounts always receive the Student role and a unique student number in the
  format `LSPU-YYYY-0001`. Existing student accounts without a number are
  assigned one when the portal next loads.
- The Student workspace shows only the signed-in student's profile, enrollment,
  and schedule.
- The Admin workspace can manage student profiles, enrollments, and accounts.
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
