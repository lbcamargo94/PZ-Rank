import { useEffect } from "react";
import qrImg from "../../assets/livepix-qr.png";

const LIVEPIX_URL = "https://livepix.gg/ullyltv";

interface Props {
  onClose: () => void;
}

export function DonationModal({ onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay active donation-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Apoie o desenvolvedor"
      onClick={onClose}
    >
      <div
        className="modal-box donation-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          aria-label="Fechar"
          onClick={onClose}
          type="button"
        >
          <i className="ti ti-x" aria-hidden="true" />
        </button>

        <div className="donation-modal-header">
          <span className="donation-modal-emoji" aria-hidden="true">
            ☕
          </span>
          <h2 className="donation-modal-title">
            Mantenha o desenvolvedor longe da horda
          </h2>
        </div>

        <div className="donation-modal-body">
          <p className="donation-modal-text">
            Enquanto você sobrevive aos zumbis,
            <br />
            alguém está sobrevivendo aos bugs.
          </p>
          <p className="donation-modal-text">
            Se o PZRank tornou sua experiência melhor,
            <br />
            considere pagar um café. Qualquer valor ajuda:
          </p>
          <ul className="donation-modal-list">
            <li>Hospedagem do site</li>
            <li>PZ Rank Companion</li>
            <li>Mods</li>
            <li>Campeonato</li>
          </ul>
          <p className="donation-modal-thanks">
            Obrigado por apoiar este projeto ❤
          </p>
        </div>

        <div className="donation-qr-wrap">
          <img
            src={qrImg}
            alt="QR Code para doação via LivePix"
            className="donation-qr-img"
            loading="lazy"
            width={160}
            height={160}
            draggable={false}
          />
        </div>

        <div className="donation-modal-actions">
          <a
            href={LIVEPIX_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-livepix"
          >
            <i className="ti ti-external-link" aria-hidden="true" />
            Abrir LivePix
          </a>
          <button
            className="btn-donation-close"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
