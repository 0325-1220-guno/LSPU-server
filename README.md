# LSPU Student Information and Enrollment Management System

A standalone school-project demo built with HTML, CSS, and JavaScript. It uses
browser storage only; there is no Firebase, server, or external service.

## Run locally

From the project directory, start a local web server:

```sh
python3 -m http.server 8080 --bind 0.0.0.0
```

Open <http://localhost:8080>. Keep the terminal running while you use the
site. In Codespaces, open the forwarded port 8080.

## Using the demo

- Student sign-up asks for a name, email, and password. New accounts always
  receive the Student role and a unique student number in the format
  `LSPU-YYYY-0001`. Existing student accounts without a number are assigned one
  when the portal next loads.
- The Student workspace shows only the signed-in student's profile, enrollment,
  and schedule.
- The Admin workspace can manage student profiles, enrollments, and accounts.
- A default Admin account is created the first time the page loads. Its demo
  password is documented in a JavaScript code comment in `index.html`; change
  the value before first use. To change it after the Admin account was already
  created, clear the demo's browser storage so the account can be created again.
- Demo accounts and records stay in this browser's `localStorage`.
- Use **Logout** to end the saved session. **Remember me** controls whether a
  sign-in survives closing the browser.
- To clear this demo's accounts and records, clear the site's browser storage.

Passwords are stored as salted SHA-256 hashes, not plain text. This is only a
local demo: browser storage and client-side role checks are not suitable for
real student records, secure accounts, or accounts shared between devices.
