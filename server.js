const express = require('express');
const geoip = require('geoip-lite');
const axios = require('axios'); 
const cheerio = require('cheerio');
const app = express();

const slugToUrlMapping = {
    'example': 'https://example.com',
    'google': 'https://www.google.com',
};

// Function to fetch metadata from a URL (title and image)
const fetchMetadata = async (url) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Extract meta title
        const title = $('meta[property="og:title"]').attr('content') || $('title').text();

        // Extract meta image
        const image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');

        return {
            title: title || 'No title found',
            image: image || 'No image found'
        };
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return {
            title: 'Error fetching title',
            image: null
        };
    }
};

// Route to handle requests for each slug
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
