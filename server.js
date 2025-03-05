const express = require('express');
const geoip = require('geoip-lite');
const path = require('path');
const app = express();

app.get('/api/geoip', (req, res) => {
    try {
        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0];
        console.log(ip, "klklklk");

        const geoData = geoip.lookup(ip);

        if (!geoData) {
            return res.status(404).json({ error: 'Geolocation data not found' });
        }

        res.json({
            ip: ip,
            country: geoData.country || null,
            country_name: geoData.country_name || null,
            city: geoData.city || null,
            latitude: geoData.ll ? geoData.ll[0] : null,
            longitude: geoData.ll ? geoData.ll[1] : null,
            timezone: geoData.timezone || null,
            continent: geoData.continent || null
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
