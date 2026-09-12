# CUPB

CUPB is a responsive university community app for campus updates, short reels, lost items, and direct conversations.

## Included

- Lost and found posts
- University posts and short reel feed
- Separate Campus Feed, Lost Items, and Reels sections
- Categories: electronics, digital, grocery and food, clothing, personal, books and notes, keys, cards and IDs, and other
- Search, lost/found filters, and category filtering
- Direct message composer on every post
- Instagram-style inbox threads with verified profile badges
- Google Identity Services login entry point
- Local browser persistence with `localStorage`
- Installable PWA manifest and offline service worker
- Responsive interface for phone and desktop

## Run locally

From this folder, run:

```powershell
python -m http.server 5500
```

Open `http://localhost:5500`.

## Google login setup

1. Create a Web OAuth client in Google Cloud Console.
2. Add the approved origin and redirect settings for your deployed HTTPS domain.
3. Put the client ID in `auth-config.js`.
4. Verify the returned Google ID token on a backend before trusting the profile in production.

The UI intentionally shows a setup message until a real client ID is configured. It never collects or stores a Google password.

## Play Store production checklist

This folder is a working PWA prototype. For a real Play Store release, add:

1. A backend API with Google authentication, server-side ID-token verification, and a cloud database for users, posts, reels, and messages.
2. Image upload storage and moderation for item photos.
3. A real-time messaging service with block/report controls.
4. HTTPS, privacy policy, terms of use, account deletion, and abuse reporting.
5. Android packaging with Capacitor or Trusted Web Activity, then generate a signed Android App Bundle (`.aab`).
6. Play Console store listing, screenshots, content declarations, and testing track release.

The current local inbox is intentionally useful for demos and offline testing, but it does not send messages between different devices until the backend is connected.
