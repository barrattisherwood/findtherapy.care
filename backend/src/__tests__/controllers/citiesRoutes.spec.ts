import express from 'express';
import request from 'supertest';
import citiesRouter from '../../routes/citiesRoutes';

const app = express();
app.use(express.json());
app.use('/api/cities', citiesRouter);

describe('GET /api/cities/provinces', () => {
  it('returns all 9 SA provinces', async () => {
    const res = await request(app).get('/api/cities/provinces');

    expect(res.status).toBe(200);
    expect(res.body.provinces).toHaveLength(9);
    expect(res.body.provinces.map((p: any) => p.slug)).toContain('western-cape');
    expect(res.body.provinces.map((p: any) => p.slug)).toContain('gauteng');
  });

  it('returns provinces with slug and name', async () => {
    const res = await request(app).get('/api/cities/provinces');

    const gauteng = res.body.provinces.find((p: any) => p.slug === 'gauteng');
    expect(gauteng).toEqual({ slug: 'gauteng', name: 'Gauteng' });
  });
});

describe('GET /api/cities/search', () => {
  it('returns empty results for query shorter than 2 chars', async () => {
    const res = await request(app).get('/api/cities/search?q=s');

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(0);
  });

  it('returns empty results for missing query', async () => {
    const res = await request(app).get('/api/cities/search');

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(0);
  });

  it('finds Stellenbosch by partial name "stel"', async () => {
    const res = await request(app).get('/api/cities/search?q=stel');

    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    const stellenbosch = res.body.results.find((c: any) => c.slug === 'stellenbosch');
    expect(stellenbosch).toBeDefined();
    expect(stellenbosch.provinceDisplay).toBe('Western Cape');
  });

  it('finds Mbombela by alias "nelspruit"', async () => {
    const res = await request(app).get('/api/cities/search?q=nelspruit');

    expect(res.status).toBe(200);
    const mbombela = res.body.results.find((c: any) => c.slug === 'mbombela');
    expect(mbombela).toBeDefined();
    expect(mbombela.displayName).toContain('Nelspruit');
  });

  it('finds Johannesburg by alias "jhb"', async () => {
    const res = await request(app).get('/api/cities/search?q=jhb');

    expect(res.status).toBe(200);
    const jhb = res.body.results.find((c: any) => c.slug === 'johannesburg');
    expect(jhb).toBeDefined();
  });

  it('finds Gqeberha by alias "port elizabeth"', async () => {
    const res = await request(app).get('/api/cities/search?q=port+elizabeth');

    expect(res.status).toBe(200);
    const city = res.body.results.find((c: any) => c.slug === 'gqeberha');
    expect(city).toBeDefined();
  });

  it('returns at most 10 results', async () => {
    const res = await request(app).get('/api/cities/search?q=a');

    expect(res.body.results.length).toBeLessThanOrEqual(10);
  });

  it('includes provinceDisplay and fullName in results', async () => {
    const res = await request(app).get('/api/cities/search?q=cape+town');

    const capeTown = res.body.results.find((c: any) => c.slug === 'cape-town');
    expect(capeTown.provinceDisplay).toBe('Western Cape');
    expect(capeTown.fullName).toContain('Western Cape');
  });
});

describe('GET /api/cities/:citySlug', () => {
  it('returns city by slug', async () => {
    const res = await request(app).get('/api/cities/durban');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('durban');
    expect(res.body.provinceDisplay).toBe('KwaZulu-Natal');
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/cities/atlantis');

    expect(res.status).toBe(404);
  });
});
