const express = require('express');
const geoip = require('geoip-lite');
const { getMetadata } = require('url-metadata'); 
const app = express();

let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

const slugToUrlMapping = {
    'example': 'https://example.com',
    'google': 'https://www.google.com',
};

const fetchMetadata = async (url) => {
    try {
        // Fetch metadata using url-metadata
        const metadata = await getMetadata(url);

        // Extract title and image from metadata
        const title = metadata.ogTitle || metadata.title || 'No title found';
        const image = metadata.ogImage || metadata.twitterImage || 'No image found';

        return {
            title,
            image
        };
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return {
            title: 'Error fetching title',
            image: null
        };
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
            title: metadata.title,  // Include the meta title
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
