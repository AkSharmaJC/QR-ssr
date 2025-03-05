const express = require('express');
const maxmind = require('maxmind');
const path = require('path');
const app = express();

const geoip2DatabasePath = path.join(__dirname, 'GeoIP2-City.mmdb');

app.get('/api/geoip', async (req, res) => {
    try {
        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',')[0];
        console.log(ip,"klklklk")
        const geoip2Reader = await maxmind.open(geoip2DatabasePath);
        const geoData = geoip2Reader.get(ip);

        if (!geoData) {
            return res.status(404).json({ error: 'Geolocation data not found' });
        }

        res.json({
            ip: ip,
            country: geoData.country || null,
            country_name: geoData.country ? geoData.country.names.en : null,
            country_iso_code: geoData.country ? geoData.country.iso_code : null,
            city: geoData.city || null,
            city_name: geoData.city ? geoData.city.names.en : null,
            city_geoname_id: geoData.city ? geoData.city.geoname_id : null,
            latitude: geoData.location ? geoData.location.latitude : null,
            longitude: geoData.location ? geoData.location.longitude : null,
            timezone: geoData.location ? geoData.location.time_zone : null,
            continent: geoData.continent || null,
            continent_name: geoData.continent ? geoData.continent.names.en : null,
            continent_code: geoData.continent ? geoData.continent.code : null,
            location: geoData.location || null,
            registered_country: geoData.registered_country || null,
            represented_country: geoData.represented_country || null,
            postal: geoData.postal || null,
            subdivisions: geoData.subdivisions || null
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
