
function updatePixelNoise() {
  const canvas = document.getElementById('pixelBorder');
  const ctx = canvas.getContext('2d');
  const height = canvas.height;
  const imageData = ctx.createImageData(1, height);
  const data = imageData.data;

  for (let i = 0; i < height; i++) {
    const hue = Math.floor(Math.random() * 360);
    const [r, g, b] = hslToRgb(hue / 360, 1, 0.6);
    const idx = i * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  const url = canvas.toDataURL();
  const styleEl = document.getElementById('pixelStyle') || (() => {
    const el = document.createElement('style');
    el.id = 'pixelStyle';
    document.head.appendChild(el);
    return el;
  })();

  styleEl.textContent = `
    .CL-timeline::before {
      background-image: url('${url}');
    }
  `;
}

// HSL to RGB converter
function hslToRgb(h, s, l) {
  let r, g, b;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  r = hue2rgb(p, q, h + 1/3);
  g = hue2rgb(p, q, h);
  b = hue2rgb(p, q, h - 1/3);
  return [r * 255, g * 255, b * 255];
}


<script>
    function updatePixelNoise() {
        const canvas = document.getElementById('pixelBorder');
        const ctx = canvas.getContext('2d');
        const height = canvas.height;
        const imageData = ctx.createImageData(1, height);
        const data = imageData.data;

        for (let i = 0; i < height; i++) {
            const hue = Math.floor(Math.random() * 360);
            const [r, g, b] = hslToRgb(hue / 360, 1, 0.6);
            const idx = i * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
        const url = canvas.toDataURL();
        const styleEl = document.getElementById('pixelStyle') || (() => {
            const el = document.createElement('style');
            el.id = 'pixelStyle';
            document.head.appendChild(el);
            return el;
        })();

        styleEl.textContent = `
    .CL-timeline::before {
      background-image: url('${url}');
    }
  `;
    }

    // HSL to RGB converter
    function hslToRgb(h, s, l) {
        let r, g, b;
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
        return [r * 255, g * 255, b * 255];
    }

    // Animate every 150ms
    setInterval(updatePixelNoise, 150);
</script>