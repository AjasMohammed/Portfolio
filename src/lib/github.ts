export type GithubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  pushed_at: string;
  updated_at: string;
  homepage: string | null;
  topics: string[];
};

export type GithubData = {
  user: GithubUser | null;
  repos: GithubRepo[];
  ownedRepos: GithubRepo[];
  topLanguages: { name: string; count: number }[];
  totalStars: number;
  latestRepo: GithubRepo | null;
  profileReadme: string | null;
  fetchedAt: string;
};

const REVALIDATE_SECONDS = 600;

function authHeader(): Record<string, string> {
  return process.env.PORTFOLIO_GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.PORTFOLIO_GITHUB_TOKEN}` }
    : {};
}

async function gh<T>(path: string): Promise<T | null> {
  const url = `https://api.github.com${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ajas-portfolio",
        ...authHeader(),
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.error("[github] fetch !ok", res.status, url);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error("[github] fetch threw", url, e);
    return null;
  }
}

async function ghRaw(path: string): Promise<string | null> {
  const url = `https://api.github.com${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ajas-portfolio",
        ...authHeader(),
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.error("[github] raw fetch threw", url, e);
    return null;
  }
}

const HIDDEN_REPO_SLUGS = new Set(["ajasmohammed/portfolio"]);

function isHiddenRepo(repo: GithubRepo): boolean {
  return HIDDEN_REPO_SLUGS.has(repo.full_name.toLowerCase());
}

export async function getGithubData(username: string): Promise<GithubData> {
  const [rawUser, repos, profileReadme] = await Promise.all([
    gh<GithubUser>(`/users/${username}`),
    gh<GithubRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`),
    ghRaw(`/repos/${username}/${username}/readme`),
  ]);

  const allRepos = (repos ?? []).filter((r) => !isHiddenRepo(r));
  const hiddenCount = (repos ?? []).length - allRepos.length;
  const user = rawUser
    ? { ...rawUser, public_repos: Math.max(0, rawUser.public_repos - hiddenCount) }
    : null;
  const ownedRepos = allRepos
    .filter((r) => !r.fork)
    .sort(
      (a, b) =>
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
    );

  const langCounts = new Map<string, number>();
  for (const r of ownedRepos) {
    if (!r.language) continue;
    langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
  }
  const topLanguages = [...langCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const totalStars = ownedRepos.reduce((n, r) => n + r.stargazers_count, 0);
  const latestRepo = ownedRepos[0] ?? null;

  return {
    user,
    repos: allRepos,
    ownedRepos,
    topLanguages,
    totalStars,
    latestRepo,
    profileReadme,
    fetchedAt: new Date().toISOString(),
  };
}
