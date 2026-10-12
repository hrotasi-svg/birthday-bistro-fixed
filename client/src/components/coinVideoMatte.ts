/**
 * Keeps warm-gold metal and bright reflections while removing the encoded
 * near-black video backdrop. This works on pixels only; it adds no overlay,
 * replacement coin, or synthetic background.
 */
export function shouldKeepCoinVideoPixel(
  red: number,
  green: number,
  blue: number
) {
  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
  const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
  const warmMetal =
    luminance >= 46 &&
    red >= 50 &&
    green >= 35 &&
    red > blue * 1.4 &&
    green > blue * 1.25 &&
    chroma >= 18;
  const brightReflection = luminance >= 108 && red + green > blue * 1.45;

  return warmMetal || brightReflection;
}

export function applyCoinVideoMatte(data: Uint8ClampedArray, offset: number) {
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];

  if (!shouldKeepCoinVideoPixel(red, green, blue)) {
    data[offset] = 0;
    data[offset + 1] = 0;
    data[offset + 2] = 0;
    data[offset + 3] = 0;
    return false;
  }

  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
  const edgeSignal = Math.min(1, Math.max(0, (luminance - 46) / 72));
  data[offset + 3] = Math.round((0.62 + edgeSignal * 0.38) * 255);
  return true;
}
