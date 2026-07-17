import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildActivityPayload,
    getActivityDateRange,
    hasSameActivityData
} from '../scripts/update-github-activity.mjs';

test('creates a rolling range containing the current month and previous eleven months', () => {
    assert.deepEqual(getActivityDateRange(new Date('2026-07-17T12:00:00Z')), {
        from: '2025-08-01',
        to: '2026-07-17'
    });
});

test('builds real monthly contribution and repository statistics', () => {
    const payload = buildActivityPayload({
        generatedAt: '2026-02-28T12:00:00Z',
        range: { from: '2026-01-01', to: '2026-02-28' },
        user: {
            login: 'parzidev',
            contributionsCollection: {
                restrictedContributionsCount: 2,
                contributionCalendar: {
                    weeks: [{
                        contributionDays: [
                            { date: '2026-01-05', contributionCount: 2, contributionLevel: 'FIRST_QUARTILE' },
                            { date: '2026-01-20', contributionCount: 3, contributionLevel: 'SECOND_QUARTILE' },
                            { date: '2026-02-03', contributionCount: 8, contributionLevel: 'FOURTH_QUARTILE' },
                            { date: '2026-02-27', contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' }
                        ]
                    }]
                }
            },
            repositories: {
                nodes: [
                    { name: 'one', stargazerCount: 4, pushedAt: '2026-02-20T10:00:00Z', isArchived: false, primaryLanguage: { name: 'JavaScript' } },
                    { name: 'two', stargazerCount: 3, pushedAt: '2026-02-21T10:00:00Z', isArchived: false, primaryLanguage: { name: 'JavaScript' } },
                    { name: 'old', stargazerCount: 99, pushedAt: '2025-01-01T00:00:00Z', isArchived: true, primaryLanguage: { name: 'Python' } }
                ]
            }
        }
    });

    assert.equal(payload.contributions.total, 14);
    assert.deepEqual(payload.contributions.months.map(month => month.count), [5, 9]);
    assert.deepEqual(payload.contributions.months.map(month => month.level), [3, 4]);
    assert.deepEqual(payload.contributions.best_day, { date: '2026-02-03', count: 8 });
    assert.equal(payload.contributions.last_contribution_date, '2026-02-27');
    assert.equal(payload.stats.stars, 7);
    assert.equal(payload.stats.public_repositories, 2);
    assert.equal(payload.stats.top_language, 'JavaScript');
    assert.deepEqual(payload.stats.latest_repository, {
        name: 'two',
        pushed_at: '2026-02-21T10:00:00Z'
    });
});

test('ignores generated_at when deciding whether activity changed', () => {
    const base = { schema_version: 1, generated_at: '2026-01-01T00:00:00Z', contributions: { total: 4 } };
    const refreshed = { ...base, generated_at: '2026-01-02T00:00:00Z' };
    const changed = { ...refreshed, contributions: { total: 5 } };

    assert.equal(hasSameActivityData(base, refreshed), true);
    assert.equal(hasSameActivityData(base, changed), false);
});
