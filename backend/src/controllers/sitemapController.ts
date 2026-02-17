import { Request, Response } from 'express';
import { Provider } from '../models/Provider';

interface SitemapUrl {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

export const getSitemap = async (req: Request, res: Response) => {
  try {
    // Get all published providers with active access
    const now = new Date();
    const providers = await Provider.find({
      isPublished: true,
      vettingStatus: 'approved',
      isSuspended: { $ne: true },
      $or: [
        { subscriptionStatus: 'active' },
        { trialEndsAt: { $gt: now } }
      ]
    }).select('_id updatedAt');

    // Build XML sitemap
    const baseUrl = process.env.FRONTEND_URL || 'https://findtherapy.care';
    
    const urls: SitemapUrl[] = [
      // Static pages
      { loc: `${baseUrl}/`, changefreq: 'weekly', priority: '1.0' },
      { loc: `${baseUrl}/providers`, changefreq: 'daily', priority: '0.9' },
      { loc: `${baseUrl}/support-groups`, changefreq: 'daily', priority: '0.8' },
      { loc: `${baseUrl}/blog`, changefreq: 'weekly', priority: '0.7' },
      { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${baseUrl}/privacy`, changefreq: 'monthly', priority: '0.3' },
      
      // City landing pages
      { loc: `${baseUrl}/johannesburg`, changefreq: 'weekly', priority: '0.9' },
      { loc: `${baseUrl}/cape-town`, changefreq: 'weekly', priority: '0.9' },
      { loc: `${baseUrl}/durban`, changefreq: 'weekly', priority: '0.9' },
      { loc: `${baseUrl}/pretoria`, changefreq: 'weekly', priority: '0.9' },
      { loc: `${baseUrl}/port-elizabeth`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${baseUrl}/bloemfontein`, changefreq: 'weekly', priority: '0.8' },
      
      // Dynamic provider pages
      ...providers.map(provider => ({
        loc: `${baseUrl}/providers/${provider._id}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: provider.updatedAt?.toISOString().split('T')[0]
      }))
    ];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error: any) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
};
