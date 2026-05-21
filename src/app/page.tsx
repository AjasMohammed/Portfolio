import { PortfolioShell } from "@/components/portfolio-shell";
import { getGithubData } from "@/lib/github";
import { profile } from "@/data/profile";

export const revalidate = 600;

export default async function Home() {
  const github = await getGithubData(profile.social.githubUser);
  return <PortfolioShell github={github} />;
}
