/**
 * 【修改】從來源 canvas (A-Frame 的 canvas) 截圖，並保存/分享
 */
export async function captureAndSave({ sourceCanvas, captureCanvas }) {
  const cw = sourceCanvas.clientWidth;
  const ch = sourceCanvas.clientHeight;
  captureCanvas.width = cw;
  captureCanvas.height = ch;
  const ctx = captureCanvas.getContext('2d');

  // 1) 直接將 AR 場景的 canvas 畫到我們的截圖 canvas 上
  ctx.drawImage(sourceCanvas, 0, 0, cw, ch);

  // 2) 浮水印
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "14px system-ui, -apple-system, Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("Captured with AR.js", 12, ch - 12);

  // 3) 輸出
  const blob = await new Promise(res => captureCanvas.toBlob(res, 'image/png', 0.92));
  const file = new File([blob], `ar-snapshot-${Date.now()}.png`, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'AR Snapshot', text: '來自我的 AR 截圖' });
      return;
    } catch {}
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}