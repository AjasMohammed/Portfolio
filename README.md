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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
