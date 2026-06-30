const { ipcRenderer } = require('electron');

ipcRenderer.on('show-resume-overlay', (event, animeTitle, url) => {
  const style = document.createElement('style');
  style.innerHTML = `
    #resume-modal-container {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 380px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .resume-box {
      background: rgba(15, 15, 20, 0.85);
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
          dont show me again
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