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
      `yt-dlp "ytsearch10:${q}" --flat-playlist --dump-json --no-warnings --ignore-no-formats-error ${cookieFlag()}`,
      { shell: true, maxBuffer: 1024 * 1024 }
    );

    const results = stdout.trim().split('\n').filter(Boolean).map(JSON.parse);
    res.json(results.map(r => ({
      title: r.title || 'Unknown',
      artist: r.uploader || r.channel || 'Unknown Artist',
      videoId: r.id,
      thumbnail: r.thumbnail || `https://i.ytimg.com/vi/${r.id}/mqdefault.jpg`
    })));
  } catch (e) {
    console.error('Search error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/stream/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://youtube.com/watch?v=${id}`;
    const cook = cookieFlag();

    const [metaResult, urlResult] = await Promise.allSettled([
      execAsync(`yt-dlp "${url}" --print title --print uploader --print thumbnail --no-warnings --no-playlist ${cook}`, { shell: true }),
      execAsync(`yt-dlp "${url}" --get-url --extractor-args "youtube:player_client=android" --no-warnings --no-playlist --ignore-no-formats-error ${cook}`, { shell: true })
    ]);

    const metaLines = metaResult.status === 'fulfilled' ? metaResult.value.stdout.trim().split('\n').filter(Boolean) : [];
    const streamUrl = urlResult.status === 'fulfilled' ? urlResult.value.stdout.trim() : null;

    if (!streamUrl) return res.status(404).json({ error: 'No audio stream found' });

    res.json({
      title: metaLines[0] || 'Unknown',
      artist: metaLines[1] || 'Unknown Artist',
      thumbnail: metaLines[2] || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      url: streamUrl
    });
  } catch (e) {
    console.error('Stream error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`nimiq backend running on ${port}`));
