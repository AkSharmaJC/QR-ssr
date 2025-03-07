const express = require('express');
const geoip = require('geoip-lite');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer'); // Import Puppeteer
const app = express();

const slugToUrlMapping = {
    'example': 'https://example.com',
    'google': 'https://beta.moddedgames.com/',
};

const fetchMetadata = async (url) => {
    try {
        // Launch Puppeteer with --no-sandbox flag
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Add these args
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract metadata from the page
        const metadata = await page.evaluate(() => {
            const title = document.querySelector('meta[property="og:title"]')?.content || document.title || 'No title found';
            const image = document.querySelector('meta[property="og:image"]')?.content || 'No image found';
            return { title, image };
        });

        await browser.close();
        return metadata;
    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        return { title: 'Error fetching title', image: null };
    }
};

app.get('/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;

        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0];
        const geoData = geoip.lookup(ip);

        if (!geoData) {
            return res.status(404).json({ error: 'Geolocation data not found' });
        }

        const url = slugToUrlMapping[slug];

        if (!url) {
            return res.status(404).json({ error: 'URL not found for the slug' });
        }

        // Fetch metadata for the URL using Puppeteer
        const metadata = await fetchMetadata(url);

        // Serve HTML with meta tags for Open Graph and Twitter Cards
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${metadata.title}</title>

                <!-- Open Graph Meta Tags -->
                <meta property="og:title" content="${metadata.title}">
                <meta property="og:image" content="${metadata.image}">
                <meta property="og:url" content="${url}">
                <meta property="og:type" content="website">

                <!-- Twitter Card Meta Tags -->
                <meta name="twitter:title" content="${metadata.title}">
                <meta name="twitter:image" content="${metadata.image}">
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:site" content="@yourtwitterhandle">

                <!-- Additional meta tags for better SEO -->
                <meta name="description" content="Description of the page">
            </head>
            <body>
                <h1>${metadata.title}</h1>
                <img src="${metadata.image}" alt="Thumbnail Image" style="width: 100%; max-width: 500px;">
                <p>Visit the website: <a href="${url}">${url}</a></p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error fetching geolocation data:', error);
        res.status(500).json({ error: 'Failed to load geolocation data' });
    }
});

// Start the server
const port = 6008;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
