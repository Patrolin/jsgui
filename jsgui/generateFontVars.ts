function generateFontSizeCssVars(start = 12, sizes: string[] = SIZES) {
  const fontSizes = [start];
  for (let i = 1; i < sizes.length; i++) {
    let desiredFontSize = Math.ceil(fontSizes[fontSizes.length - 1] * 1.25); // NOTE: derived from how monkeys count
    while ((desiredFontSize % 2) !== 0) desiredFontSize++; // NOTE: prevent fractional pixels
    fontSizes.push(desiredFontSize);
  }
  let acc = "  /* generated by generateFontSizeCssVars */";
  for (let i = 0; i < sizes.length; i++) {
    const sizeName = sizes[i];
    const fontSize = fontSizes[i];
    acc += `\n  --size-${sizeName}: ${fontSize}px;`;
    for (let offset = 1; offset < sizes.length; offset++) {
      const j = Math.max(0, i - offset);
      acc += `\n  --size-${sizeName}-${offset}: var(--size-${sizes[j]});`;
    }
  }
  return acc;
}
function generateColorCssVars(colors: StringMap<string> = BASE_COLORS, start = 0.874, step = 2, shades = COLOR_SHADES) {
  let acc = "  /* generated by generateColorCssVars */";
  for (let [colorName, color] of Object.entries(colors)) {
    for (let i = 0; i < shades.length; i++) {
      const shadeName = shades[i];
      const shadeSuffix = shadeName ? `-${shadeName}` : "";
      const shadeNumber = +`${(shadeName || "0")[0]}.${shadeName.slice(1)}`;
      const alpha = start / step ** shadeNumber;
      acc += `\n  --${colorName}${shadeSuffix}: rgba(${color}, ${alpha.toFixed(3)});`
    }
  }
  return acc;
}
setTimeout(() => {
  //console.log(generateFontSizeCssVars());
  //console.log(generateColorCssVars());
})