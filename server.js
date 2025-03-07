const express = require('express');
const geoip = require('geoip-lite');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

const slugToUrlMapping = {
    'example': 'https://example.com',
    'google': 'https://www.google.com',
};

const fetchMetadata = async (url) => {
    try {
        const data = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': 'https://www.google.com',
                'Upgrade-Insecure-Requests': '1',
            },
        });

        console.log(data,"--------------------")

        if (data.status === 429) {
            console.error('Rate limit exceeded. Please try again later.');
            return { title: 'Error fetching title', image: null };
        }

        // Extract metadata from the response
        const $ = cheerio.load(data);
        const title = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || $('title').text() || 'No title found';
        const image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || 'No image found';

        return { title, image };
    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        return { title: 'Error fetching title', image: null };
    }
};


app.get('/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;

        console.log(slug, "Slug received");

        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0];
        console.log(ip, "IP Address");

        const geoData = geoip.lookup(ip);

        if (!geoData) {
            return res.status(404).json({ error: 'Geolocation data not found' });
        }

        const url = slugToUrlMapping[slug];

        if (!url) {
            return res.status(404).json({ error: 'URL not found for the slug' });
        }

        const metadata = await fetchMetadata(url);

        console.log(metadata, "Metadata");

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
