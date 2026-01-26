import express from 'express';
import Listing from '../models/listing.model.js';
import Blog from '../models/blog.model.js';

const router = express.Router();

router.get('/sitemap.xml', async (req, res, next) => {
    try {
        // Determine the base URL based on the request host or query param
        // Frontend domains: https://urbansetu.vercel.app and https://urbansetuglobal.onrender.com
        const host = req.headers['x-forwarded-host'] || req.headers.host || '';
        const requestedDomain = req.query.domain;
        let currentBaseUrl = 'https://urbansetu.vercel.app';

        if (host.includes('urbansetuglobal.onrender.com') || requestedDomain === 'global') {
            currentBaseUrl = 'https://urbansetuglobal.onrender.com';
        }

        // Fetch published listings
        const listings = await Listing.find().select('_id updatedAt');

        // Fetch published blogs/guides
        const blogs = await Blog.find({ published: true }).select('slug _id type updatedAt');

        // Static routes
        const staticRoutes = [
            '',
            '/about',
            '/blogs',
            '/guides',
            '/market-trends',
            '/help-center',
            '/community',
            '/community-guidelines',
            '/download',
            '/faqs',
            '/search',
            '/contact',
            '/sign-in',
            '/sign-up',
            '/forgot-password',
            '/updates',
            '/ai',
            '/terms',
            '/privacy',
            '/cookie-policy'
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Add static routes
        staticRoutes.forEach(route => {
            const priority = route === '' ? '1.0' : '0.5';
            const changefreq = route === '' ? 'daily' : 'monthly';
            xml += `
  <url>
    <loc>${currentBaseUrl}${route}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
        });

        // Add listings
        listings.forEach(listing => {
            xml += `
  <url>
    <loc>${currentBaseUrl}/listing/${listing._id}</loc>
    <lastmod>${listing.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        // Add blogs/guides
        blogs.forEach(blog => {
            const blogSlug = blog.slug || blog._id;
            const routePrefix = blog.type === 'guide' ? '/blog' : '/blog'; // Note: PublicBlogs.jsx uses /blog/:slug for both
            xml += `
  <url>
    <loc>${currentBaseUrl}${routePrefix}/${blogSlug}</loc>
    <lastmod>${blog.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        xml += '\n</urlset>';

        res.header('Content-Type', 'application/xml');
        res.status(200).send(xml);
    } catch (error) {
        next(error);
    }
});

export default router;
