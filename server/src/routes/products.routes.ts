import { Router } from 'express';
import { getProducts, getProduct, getFeaturedProducts, getNewArrivals, getBestSellers, getRelatedProducts, searchProducts } from '../controllers/products.controller';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/search', searchProducts);
router.get('/:slug/related', getRelatedProducts);
router.get('/:slug', getProduct);

export default router;
