import cheerio from 'cheerio';
import { textOrNull } from '../utils/parsing.js';

const RADAR_PAGE = 'https://radar.weather.gov/ridge/standard/standard.php?rid=MOB';

async function fetchRadarImageUrl() {
  const response = await fetch(RADAR_PAGE, {
    headers: { 'User-Agent': 'DidYouCheckTheBay/1.0 (+https://github.com/distributed/didyoucheckthebay)' },
  });

  if (!response.ok) {
    throw new Error(`Radar page responded with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const gifSrc =
    $('img[src*="KMOB"], img[src*="mob"], img[src*="MOB"]').first().attr('src') ||
    $('img[src*=".gif"]').first().attr('src');

  if (!gifSrc) {
    throw new Error('Could not find radar image on page');
  }

  const imageUrl = new URL(gifSrc, RADAR_PAGE).toString();
  return imageUrl;
}

async function fetchLastModified(url) {
  const response = await fetch(url, {
    method: 'HEAD',
    headers: { 'User-Agent': 'DidYouCheckTheBay/1.0 (+https://github.com/distributed/didyoucheckthebay)' },
  });

  if (!response.ok) return null;
  const lastModified = textOrNull(response.headers.get('last-modified'));
  return lastModified ? new Date(lastModified).toISOString() : new Date().toISOString();
}

export async function scrapeRadar() {
  const errors = [];
  let imageUrl = null;
  let updatedAt = null;

  try {
    imageUrl = await fetchRadarImageUrl();
    updatedAt = await fetchLastModified(imageUrl);
  } catch (error) {
    errors.push(`Radar scrape failed: ${error.message}`);
  }

  return {
    radar: {
      imageUrl,
      updatedAt,
    },
    errors,
  };
}
