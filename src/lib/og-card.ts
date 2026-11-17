import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { site } from '../data/site';

// The link-preview image LinkedIn, Slack and others show for one note or project:
// 1200 x 630, drawn in the same style as the site-wide image (scripts/make-og.mjs).

export interface Card {
  /** Small line above the title, e.g. "Field note No. 03" or "Project". */
  kicker: string;
  /** Topic, shown as a chip. */
  chip?: string;
  /** e.g. "7 min read". */
  meta?: string;
  title: string;
}

const WIDTH = 1200;
const HEIGHT = 630;
const color = { paper: '#f1eee7', ink: '#232323', grey: '#5b5a56', ghost: '#dedede', line: '#9a978f', accent: '#ff9100' };

// Read from node_modules through the working directory: the bundled build has no stable
// path of its own, and Astro always runs from the project root.
const font = (pkg: string, file: string) => readFileSync(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file));
let fonts: { name: string; data: Buffer; weight: 400 | 500; style: 'normal' }[] | undefined;
const loadFonts = () => (fonts ??= [
  { name: 'Geist', data: font('geist-sans', 'geist-sans-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Geist', data: font('geist-sans', 'geist-sans-latin-500-normal.woff'), weight: 500, style: 'normal' },
  { name: 'Geist Mono', data: font('geist-mono', 'geist-mono-latin-400-normal.woff'), weight: 400, style: 'normal' },
]);

type Node = { type: string; props: { style: Record<string, string | number>; children?: unknown } };
// Satori lays out with flexbox only, and every element with more than one child must say so.
const box = (style: Record<string, string | number>, ...children: (Node | string)[]): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});
const mono = { fontFamily: 'Geist Mono', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase' };
const rule = (style: Record<string, string | number> = {}) => box({ borderTop: `2px dashed ${color.line}`, ...style });

/** Longer titles get smaller type, so every title fits in three or four lines. */
export function titleSize(title: string): number {
  if (title.length <= 34) return 84;
  if (title.length <= 60) return 68;
  if (title.length <= 90) return 56;
  return 48;
}

function layout({ kicker, chip, meta, title }: Card): Node {
  const marginX = 72;
  const marginY = 56;

  return box(
    { width: WIDTH, height: HEIGHT, backgroundColor: color.paper },
    box(
      { flexDirection: 'column', width: WIDTH - 2 * marginX, height: HEIGHT - 2 * marginY, margin: `${marginY}px ${marginX}px`, color: color.ink, fontFamily: 'Geist' },
      box(
        { alignItems: 'center', gap: 18, color: color.grey, ...mono },
        box({
          width: 44,
          height: 44,
          borderRadius: 6,
          backgroundColor: color.ink,
          backgroundImage: `repeating-linear-gradient(135deg, ${color.paper} 0px, ${color.paper} 2px, transparent 2px, transparent 6px)`,
        }),
        box({}, `${site.name} · ${site.role}`),
      ),
      rule({ marginTop: 28 }),
      box(
        { flexDirection: 'column', flexGrow: 1, justifyContent: 'center' },
        box(
          { alignItems: 'center', gap: 16, color: color.grey, ...mono },
          box({}, kicker),
          ...(chip ? [box({ padding: '4px 12px', borderRadius: 6, backgroundColor: color.ghost, color: color.ink }, chip)] : []),
          ...(meta ? [box({}, meta)] : []),
        ),
        box({ marginTop: 26, fontSize: titleSize(title), fontWeight: 500, lineHeight: 1.08, letterSpacing: '-0.02em', textWrap: 'balance' }, title),
      ),
      rule(),
      box(
        { alignItems: 'center', justifyContent: 'space-between', marginTop: 26, ...mono },
        box({ alignItems: 'center', gap: 12 }, box({ width: 12, height: 12, borderRadius: 6, backgroundColor: color.accent }), box({}, new URL(site.url).host)),
        box({ color: color.grey }, 'Thank you for reading'),
      ),
    ),
  );
}

export async function renderCard(card: Card): Promise<Uint8Array<ArrayBuffer>> {
  // Satori takes React-style elements; plain objects of the same shape work without React.
  const svg = await satori(layout(card) as unknown as Parameters<typeof satori>[0], { width: WIDTH, height: HEIGHT, fonts: loadFonts() });
  // Copied into a plain array, which is what a Response body accepts.
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng());
}
