const express = require('express');
const geoip = require('geoip-lite');
const axios = require('axios'); // For making API requests
const app = express();

const slugToUrlMapping = {
    'example': 'https://example.com',
    'google': 'https://www.google.com',
};

const fetchThumbnail = async (url) => {
    try {

        // const screenshotApiUrl = `https://api.screenshotapi.net/screenshot`;
        // const response = await axios.get(screenshotApiUrl, {
        //     params: {
        //         token: 'YOUR_API_TOKEN',
        //         url: url,
        //         width: 600,
        //         height: 400,
        //     }
        // });
        return url
    } catch (error) {
        console.error('Error fetching thumbnail:', error);
        return null;
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

        const thumbnail = await fetchThumbnail(url);

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
            thumbnail: thumbnail,  // Include the thumbnail URL
        });
    } catch (error) {
        console.error('Error fetching geolocation data:', error);
        res.status(500).json({ error: 'Failed to load geolocation data' });
    }
});

const port = 6008;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
