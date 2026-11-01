# LSPU Student Information & Enrollment

A responsive LSPU student-services landing page and SIEMS authentication portal.
The authentication module, styles, and Firebase client code are all in
`index.html`.

## Run locally

Start a static server from the project directory:

```sh
python3 -m http.server 8080 --bind 0.0.0.0
```

Open `http://localhost:8080`. Firebase Authentication does not work from a
`file://` URL. In Codespaces, open the forwarded port 8080 preview.

## Firebase setup

1. Create a Firebase project, register a Web app, then replace the six
   placeholders in the `firebaseConfig` block near the top of the script in
   `index.html`. The Web config contains public identifiers only; never put
   service-account keys or Gmail credentials in the page.
2. In **Authentication → Sign-in method**, enable **Email/Password**. Add the
   localhost and deployed hostnames to **Authentication → Settings → Authorized
   domains**.
3. Create a **Cloud Firestore** database.
4. Copy the Firestore rules from the setup guide in the page, test them, and
   publish them. These rules let users create only their own `student` profile
   and queue only the two approved email templates to their own address.
   Administrator, registrar, and faculty roles must be assigned by trusted
   university staff. Configure additional production rate limits and Firebase
   App Check before launch.
5. In **Extensions**, install Firebase's **Trigger Email** extension. Set its
   mail collection to `mail` and its template collection to `emailTemplates`.
   Configure the extension's SMTP connection to Gmail using
   `smtp.gmail.com`, your sender Gmail address, and a Google **App Password**
   (not the Gmail account password). Keep the App Password in the extension's
   secret/configuration settings only.
6. In Firestore, create the following documents in `emailTemplates`. Keep
   placeholders double-braced so the extension escapes user-provided values.

`emailTemplates/siemsWelcome`

```json
{
  "subject": "Welcome to LSPU SIEMS",
  "html": "<!doctype html><html><body style=\"margin:0;background:#f3f6f3;font-family:Arial,sans-serif;color:#243329\"><div style=\"max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden\"><header style=\"padding:28px;background:#173b2d;color:#fff;border-bottom:5px solid #1B9E3E\"><div style=\"font-size:12px;letter-spacing:3px;color:#FFC300\">LSPU · SIEMS</div><h1 style=\"margin:12px 0 0;font-size:24px\">Welcome to Laguna State Polytechnic University</h1></header><main style=\"padding:28px;line-height:1.7\"><p>Hello {{displayName}},</p><p>Your student account has been created. Here are your registration details:</p><p><strong>Name:</strong> {{displayName}}<br><strong>Email:</strong> {{email}}<br><strong>Registration date:</strong> {{registrationDate}}<br><strong>Registration time:</strong> {{registrationTime}}</p><p>Confirm your address using the separate Firebase verification email. If you did not create this account, contact the university administrator.</p></main><footer style=\"padding:18px 28px;background:#f3f6f3;color:#68766d;font-size:12px\">Laguna State Polytechnic University · Student Information and Enrollment Management System</footer></div></body></html>"
}
```

`emailTemplates/siemsLoginAlert`

```json
{
  "subject": "LSPU SIEMS sign-in notice",
  "html": "<!doctype html><html><body style=\"margin:0;background:#f3f6f3;font-family:Arial,sans-serif;color:#243329\"><div style=\"max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden\"><header style=\"padding:28px;background:#173b2d;color:#fff;border-bottom:5px solid #1D4ED8\"><div style=\"font-size:12px;letter-spacing:3px;color:#FFC300\">LSPU · SIEMS SECURITY</div><h1 style=\"margin:12px 0 0;font-size:24px\">New sign-in to your account</h1></header><main style=\"padding:28px;line-height:1.7\"><p>Hello {{displayName}},</p><p>Your LSPU SIEMS account was accessed with these details:</p><p><strong>Email:</strong> {{email}}<br><strong>Date:</strong> {{loginDate}}<br><strong>Time:</strong> {{loginTime}}<br><strong>Device / browser:</strong> {{deviceBrowser}}</p><p>If this was not you, reset your password immediately and contact the university administrator.</p></main><footer style=\"padding:18px 28px;background:#f3f6f3;color:#68766d;font-size:12px\">Laguna State Polytechnic University · Student Information and Enrollment Management System</footer></div></body></html>"
}
```

Firebase Auth sends the verification and password-reset emails. The custom
welcome and sign-in notices are queued by the page and sent by the Trigger Email
extension; SMTP secrets are never delivered to the browser. Review and test
Firestore rules and templates in a non-production project before deploying.
