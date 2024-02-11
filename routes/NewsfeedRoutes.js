const express = require("express");
const router = express.Router();
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('78c0af376dc64ae28cd50b4e3b0ee2c6');

router.get('/', async (req, res) => {
  try {
    const response = await newsapi.v2.everything({
      q: 'healthy recipe',
      pageSize: 20,
    });

    if (response.status === 'ok') {
      const articles = response.articles;
      res.json(articles);
    } else {
      console.error('Error fetching news:', response.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {
    console.error('Error fetching news data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
