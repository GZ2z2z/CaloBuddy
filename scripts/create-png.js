import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // A simple PNG generator that fills with color (r,g,b)
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (truecolor RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const chunk = Buffer.alloc(4 + 4 + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4);
    data.copy(chunk, 8);
    const crc = crc32(chunk.subarray(4, 8 + data.length));
    chunk.writeInt32BE(crc, 8 + data.length);
    return chunk;
  }

  // Scanlines: 1 filter byte (0) + width * 3 bytes
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // draw rounded rectangle border or green fill
      const dx = Math.min(x, width - x);
      const dy = Math.min(y, height - y);
      const isCorner = (dx < width * 0.15 && dy < height * 0.15) && (Math.hypot(width * 0.15 - dx, height * 0.15 - dy) > width * 0.15);
      
      if (isCorner) {
        rawData[pxOffset] = 246;
        rawData[pxOffset + 1] = 247;
        rawData[pxOffset + 2] = 249;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

// Generate emerald 16, 185, 129
const p192 = createPNG(192, 192, 16, 185, 129);
const p512 = createPNG(512, 512, 16, 185, 129);

fs.writeFileSync('public/icons/icon-192.png', p192);
fs.writeFileSync('public/icons/icon-512.png', p512);
fs.writeFileSync('public/icons/icon-maskable-512.png', p512);
console.log('Icons generated successfully!');
