import express from 'express';
import { SA_PROVINCES, SA_CITIES, searchSACities } from '@findlocal/shared';

const router = express.Router();

// GET /api/cities/provinces
router.get('/provinces', (_req, res) => {
  res.json({ provinces: SA_PROVINCES });
});

// GET /api/cities/search?q=stel
router.get('/search', (req, res) => {
  const query = (req.query.q as string) ?? '';

  if (query.length < 2) {
    return res.json({ results: [] });
  }

  const results = searchSACities(query, 10);
  res.json({ results });
});

// GET /api/cities/:citySlug
router.get('/:citySlug', (req, res) => {
  const city = SA_CITIES.find(c => c.slug === req.params.citySlug);

  if (!city) {
    return res.status(404).json({ error: 'City not found' });
  }

  const province = SA_PROVINCES.find(p => p.slug === city.province);

  res.json({
    ...city,
    provinceDisplay: province?.name,
    fullName: `${city.displayName ?? city.name}, ${province?.name}`,
  });
});

export default router;
