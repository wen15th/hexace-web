
# Hexace Inventory — Frontend Prototype

This version adds a complete authentication prototype to the original Inventory Tab Frontend Design:

- Sign in
- Sign up and email-verification confirmation
- Forgot password and email-sent confirmation
- Reset password and success confirmation
- Responsive desktop and mobile layouts
- Working navigation between authentication screens
- Sign in opens the original inventory application

## Run locally

1. Run `npm install`
2. Run `npm run dev`
3. Open the local address shown in the terminal

The sign-in form is pre-filled for prototype review. Any valid email and password with at least six characters will open the inventory application.

## Development preview

Pushes to the `main` branch automatically build and deploy the current mock-data frontend to GitHub Pages. In the repository settings, select **GitHub Actions** as the Pages source.

This deployment is intended for design and development review. It does not provide a backend, persistent data, or production authentication.

## Figma Make

Upload the project ZIP or paste `src/app/AuthPages.tsx` into the existing Make project and import it in `src/app/App.tsx`. This is a frontend prototype only; production authentication still requires a backend identity provider.
  
