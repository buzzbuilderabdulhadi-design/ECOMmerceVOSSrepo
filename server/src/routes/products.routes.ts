import { Router } from 'express';
import { searchLimiter, catalogListLimiter } from '../middleware/rateLimit.middleware';
import { getProducts, getProduct, getFeaturedProducts, getNewArrivals, getBestSellers, getRelatedProducts, searchProducts } from '../controllers/products.controller';

const router = Router();

// Search is the most expensive catalog query — it runs a `contains` scan on
// the product name index with no server-side pagination beyond take:10.
router.get('/search', searchLimiter, searchProducts);

// Listing/detail reads are cache-backed (15-20 s TTL); 60/min is far above
// any human browsing pace but blocks small-scale scraping floods.
router.use(catalogListLimiter);

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/:slug/related', getRelatedProducts);
router.get('/:slug', getProduct);

export default router;