import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const DEFAULT_OUTPUT_PATH = 'data/github-activity.json';
const DEFAULT_USERNAME = 'parzidev';

const GITHUB_ACTIVITY_QUERY = `
query GitHubActivity($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login
    contributionsCollection(from: $from, to: $to) {
      restrictedContributionsCount
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
    }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      isFork: false
      privacy: PUBLIC
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      nodes {
        name
        stargazerCount
        pushedAt
        isArchived
        primaryLanguage {
          name
        }
      }
    }
  }
}
`;

export function getActivityDateRange(now = new Date()) {
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));

    return {
        from: formatIsoDate(from),
        to: formatIsoDate(to)
    };
}

export async function requestGitHubActivity({ token, username, range, fetchImpl = fetch }) {
    if (!token) {
        throw new Error('GITHUB_TOKEN is required to query GitHub GraphQL.');
    }

    const response = await fetchImpl(GITHUB_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'parzi-github-activity-updater'
        },
        body: JSON.stringify({
            query: GITHUB_ACTIVITY_QUERY,
            variables: {
                login: username,
                from: `${range.from}T00:00:00Z`,
                to: `${range.to}T23:59:59Z`
            }
        })
    });

    if (!response.ok) {
        throw new Error(`GitHub GraphQL request failed with HTTP ${response.status}.`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
        throw new Error(`GitHub GraphQL error: ${payload.errors.map(error => error.message).join('; ')}`);
    }

    if (!payload.data?.user) {
        throw new Error(`GitHub user ${username} was not found.`);
    }

    return payload.data.user;
}

export function buildActivityPayload({ user, range, generatedAt = new Date().toISOString() }) {
    const contributionCollection = user.contributionsCollection;
    const days = (contributionCollection?.contributionCalendar?.weeks || [])
        .flatMap(week => week.contributionDays || [])
        .filter(day => day.date >= range.from && day.date <= range.to)
        .sort((a, b) => a.date.localeCompare(b.date));

    const monthMap = createMonthMap(range);
    days.forEach(day => {
        const month = monthMap.get(day.date.slice(0, 7));
        if (month) month.count += Number(day.contributionCount) || 0;
    });

    const months = Array.from(monthMap.values());
    const maxMonthCount = Math.max(0, ...months.map(month => month.count));
    months.forEach(month => {
        month.level = getMonthlyLevel(month.count, maxMonthCount);
    });

    const activeDays = days.filter(day => Number(day.contributionCount) > 0);
    const bestDay = activeDays.reduce((best, day) => {
        if (!best || day.contributionCount > best.contributionCount) return day;
        if (day.contributionCount === best.contributionCount && day.date > best.date) return day;
        return best;
    }, null);
    const latestContribution = activeDays.at(-1) || null;

    const repositories = (user.repositories?.nodes || []).filter(repository => !repository.isArchived);
    const languageCounts = repositories.reduce((counts, repository) => {
        const language = repository.primaryLanguage?.name;
        if (language) counts[language] = (counts[language] || 0) + 1;
        return counts;
    }, {});
    const topLanguage = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
    const latestRepository = repositories
        .filter(repository => repository.pushedAt)
        .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))[0] || null;

    return {
        schema_version: 1,
        username: user.login,
        source: 'github-graphql',
        generated_at: generatedAt,
        range,
        contributions: {
            total: months.reduce((total, month) => total + month.count, 0),
            restricted: Number(contributionCollection?.restrictedContributionsCount) || 0,
            months,
            best_day: bestDay ? {
                date: bestDay.date,
                count: Number(bestDay.contributionCount) || 0
            } : null,
            last_contribution_date: latestContribution?.date || null
        },
        stats: {
            stars: repositories.reduce((total, repository) => total + (Number(repository.stargazerCount) || 0), 0),
            public_repositories: repositories.length,
            top_language: topLanguage,
            latest_repository: latestRepository ? {
                name: latestRepository.name,
                pushed_at: latestRepository.pushedAt
            } : null
        }
    };
}

export function hasSameActivityData(currentPayload, nextPayload) {
    if (!currentPayload || !nextPayload) return false;

    const withoutGeneratedAt = payload => {
        const { generated_at: _generatedAt, ...comparable } = payload;
        return comparable;
    };

    return JSON.stringify(withoutGeneratedAt(currentPayload)) === JSON.stringify(withoutGeneratedAt(nextPayload));
}

function createMonthMap(range) {
    const months = new Map();
    const cursor = new Date(`${range.from}T00:00:00Z`);
    const end = new Date(`${range.to}T00:00:00Z`);

    while (cursor <= end) {
        const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
        months.set(key, {
            key,
            name: cursor.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
            year: cursor.getUTCFullYear(),
            count: 0,
            level: 0
        });
        cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    }

    return months;
}

function getMonthlyLevel(count, maximum) {
    if (!count || !maximum) return 0;
    return Math.max(1, Math.min(4, Math.ceil((count / maximum) * 4)));
}

function formatIsoDate(date) {
    return date.toISOString().slice(0, 10);
}

async function readJson(path) {
    try {
        return JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}

async function main() {
    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME || DEFAULT_USERNAME;
    const outputPath = resolve(process.env.GITHUB_ACTIVITY_OUTPUT || DEFAULT_OUTPUT_PATH);
    const range = getActivityDateRange();
    const user = await requestGitHubActivity({ token, username, range });
    const nextPayload = buildActivityPayload({ user, range });
    const currentPayload = await readJson(outputPath);

    if (hasSameActivityData(currentPayload, nextPayload)) {
        console.log(`GitHub activity is already current for ${username}.`);
        return;
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(nextPayload, null, 2)}\n`, 'utf8');
    console.log(`Updated ${outputPath} with ${nextPayload.contributions.total} contributions.`);
}

const isMainModule = process.argv[1]
    && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
