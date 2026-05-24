# Ajas Mohammed Portfolio

A personal portfolio site for Ajas Mohammed, built with Next.js App Router, TypeScript, and Tailwind CSS.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app` - App Router entry files, metadata, and global styles.
- `src/components` - Reusable portfolio sections and layout components.
- `src/data/profile.ts` - Resume-derived profile, experience, project, and skill content.
- `public/resume-ajas-mohammed.pdf` - Downloadable resume asset.

## Scripts

- `npm run dev` - Start the local development server.
- `npm run lint` - Run ESLint.
- `npm run build` - Create a production build.

## Content Updates

Most portfolio text lives in `src/data/profile.ts`, so you can update your experience, projects, skills, email, phone, and resume link without changing the section components.

## Testimonials ("kind words")

The site has a `kind words` bento tile that shows approved testimonials and a
form for visitors to leave new ones. There is no backend — submissions go to a
Google Form, and approved entries are read back from the Form's linked Google
Sheet as CSV.

The full setup recipe is in [.env.example](./.env.example) — six env vars in
total. Quick summary:

1. Create a Google Form with four fields: Name, "you are my…", Message,
   Email (optional). Link it to a Sheet.
2. In the Sheet, add an `Approved` column and set it to `TRUE` for the rows
   you want to publish.
3. Publish that sheet to the web as CSV and put the URL in
   `TESTIMONIALS_SHEET_CSV_URL`.
4. Get the form's `formResponse` URL and each field's `entry.<id>` value via
   "Get pre-filled link", then fill the `TESTIMONIALS_FORM_ACTION_URL` and
   `TESTIMONIALS_ENTRY_*` env vars.
5. Enable Form → ⋮ → "Get email notifications for new responses" so you
   get an email on every submission.

The site form POSTs to `/api/testimonials`, which forwards to the Google Form
server-side (so the browser never hits Google directly). Approved rows are
cached for 5 minutes and re-fetched on page load.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
