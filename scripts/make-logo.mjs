// One-off: knock the black background out of nucle.jpg → transparent PNG.
import sharp from "sharp";

const SRC = "C:/Users/user/Downloads/nucle.jpg";
const OUT = "public/nucle-logo.png";

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
for (let i = 0; i < data.length; i += channels) {
  const m = Math.max(data[i], data[i + 1], data[i + 2]); // brightest channel
  let a;
  if (m <= 18) a = 0;
  else if (m >= 55) a = 255;
  else a = Math.round(((m - 18) / (55 - 18)) * 255);
  data[i + 3] = a;
}

await sharp(data, { raw: { width, height, channels } })
  .trim({ threshold: 10 })
  .png()
  .toFile(OUT);

console.log(`wrote ${OUT} (${width}x${height})`);
