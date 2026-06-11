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

export type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type Contributions = {
  totalContributions: number;
  weeks: ContributionDay[][];
  mostActiveDay: { date: string; count: number } | null;
  currentStreak: number;
  longestStreak: number;
  daysActive: number;
  from: string;
  to: string;
};

export type GithubData = {
  user: GithubUser | null;
  repos: GithubRepo[];
  ownedRepos: GithubRepo[];
  topLanguages: { name: string; count: number }[];
  totalStars: number;
  latestRepo: GithubRepo | null;
  profileReadme: string | null;
  contributions: Contributions | null;
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

async function ghGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T | null> {
  if (!process.env.PORTFOLIO_GITHUB_TOKEN) return null;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "ajas-portfolio",
        Authorization: `Bearer ${process.env.PORTFOLIO_GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.error("[github graphql] !ok", res.status);
      return null;
    }
    const json = (await res.json()) as { data?: T; errors?: unknown };
    if (json.errors) {
      console.error("[github graphql] errors", json.errors);
      return null;
    }
    return json.data ?? null;
  } catch (e) {
    console.error("[github graphql] threw", e);
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

const CONTRIBUTION_LEVELS: Record<string, 0 | 1 | 2 | 3 | 4> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export async function getGithubContributions(
  username: string,
): Promise<Contributions | null> {
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;
  type Resp = {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: {
              date: string;
              contributionCount: number;
              contributionLevel: string;
            }[];
          }[];
        };
      };
    } | null;
  };
  const data = await ghGraphQL<Resp>(query, { username });
  if (!data?.user) return null;
  const cal = data.user.contributionsCollection.contributionCalendar;

  const weeks: ContributionDay[][] = cal.weeks.map((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: CONTRIBUTION_LEVELS[d.contributionLevel] ?? 0,
    })),
  );
  const flat = weeks.flat();

  let mostActiveDay: { date: string; count: number } | null = null;
  let daysActive = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  for (const d of flat) {
    if (d.count > 0) {
      daysActive++;
      runningStreak++;
      if (runningStreak > longestStreak) longestStreak = runningStreak;
    } else {
      runningStreak = 0;
    }
    if (!mostActiveDay || d.count > mostActiveDay.count) {
      mostActiveDay = { date: d.date, count: d.count };
    }
  }

  // The calendar's last cell is *today* — an empty today shouldn't zero the
  // streak before the day is over, so skip it and count back from yesterday.
  let currentStreak = 0;
  let start = flat.length - 1;
  if (start >= 0 && flat[start].count === 0) start--;
  for (let i = start; i >= 0; i--) {
    if (flat[i].count > 0) currentStreak++;
    else break;
  }

  return {
    totalContributions: cal.totalContributions,
    weeks,
    mostActiveDay: mostActiveDay && mostActiveDay.count > 0 ? mostActiveDay : null,
    currentStreak,
    longestStreak,
    daysActive,
    from: flat[0]?.date ?? "",
    to: flat[flat.length - 1]?.date ?? "",
  };
}

const HIDDEN_REPO_SLUGS = new Set(["ajasmohammed/portfolio"]);

function isHiddenRepo(repo: GithubRepo): boolean {
  return HIDDEN_REPO_SLUGS.has(repo.full_name.toLowerCase());
}

// Follow pagination so stars/languages/year histograms stay correct past 100
// repos. Capped at 3 pages — far above the current account size, while still
// bounding the request volume per revalidation.
async function getAllRepos(username: string): Promise<GithubRepo[] | null> {
  const all: GithubRepo[] = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await gh<GithubRepo[]>(
      `/users/${username}/repos?per_page=100&sort=updated&page=${page}`,
    );
    if (!batch) return page === 1 ? null : all;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

export async function getGithubData(username: string): Promise<GithubData> {
  const [rawUser, repos, profileReadme, contributions] = await Promise.all([
    gh<GithubUser>(`/users/${username}`),
    getAllRepos(username),
    ghRaw(`/repos/${username}/${username}/readme`),
    getGithubContributions(username),
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
    contributions,
    fetchedAt: new Date().toISOString(),
  };
}
