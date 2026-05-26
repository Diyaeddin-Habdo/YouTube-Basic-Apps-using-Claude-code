// Generates build/icon.png — a 512x512 brand icon for electron-builder to
// transcode into the platform-specific .ico/.icns. Uses only Node stdlib
// (no Sharp/Canvas), so this works on any clean machine.

const fs = require('node:fs');
const zlib = require('node:zlib');
const path = require('node:path');

const SIZE = 512;

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const stride = SIZE * 4 + 1; // 1 filter byte per scanline
const pixels = Buffer.alloc(stride * SIZE);

const cx = SIZE / 2, cy = SIZE / 2;
const R = SIZE * 0.46; // outer disc radius
const innerR = SIZE * 0.08; // hollow center for the disc

// Simple music-note glyph laid on top: stem + head
// Head: ellipse centered at (cx-30, cy+90)
const noteHeadCX = cx - SIZE * 0.06;
const noteHeadCY = cy + SIZE * 0.18;
const noteHeadRX = SIZE * 0.085;
const noteHeadRY = SIZE * 0.065;
// Stem: vertical bar
const stemX0 = noteHeadCX + noteHeadRX - SIZE * 0.012;
const stemX1 = noteHeadCX + noteHeadRX + SIZE * 0.012;
const stemY0 = cy - SIZE * 0.22;
const stemY1 = noteHeadCY;
// Flag at top of stem
const flagX0 = stemX1;
const flagX1 = stemX1 + SIZE * 0.13;
const flagY0 = stemY0;
const flagY1 = stemY0 + SIZE * 0.18;

for (let y = 0; y < SIZE; y++) {
  pixels[y * stride] = 0; // PNG filter type: none
  for (let x = 0; x < SIZE; x++) {
    const i = y * stride + 1 + x * 4;
    const dx = x - cx, dy = y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Background (transparent)
    let r = 0, g = 0, b = 0, a = 0;

    if (d <= R) {
      // Disc body — gradient from light lilac to deep purple, slightly diagonal
      const t = (d / R) * 0.7 + ((x + y) / (2 * SIZE)) * 0.3;
      const tt = smoothstep(0, 1, t);
      r = Math.round(189 + (94 - 189) * tt);
      g = Math.round(170 + (66 - 170) * tt);
      b = Math.round(255 + (220 - 255) * tt);
      a = 255;

      // Music note (white glyph on top)
      const ehx = (x - noteHeadCX) / noteHeadRX;
      const ehy = (y - noteHeadCY) / noteHeadRY;
      const onHead = (ehx * ehx + ehy * ehy) <= 1;
      const onStem = (x >= stemX0 && x <= stemX1 && y >= stemY0 && y <= stemY1);
      // Triangular flag: width increases as you go down
      const flagWidthAtY = (y - flagY0) / (flagY1 - flagY0);
      const onFlag = (
        y >= flagY0 && y <= flagY1 &&
        x >= flagX0 &&
        x <= flagX0 + (flagX1 - flagX0) * Math.max(0, Math.min(1, flagWidthAtY))
      );

      if (onHead || onStem || onFlag) {
        r = 250; g = 250; b = 255; a = 255;
      }
    }

    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = a;
  }
}

const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 6;   // color type RGBA
ihdr[10] = 0;  // compression
ihdr[11] = 0;  // filter
ihdr[12] = 0;  // interlace

const idat = zlib.deflateSync(pixels, { level: 9 });
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.join(__dirname, 'icon.png');
fs.writeFileSync(outPath, png);
console.log(`Wrote ${outPath} (${SIZE}x${SIZE}, ${png.length} bytes)`);
