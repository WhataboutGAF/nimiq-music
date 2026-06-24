import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, existsSync } from 'fs';
import express from 'express';
import cors from 'cors';

const execAsync = promisify(exec);
const app = express();
app.use(cors());

const COOKIE_PATH = '/tmp/yt-cookies.txt';
if (process.env.YOUTUBE_COOKIES && !existsSync(COOKIE_PATH)) {
  try {
    writeFileSync(COOKIE_PATH, process.env.YOUTUBE_COOKIES);
  } catch (e) {
    console.error('Failed to write cookies file:', e.message);
  }
}

function cookieFlag() {
  return existsSync(COOKIE_PATH) ? `--cookies "${COOKIE_PATH}"` : '';
}

app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query' });

    const { stdout } = await execAsync(
      `yt-dlp "ytsearch5:${q}" --flat-playlist --dump-json --no-warnings ${cookieFlag()}`,
      { shell: true, maxBuffer: 1024 * 1024 }
    );

    const results = stdout.trim().split('\n').filter(Boolean).map(JSON.parse);
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
    const { stdout } = await execAsync(
      `yt-dlp "https://youtube.com/watch?v=${id}" -f "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best" --print title --print uploader --print thumbnail --print url --no-warnings ${cookieFlag()}`,
      { shell: true }
    );

    const lines = stdout.trim().split('\n').filter(Boolean);
    if (lines.length < 4) return res.status(404).json({ error: 'No audio stream found' });

    res.json({ title: lines[0], artist: lines[1], thumbnail: lines[2], url: lines[3] });
  } catch (e) {
    console.error('Stream error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`nimiq backend running on ${port}`));
