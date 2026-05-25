import { PortfolioShell } from "@/components/portfolio-shell";
import { getGithubData } from "@/lib/github";
import { getTestimonials } from "@/lib/testimonials";
import { getVisitCount } from "@/lib/visits";
import { profile } from "@/data/profile";

export const revalidate = 60;

export default async function Home() {
  const [github, testimonials, visits] = await Promise.all([
    getGithubData(profile.social.githubUser),
    getTestimonials(),
    getVisitCount(),
  ]);
  return (
    <PortfolioShell
      github={github}
      testimonials={testimonials}
      visits={visits}
    />
  );
}
