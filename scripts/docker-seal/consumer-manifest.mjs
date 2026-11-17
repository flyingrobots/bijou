/** Read only literal dependency data from the canonical scaffold template.
 * Never evaluate or copy application source into networked preparation.
 */
export function templateConsumerManifest(source) {
  const manifest = { name: 'bijou-sealed-tui-consumer', private: true };
  for (const section of ['dependencies', 'devDependencies']) {
    const blocks = [...source.matchAll(new RegExp(`\\b${section}:\\s*\\{([^{}]*)\\}`, 'gu'))];
    if (blocks.length !== 1) throw new Error(`Expected one literal template ${section} block`);
    const entries = {};
    for (const line of blocks[0][1].split('\n').filter((line) => line.trim())) {
      const match = /^\s*(?:'([^']+)'|([A-Za-z_$][\w$]*)):\s*'([^']+)'\s*,?\s*$/u.exec(line);
      if (!match) throw new Error(`Template ${section} contains a nonliteral dependency`);
      const name = match[1] ?? match[2];
      if (Object.hasOwn(entries, name)) throw new Error(`Duplicate template dependency: ${name}`);
      entries[name] = match[3];
    }
    if (!Object.keys(entries).length) throw new Error(`Template ${section} is empty`);
    manifest[section] = entries;
  }
  return manifest;
}
