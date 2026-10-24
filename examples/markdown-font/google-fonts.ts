/** Boundary adapter for the public Google Fonts catalog and CSS API. */
export async function download(url: URL, limit: number): Promise<Uint8Array> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'bijou-markdown-font-demo' },
    signal: AbortSignal.timeout(15_000), redirect: 'error',
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Google Fonts request failed (${String(response.status)}). Use --offline or --font to load locally.`);
  }
  if (response.body === null) throw new Error('Google Fonts returned an empty response.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error('Google Fonts response exceeds the download limit.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export function parseGoogleCatalog(value: unknown): string[] {
  if (typeof value !== 'object' || value === null || !('familyMetadataList' in value)
    || !Array.isArray(value.familyMetadataList) || value.familyMetadataList.length > 10_000) {
    throw new Error('Invalid Google Fonts catalog.');
  }
  const families: string[] = [];
  for (const raw of value.familyMetadataList) {
    const entry: unknown = raw;
    if (typeof entry !== 'object' || entry === null || !('family' in entry)
      || typeof entry.family !== 'string' || entry.family.length === 0 || entry.family.length > 200
      || hasControlCharacters(entry.family)) throw new Error('Invalid Google Fonts family.');
    families.push(entry.family);
  }
  if (families.length === 0) throw new Error('Google Fonts catalog is empty.');
  return [...new Set(families)].sort((a, b) => a.localeCompare(b));
}

export async function googleFamilies(): Promise<string[]> {
  const bytes = await download(new URL('https://fonts.google.com/metadata/fonts'), 8_388_608);
  const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
  return parseGoogleCatalog(value);
}

export function googleFontUrl(css: string): URL {
  const matches = [...css.matchAll(/src:\s*url\((https:\/\/[^)]+)\)\s*format\(['"]truetype['"]\)/gu)];
  const urls = [...new Set(matches.map((match) => match[1]))];
  if (urls.length !== 1 || urls[0] === undefined) throw new Error('This family does not provide one TrueType file. Use a local TTF/OTF with --font.');
  const url = new URL(urls[0]);
  if (url.hostname !== 'fonts.gstatic.com' || url.protocol !== 'https:' || url.username !== '' || url.password !== '') {
    throw new Error('Unexpected Google Fonts download URL.');
  }
  return url;
}

export async function googleFont(family: string): Promise<Uint8Array> {
  if (family.trim() === '' || family.length > 200 || hasControlCharacters(family)) throw new Error('Invalid font family.');
  const url = new URL('https://fonts.googleapis.com/css2');
  url.searchParams.set('family', family);
  const css = new TextDecoder().decode(await download(url, 65_536));
  return download(googleFontUrl(css), 8_388_608);
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code < 32 || (code >= 127 && code <= 159);
  });
}
