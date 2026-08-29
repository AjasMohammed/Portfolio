import { unstable_cache } from "next/cache";
import { PortfolioShell } from "@/components/portfolio-shell";
import { getGithubData } from "@/lib/github";
import { getTestimonials } from "@/lib/testimonials";
import { getProjects } from "@/lib/projects";
import { getVisitCount } from "@/lib/visits";
import { profile } from "@/data/profile";

export const revalidate = 60;

// The Upstash client fetches with no-store, which would force this whole
// route dynamic and silently disable the `revalidate = 60` ISR above.
// Caching the read keeps `/` prerendered; the live number comes from the
// client's POST /api/visit response anyway.
const getCachedVisitCount = unstable_cache(
  () => getVisitCount(),
  ["visit-count"],
  { revalidate: 60 },
);

export default async function Home() {
  const [github, testimonials, projects, visits] = await Promise.all([
    getGithubData(profile.social.githubUser),
    getTestimonials(),
    getProjects(),
    getCachedVisitCount(),
  ]);
  return (
    <PortfolioShell
      github={github}
      testimonials={testimonials}
      projects={projects}
      visits={visits}
    />
  );
}
