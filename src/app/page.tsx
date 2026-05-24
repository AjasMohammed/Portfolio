import { PortfolioShell } from "@/components/portfolio-shell";
import { getGithubData } from "@/lib/github";
import { getTestimonials } from "@/lib/testimonials";
import { profile } from "@/data/profile";

export const revalidate = 60;

export default async function Home() {
  const [github, testimonials] = await Promise.all([
    getGithubData(profile.social.githubUser),
    getTestimonials(),
  ]);
  return <PortfolioShell github={github} testimonials={testimonials} />;
}
