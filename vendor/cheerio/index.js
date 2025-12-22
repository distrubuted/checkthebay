function parseImages(html) {
  const matches = [];
  const imgRegex = /<img[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html))) {
    const tag = match[0];
    const attrs = {};
    const attrRegex = /(\w+)=(["'])(.*?)\2/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(tag))) {
      const [, name,, value] = attrMatch;
      attrs[name.toLowerCase()] = value;
    }

    matches.push({ tag, attrs });
  }

  return matches;
}

function createWrapper(elements) {
  return {
    first() {
      return createWrapper(elements.length ? [elements[0]] : []);
    },
    attr(name) {
      if (!elements.length) return undefined;
      return elements[0].attrs?.[name.toLowerCase()];
    },
    get length() {
      return elements.length;
    },
  };
}

function filterImages(images, selector) {
  const normalized = selector.trim().toLowerCase();
  if (normalized === 'img') return images;

  const attrMatch = normalized.match(/^img\[src\*="(.+?)"\]$/i);
  if (attrMatch) {
    const needle = attrMatch[1].toLowerCase();
    return images.filter((img) => (img.attrs.src || '').toLowerCase().includes(needle));
  }

  return [];
}

export function load(html) {
  const images = parseImages(html || '');

  const select = (selector) => {
    const selectors = selector.split(',').map((s) => s.trim()).filter(Boolean);
    const results = selectors.flatMap((sel) => filterImages(images, sel));
    return createWrapper(results);
  };

  return select;
}

export default {
  load,
};
