const express = require('express');
const shortid = require('shortid');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 6008;

const urlDatabase = {};

app.use(express.json());

app.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ message: 'Original URL is required.' });
  }

  // Generate a short URL ID
  const shortUrlId = shortid.generate();
  const shortUrl = `http://195.35.8.196:6008/${PORT}/${shortUrlId}`;

  // Store original URL in the database (in-memory in this case)
  urlDatabase[shortUrlId] = originalUrl;

  // Fetch preview info of the original URL
  try {
    const preview = await getPreview(originalUrl);
    res.status(201).json({ shortUrl, preview });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching URL preview.' });
  }
});

// Route to redirect to the original URL
app.get('/:shortUrlId', (req, res) => {
  const { shortUrlId } = req.params;

  // Lookup the original URL
  const originalUrl = urlDatabase[shortUrlId];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.status(404).send('Short URL not found.');
  }
});

// Helper function to fetch metadata (preview) of the URL
async function getPreview(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const title = $('head title').text();
    const description = $('meta[name="description"]').attr('content');
    const image = $('meta[property="og:image"]').attr('content');

    return { title, description, image };
  } catch (error) {
    throw new Error('Error fetching URL preview');
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
