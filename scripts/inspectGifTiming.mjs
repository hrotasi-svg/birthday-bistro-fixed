import fs from 'node:fs'

const sourcePath = process.argv[2]
if (!sourcePath) {
  throw new Error('Usage: node scripts/inspectGifTiming.mjs <gif-path>')
}

const data = fs.readFileSync(sourcePath)
if (data.subarray(0, 6).toString('ascii') !== 'GIF89a' && data.subarray(0, 6).toString('ascii') !== 'GIF87a') {
  throw new Error('Not a GIF file')
}

let offset = 13
if (data[10] & 0x80) {
  offset += 3 * (1 << ((data[10] & 0x07) + 1))
}

let pendingDelay = 10
let frames = 0
let totalDelayCentiseconds = 0
const delays = []

function skipSubBlocks(start) {
  let cursor = start
  while (cursor < data.length) {
    const length = data[cursor]
    cursor += 1
    if (length === 0) return cursor
    cursor += length
  }
  throw new Error('Unexpected end of GIF sub-blocks')
}

while (offset < data.length) {
  const block = data[offset]
  if (block === 0x3b) break
  if (block === 0x21) {
    const label = data[offset + 1]
    if (label === 0xf9 && data[offset + 2] === 4) {
      pendingDelay = data[offset + 4] | (data[offset + 5] << 8)
      offset += 8
    } else {
      offset = skipSubBlocks(offset + 2)
    }
    continue
  }
  if (block === 0x2c) {
    const packed = data[offset + 9]
    offset += 10
    if (packed & 0x80) {
      offset += 3 * (1 << ((packed & 0x07) + 1))
    }
    offset += 1
    offset = skipSubBlocks(offset)
    const delay = pendingDelay || 10
    delays.push(delay)
    totalDelayCentiseconds += delay
    frames += 1
    pendingDelay = 10
    continue
  }
  throw new Error(`Unexpected GIF block 0x${block.toString(16)} at ${offset}`)
}

console.log(JSON.stringify({
  frames,
  durationMilliseconds: totalDelayCentiseconds * 10,
  minFrameDelayMilliseconds: Math.min(...delays) * 10,
  maxFrameDelayMilliseconds: Math.max(...delays) * 10,
  width: data[6] | (data[7] << 8),
  height: data[8] | (data[9] << 8),
}, null, 2))
