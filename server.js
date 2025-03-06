const express = require('express');
const geoip = require('geoip-lite');
const puppeteer = require('puppeteer');

const app = express();

const slugToUrlMapping = {
    'example': 'https://example.com',
    'google': 'https://www.google.com',
};

const fetchMetadata = async (url) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const metadata = await page.evaluate(() => {
            const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
            const image = document.querySelector('meta[property="og:image"]')?.content || null;
            return { title, image };
        });

        await browser.close();
        return metadata;
    } catch (error) {
        console.error('Error fetching metadata using Puppeteer:', error);
        return { title: 'Error fetching title', image: null };
    }
};

app.get('/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;

        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0];
        console.log(ip, "klklklk");

        const geoData = geoip.lookup(ip);

        if (!geoData) {
            return res.status(404).json({ error: 'Geolocation data not found' });
        }

        const url = slugToUrlMapping[slug];

        if (!url) {
            return res.status(404).json({ error: 'URL not found for the slug' });
        }

        const metadata = await fetchMetadata(url);

        res.json({
            ip: ip,
            country: geoData.country || null,
            country_name: geoData.country_name || null,
            city: geoData.city || null,
            latitude: geoData.ll ? geoData.ll[0] : null,
            longitude: geoData.ll ? geoData.ll[1] : null,
            timezone: geoData.timezone || null,
            continent: geoData.continent || null,
            url: url,
            title: metadata.title,
            thumbnail: metadata.image,  // Include the meta image (thumbnail)
        });
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
