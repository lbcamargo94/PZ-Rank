const DOWNLOAD_URL =
  'https://github.com/lbcamargo94/PZ-Rank-Companion/releases/download/v1.5.2/PZ.Rank.Companion.Setup.1.5.2.exe';

export function DownloadBanner() {
  return (
    <div className="download-banner">
      <div className="container download-banner-inner">
        <div className="download-banner-info">
          <i className="ti ti-device-desktop-analytics download-banner-icon" aria-hidden="true" />
          <div className="download-banner-text">
            <span className="download-banner-title">PZ Rank Companion</span>
            <span className="download-banner-sub">
              Envie seus stats direto do jogo para o ranking · Windows
            </span>
          </div>
        </div>
        <a href={DOWNLOAD_URL} className="btn-download" download>
          <i className="ti ti-download" aria-hidden="true" /> Baixar v1.5.2
        </a>
      </div>
    </div>
  );
}
