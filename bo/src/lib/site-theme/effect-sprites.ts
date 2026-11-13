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
