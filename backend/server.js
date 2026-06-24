import { execa } from 'yt-dlp-exec';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query' });

    const output = await execa('yt-dlp', [
      'ytsearch5:' + q,
      '--dump-json',
      '--no-warnings'
    ], { shell: true });

    const results = output.stdout.trim().split('\n').filter(Boolean).map(JSON.parse);
    res.json(results.map(r => ({
      title: r.title,
      artist: r.uploader,
      videoId: r.id,
      thumbnail: r.thumbnail
    })));
  } catch (e) {
    console.error('Search error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/stream/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const output = await execa('yt-dlp', [
      `https://youtube.com/watch?v=${id}`,
      '-f', 'bestaudio[ext=m4a]',
      '--get-url',
      '--no-warnings'
    ], { shell: true });

    const url = output.stdout.trim();
    if (!url) return res.status(404).json({ error: 'No audio stream found' });

    res.json({ url });
  } catch (e) {
    console.error('Stream error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`nimiq backend running on ${port}`));
