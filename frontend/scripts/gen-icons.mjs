// Generates simple solid-color placeholder PWA icons (no design tooling needed).
// Replace with real branded icons before launch.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function crc32(buf) {
  let c;
  const table = crc32.table ??= (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function solidPng(size, [r, g, b], padding = 0) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const rowLen = size * 3;
  const raw = Buffer.alloc((rowLen + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowLen + 1);
    raw[rowStart] = 0; // filter: none
    const inPad = padding && (y < padding || y >= size - padding);
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 3;
      const inPadX = padding && (x < padding || x >= size - padding);
      const isBg = padding > 0; // maskable: white background, colored center
      if (isBg && (inPad || inPadX)) {
        raw[px] = 255; raw[px + 1] = 255; raw[px + 2] = 255;
      } else {
        raw[px] = r; raw[px + 1] = g; raw[px + 2] = b;
      }
    }
  }
  const idat = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
const brand = [0x0f, 0x6e, 0x5c];
writeFileSync('public/icons/icon-192.png', solidPng(192, brand));
writeFileSync('public/icons/icon-512.png', solidPng(512, brand));
writeFileSync('public/icons/icon-512-maskable.png', solidPng(512, brand, 64));
console.log('placeholder icons written to public/icons');
