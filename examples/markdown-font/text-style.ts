/** One element's font choice and requested ink height in pixels. */
export class TextStyle {
  public readonly font: string;
  public readonly size: number;

  public constructor(font: string, size: number) {
    const value = font.trim();
    if (value.length === 0 || value.length > 1024 || Array.from(value).some((c) => (c.codePointAt(0) ?? 0) < 32)) {
      throw new Error('Expected a font family, file path, or terminal.');
    }
    if (!Number.isInteger(size) || size < 4 || size > 256) throw new Error('Font size must be an integer from 4 to 256 pixels.');
    this.font = value === 'terminal' || value === 'default' || value.startsWith('google:') || value.startsWith('file:')
      ? value : /\.(?:ttf|otf)$/iu.test(value) ? `file:${value}` : `google:${value}`;
    if ((this.font.startsWith('google:') || this.font.startsWith('file:')) && this.font.split(':').slice(1).join(':').trim() === '') {
      throw new Error('Expected a font family or file path after the prefix.');
    }
    this.size = size;
    Object.freeze(this);
  }
}
