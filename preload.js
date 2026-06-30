const { ipcRenderer } = require('electron');

// 1. Eigene Titelleiste injizieren (Frameless UI Steuerung mit Back/Forward-Buttons)
window.addEventListener('DOMContentLoaded', () => {
  const titleBar = document.createElement('div');
  titleBar.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 32px;
    background: #0a0a0c; display: flex; align-items: center; justify-content: space-between;
    padding: 0 12px; -webkit-app-region: drag; z-index: 9999999;
    color: #a1a1aa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; 
    font-size: 12px; border-bottom: 1px solid #1f1f23; box-sizing: border-box;
  `;
  titleBar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 14px; -webkit-app-region: drag;">
      <div id="nav-history-controls" style="-webkit-app-region: no-drag; display: flex; gap: 8px;">
        <button id="nav-back-btn" style="background: transparent; border: none; color: #52525b; cursor: default; font-size: 14px; padding: 0 4px; transition: color 0.2s;">🡨</button>
        <button id="nav-forward-btn" style="background: transparent; border: none; color: #52525b; cursor: default; font-size: 14px; padding: 0 4px; transition: color 0.2s;">🡪</button>
      </div>
      <span>AniWorld Linux Client</span>
    </div>
    <div id="window-controls" style="-webkit-app-region: no-drag; display: flex; align-items: center;">
      <button id="nav-close-btn" style="background: transparent; border: none; color: #ff5f56; cursor: pointer; font-weight: bold; font-size: 13px; padding: 0 4px; display: flex; align-items: center; justify-content: center; height: 100%;">✕</button>
    </div>
  `;
  document.body.prepend(titleBar);
  document.body.style.paddingTop = '32px';

  const backBtn = document.getElementById('nav-back-btn');
  const forwardBtn = document.getElementById('nav-forward-btn');

  // Trigger Events für die Navigationslogik
  backBtn.onclick = () => ipcRenderer.send('nav-back-trigger');
  forwardBtn.onclick = () => ipcRenderer.send('nav-forward-trigger');
  document.getElementById('nav-close-btn').onclick = () => ipcRenderer.send('window-close-trigger');

  // Empfange den Live-Zustand der History aus dem Hauptprozess und passe die Opacity an
  ipcRenderer.on('nav-state-sync', (event, state) => {
    if (state.canGoBack) {
      backBtn.style.color = '#a1a1aa';
      backBtn.style.cursor = 'pointer';
    } else {
      backBtn.style.color = '#3f3f46';
      backBtn.style.cursor = 'default';
    }

    if (state.canGoForward) {
      forwardBtn.style.color = '#a1a1aa';
      forwardBtn.style.cursor = 'pointer';
    } else {
      forwardBtn.style.color = '#3f3f46';
      forwardBtn.style.cursor = 'default';
    }
  });

  // 2. AniSkip Logik (Automatischer Intro Skip Prototyp)
  if (window.location.href.includes('/stream/')) {
    const skipBtn = document.createElement('button');
    skipBtn.innerText = "Skip Intro";
    skipBtn.style.cssText = `
      position: fixed; bottom: 40px; right: 20px; z-index: 999999;
      padding: 10px 22px; background: #a855f7; color: white;
      border-radius: 8px; border: none; font-weight: 600; font-family: sans-serif;
      box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4); cursor: pointer; display: none;
      transition: background 0.2s;
    `;
    skipBtn.onmouseover = () => skipBtn.style.background = '#c084fc';
    skipBtn.onmouseout = () => skipBtn.style.background = '#a855f7';
    document.body.appendChild(skipBtn);

    const checkVideoInterval = setInterval(() => {
      const video = document.querySelector('video');
      if (video) {
        clearInterval(checkVideoInterval);
        video.ontimeupdate = () => {
          if (video.currentTime > 30 && video.currentTime < 90) { 
            skipBtn.style.display = 'block';
            skipBtn.onclick = () => { 
              video.currentTime = 90; 
              skipBtn.style.display = 'none'; 
            };
          } else {
            skipBtn.style.display = 'none';
          }
        };
      }
    }, 1000);
  }
});

// 3. Fortsetzen-Overlay (Session Resume Modalfenster)
ipcRenderer.on('show-resume-overlay', (event, animeTitle, url) => {
  const style = document.createElement('style');
  style.innerHTML = `
    #resume-modal-container {
      position: fixed;
      top: 45px;
      right: 20px;
      width: 380px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .resume-box {
      background: rgba(15, 15, 20, 0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 22px;
      border-radius: 14px;
      color: #fff;
      box-shadow: 0 16px 32px rgba(0,0,0,0.4);
      position: relative;
      overflow: hidden;
    }
    .resume-box h2 {
      font-size: 16px;
      margin: 0 0 4px 0;
      font-weight: 600;
      color: #f3f4f6;
      text-align: left;
    }
    .resume-box p {
      font-size: 13px;
      margin: 0 0 16px 0;
      color: #a1a1aa;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
    }
    .resume-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .resume-buttons {
      display: flex;
      gap: 8px;
    }
    .btn-resume {
      padding: 6px 16px;
      border-radius: 6px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-yes {
      background: #a855f7;
      color: white;
    }
    .btn-yes:hover {
      background: #c084fc;
    }
    .btn-no {
      background: rgba(255, 255, 255, 0.06);
      color: #e4e4e7;
    }
    .btn-no:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    .resume-checkbox {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #71717a;
      cursor: pointer;
      user-select: none;
    }
    .resume-checkbox input {
      accent-color: #a855f7;
      cursor: pointer;
      margin: 0;
    }
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #a855f7, #c084fc);
      width: 100%;
      animation: countdown 10s linear forwards;
    }
    @keyframes slideIn {
      from { transform: translateX(420px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(420px); opacity: 0; }
    }
    @keyframes countdown {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'resume-modal-container';
  container.innerHTML = `
    <div class="resume-box">
      <h2>Want to continue?</h2>
      <p id="anime-name-display"></p>
      <div class="resume-footer">
        <label class="resume-checkbox">
          <input type="checkbox" id="resume-dont-show">
          dont show again
        </label>
        <div class="resume-buttons">
          <button class="btn-resume btn-no" id="resume-btn-no">No</button>
          <button class="btn-resume btn-yes" id="resume-btn-yes">Yes</button>
        </div>
      </div>
      <div class="progress-bar"></div>
    </div>
  `;
  document.body.appendChild(container);
  
  document.getElementById('anime-name-display').innerText = animeTitle;

  const closeModal = (action) => {
    const dontShow = document.getElementById('resume-dont-show').checked;
    ipcRenderer.send('resume-action', action, url, dontShow);
    
    container.style.animation = 'slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => container.remove(), 300);
  };

  document.getElementById('resume-btn-yes').onclick = () => closeModal('yes');
  document.getElementById('resume-btn-no').onclick = () => closeModal('no');

  setTimeout(() => {
    if (document.getElementById('resume-modal-container')) {
      closeModal('no');
    }
  }, 10000);
});