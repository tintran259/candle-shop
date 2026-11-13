// Bản sao fe/src/components/effects/sprites.ts cho khung xem trước (sửa thì sửa cả hai). Hình hạt cho hiệu ứng hero: vẽ sẵn một lần lên canvas nhỏ rồi dán lại mỗi khung hình — nhanh hơn vẽ hình từng hạt.
// Tuyết: chấm trắng mềm. Tết: hoa mai (vàng) / hoa đào (hồng) và cánh rời. Valentine: tim rượu vang / hồng
export type Sprite = HTMLCanvasElement;

const SIZE = 64;

function canvas(draw: (g: CanvasRenderingContext2D) => void): Sprite {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const g = c.getContext("2d")!;
  g.translate(SIZE / 2, SIZE / 2);
  draw(g);
  return c;
}

export function snowSprite() {
  return canvas((g) => {
    const r = SIZE / 2;
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.75)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(-r, -r, SIZE, SIZE);
  });
}

// Hoa 5 cánh: cánh màu petal, nhụy màu heart
export function flowerSprite(petal: string, edge: string, heart: string) {
  return canvas((g) => {
    for (let i = 0; i < 5; i++) {
      g.save();
      g.rotate((i * 2 * Math.PI) / 5);
      const grad = g.createLinearGradient(0, -4, 0, -29);
      grad.addColorStop(0, edge);
      grad.addColorStop(1, petal);
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(0, -16, 10.5, 14, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.fillStyle = heart;
    g.beginPath();
    g.arc(0, 0, 5, 0, Math.PI * 2);
    g.fill();
    // nhị hoa
    g.fillStyle = "#f6e27a";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.beginPath();
      g.arc(Math.cos(a) * 8, Math.sin(a) * 8, 1.6, 0, Math.PI * 2);
      g.fill();
    }
  });
}

// Cánh hoa rời: hình giọt, khía nhẹ ở đầu
export function petalSprite(color: string, edge: string) {
  return canvas((g) => {
    const grad = g.createLinearGradient(0, 22, 0, -22);
    grad.addColorStop(0, edge);
    grad.addColorStop(1, color);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 24);
    g.bezierCurveTo(-18, 10, -16, -16, -5, -22);
    g.lineTo(0, -17);
    g.lineTo(5, -22);
    g.bezierCurveTo(16, -16, 18, 10, 0, 24);
    g.fill();
  });
}

export function heartSprite(color: string, light: string) {
  return canvas((g) => {
    const grad = g.createRadialGradient(-7, -8, 2, 0, 0, 28);
    grad.addColorStop(0, light);
    grad.addColorStop(1, color);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 22);
    g.bezierCurveTo(-30, 2, -22, -26, 0, -12);
    g.bezierCurveTo(22, -26, 30, 2, 0, 22);
    g.fill();
  });
}

// Hoa anh đào: 5 cánh, đầu cánh có khía, hồng nhạt ra mép, nhụy hồng đậm
export function sakuraSprite() {
  return canvas((g) => {
    const grad = g.createRadialGradient(0, 0, 2, 0, 0, 29);
    grad.addColorStop(0, "#f48fb1");
    grad.addColorStop(0.45, "#ffc9d9");
    grad.addColorStop(1, "#fff0f4");
    g.fillStyle = grad;
    for (let i = 0; i < 5; i++) {
      g.save();
      g.rotate((i * 2 * Math.PI) / 5);
      g.beginPath();
      g.moveTo(0, -2);
      g.bezierCurveTo(-13, -8, -14, -24, -6, -29);
      g.lineTo(0, -24);
      g.lineTo(6, -29);
      g.bezierCurveTo(14, -24, 13, -8, 0, -2);
      g.fill();
      g.restore();
    }
    g.strokeStyle = "#d9577e";
    g.fillStyle = "#c2185b";
    g.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const a = (i * 2 * Math.PI) / 7;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
      g.stroke();
      g.beginPath();
      g.arc(Math.cos(a) * 9, Math.sin(a) * 9, 1.5, 0, Math.PI * 2);
      g.fill();
    }
  });
}

// Phong bao lì xì: thân đỏ, nắp chữ V viền vàng, đồng xu vàng lỗ vuông ở giữa
export function lixiSprite() {
  return canvas((g) => {
    const w = 40;
    const h = 56;
    const body = g.createLinearGradient(0, -h / 2, 0, h / 2);
    body.addColorStop(0, "#e0353d");
    body.addColorStop(1, "#a8121b");
    g.fillStyle = body;
    g.beginPath();
    g.roundRect(-w / 2, -h / 2, w, h, 4);
    g.fill();
    // viền vàng mảnh bên trong
    g.strokeStyle = "rgba(242,193,78,0.85)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 2.5);
    g.stroke();
    // nắp
    g.fillStyle = "#b8141d";
    g.beginPath();
    g.moveTo(-w / 2, -h / 2 + 2);
    g.lineTo(0, -6);
    g.lineTo(w / 2, -h / 2 + 2);
    g.closePath();
    g.fill();
    g.strokeStyle = "#f2c14e";
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(-w / 2 + 1, -h / 2 + 3);
    g.lineTo(0, -6);
    g.lineTo(w / 2 - 1, -h / 2 + 3);
    g.stroke();
    // đồng xu
    const coin = g.createRadialGradient(-3, 6, 1, 0, 9, 10);
    coin.addColorStop(0, "#ffe8a3");
    coin.addColorStop(1, "#e0a92e");
    g.fillStyle = coin;
    g.beginPath();
    g.arc(0, 9, 9, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#b8141d";
    g.fillRect(-3, 6, 6, 6);
  });
}
