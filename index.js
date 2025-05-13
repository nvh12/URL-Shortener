const express = require('express');
const { createClient } = require('redis');
const { nanoid } = require('nanoid');
const path = require('path');
require('dotenv').config();

const URL = process.env.SERVER_URL;

const app = express();
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const redisClient = createClient({
    url: process.env.REDIS_URL
});
redisClient.connect().catch(console.error);

app.get('/', (req, res) => {
    res.render('index', { baseURL: process.env.SERVER_URL });
})

app.post('/shorten', async (req, res) => {
    try {
        const { originalURL } = req.body;
        if (!originalURL) {
            return res.status(400).json({ error: 'Missing original URL' });
        }
        const shortCode = nanoid(7);
        await redisClient.set(shortCode, originalURL);
        res.status(200).json({
            shortURL: `${URL}/${shortCode}`,
            code: shortCode,
            originalURL
        });
    } catch (error) {
        res.status(500).json({ error: error});
    }
});

app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    const originalURL = await redisClient.get(shortCode);
    if (!originalURL) {
        return res.status(404).send('URL not found');
    }
    res.redirect(originalURL);
});

app.listen(5000, () => {
    console.log(`Running on http://localhost:5000`);
});