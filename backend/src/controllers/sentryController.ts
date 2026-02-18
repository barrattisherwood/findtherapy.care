import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// GET /admin/sentry-issues
// Proxies Sentry REST API so the auth token never reaches the frontend
export const getSentryIssues = async (_req: AuthRequest, res: Response): Promise<void> => {
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const orgSlug = process.env.SENTRY_ORG_SLUG;
  const projectId = process.env.SENTRY_BACKEND_PROJECT_ID;

  // Graceful degradation — return empty list if not configured
  if (!authToken || !orgSlug) {
    res.json({ issues: [], configured: false });
    return;
  }

  try {
    const params = new URLSearchParams({
      limit: '10',
      query: 'is:unresolved',
      sort: 'date',
      ...(projectId ? { project: projectId } : {}),
    });

    const url = `https://de.sentry.io/api/0/organizations/${orgSlug}/issues/?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Sentry API error:', response.status, await response.text());
      res.json({ issues: [], configured: true });
      return;
    }

    const data: any[] = await response.json();

    res.json({
      configured: true,
      issues: data.map(issue => ({
        id: issue.id,
        title: issue.title,
        level: issue.level,        // 'error' | 'warning' | 'info'
        count: issue.count,
        userCount: issue.userCount,
        firstSeen: issue.firstSeen,
        lastSeen: issue.lastSeen,
        permalink: issue.permalink,
      })),
    });
  } catch (error) {
    console.error('Error fetching Sentry issues:', error);
    res.json({ issues: [], configured: true });
  }
};
