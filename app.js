// 【移除】不再需要 HorizontalColorDetector 和 AROverlay
import { captureAndSave } from './capture.js';

const els = {
  startScreen: document.getElementById('start-screen'),
  cameraScreen: document.getElementById('camera-screen'),
  btnStart: document.getElementById('btn-start'),
  btnCapture: document.getElementById('btn-capture'),
  btnSwitchContent: document.getElementById('btn-switch-content'),
  btnTorch: document.getElementById('btn-torch'),
  btnSettings: document.getElementById('btn-settings'),
  statusTip: document.getElementById('status-tip'),
  statusText: document.getElementById('status-text'),
  
  // 【新增】A-Frame 相關元素
  arScene: document.getElementById('ar-scene'),
  nftMarker: document.getElementById('nft-marker'),
  arImage: document.getElementById('ar-image'),
  arVideo: document.getElementById('ar-video'),
  arVideoAsset: document.getElementById('overlay-video-asset'),

  // 【修改】直接引用 A-Frame 的 canvas 做截圖
  captureCanvas: document.getElementById('capture-canvas'),
};

let useImage = true;
let arjsSystem = null; // 用來儲存 AR.js 的系統物件
let hasTorch = false;
let torchOn = false;

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function setStatus(text, type = 'info') {
  if (!els.statusTip) return;
  show(els.statusTip);
  els.statusText.textContent = text;
  els.statusTip.classList.remove('info', 'success', 'warn', 'error');
  els.statusTip.classList.add(type);
}

// 【簡化】不再需要複雜的相機啟動邏輯，A-Frame 會處理
async function startAR() {
  hide(els.startScreen);
  show(els.cameraScreen);
  
  // A-Frame 會自動請求相機權限並啟動
  // 我們需要等待 AR.js 系統完全載入
  els.arScene.addEventListener('loaded', () => {
    arjsSystem = els.arScene.systems.arjs;

    // 透過 AR.js 的 video 物件檢查手電筒功能
    arjsSystem.video.addEventListener('loadedmetadata', () => {
        const track = arjsSystem.video.srcObject?.getVideoTracks()[0];
        if (track) {
            const capabilities = track.getCapabilities();
            hasTorch = !!capabilities.torch;
            els.btnTorch.style.opacity = hasTorch ? 1 : 0.35;
            els.btnTorch.title = hasTorch ? '手電筒' : '手電筒（不支援）';
        }
    });
  });

  setStatus('請將鏡頭對準指定的 AR 圖片', 'info');

  // 【新增】監聽 A-Frame 的 marker 事件
  els.nftMarker.addEventListener('markerFound', () => {
    setStatus('成功偵測到圖片！', 'success');
  });

  els.nftMarker.addEventListener('markerLost', () => {
    setStatus('圖片已離開畫面，請重新對準', 'warn');
  });
}

function stopAR() {
    // A-Frame 會在頁面卸載時自動清理，但如果需要手動停止，可以呼叫 pause
    try {
        els.arScene.pause();
        const stream = arjsSystem?.video.srcObject;
        stream?.getTracks().forEach(track => track.stop());
    } catch(e) {
        console.error("Error stopping AR scene:", e);
    }
}

async function init() {
  if ('serviceWorker' in navigator) {
    try { navigator.serviceWorker.register('./sw.js', { scope: './' }); } catch {}
  }

  els.btnStart.addEventListener('click', async () => {
    // iOS 需要使用者互動才能播放影片
    try { await els.arVideoAsset.play(); els.arVideoAsset.pause(); } catch {}
    startAR();
  });

  els.btnSwitchContent.addEventListener('click', () => {
    useImage = !useImage;
    if (useImage) {
      els.arImage.setAttribute('visible', 'true');
      els.arVideo.setAttribute('visible', 'false');
      els.arVideoAsset.pause();
    } else {
      els.arImage.setAttribute('visible', 'false');
      els.arVideo.setAttribute('visible', 'true');
      els.arVideoAsset.play().catch(() => {});
    }
  });

  els.btnCapture.addEventListener('click', async () => {
    flashScreen();
    // 【修改】傳遞 A-Frame 的 canvas 給截圖函式
    const arCanvas = els.arScene.canvas;
    await captureAndSave({
      sourceCanvas: arCanvas,
      captureCanvas: els.captureCanvas
    });
    setStatus('已保存或已開啟分享面板', 'success');
  });
  
  els.btnTorch.addEventListener('click', async () => {
    if (!hasTorch || !arjsSystem?.video.srcObject) return;
    torchOn = !torchOn;
    try {
      const track = arjsSystem.video.srcObject.getVideoTracks()[0];
      await track.applyConstraints({ advanced: [{ torch: torchOn }] });
      els.btnTorch.style.background = torchOn ? 'rgba(255, 255, 150, 0.25)' : '';
    } catch (e) {
      torchOn = false;
      alert('手電筒切換失敗或不支援');
    }
  });

  window.addEventListener('pagehide', stopAR);
  window.addEventListener('beforeunload', stopAR);
}

function flashScreen() {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.inset = '0';
  el.style.zIndex = '9999';
  el.style.background = 'white';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.style.transition = 'opacity .15s ease';
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '0.65';
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 150);
    }, 100);
  });
}

init();