import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '../lib/nav';

interface NavDrawerProps {
  open:          boolean;
  onClose:       () => void;
  pathname:      string;
  playerSession: { nick: string; player_id: number } | null;
  onPainel:      () => void;
}

export function NavDrawer({ open, onClose, pathname, playerSession, onPainel }: NavDrawerProps) {
  const { t }   = useTranslation();
  const ref     = useRef<HTMLDialogElement>(null);

  /* Abre/fecha o <dialog> nativo — focus trap + backdrop + Escape de graça */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      el.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      if (el.open) el.close();
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* Escape dispara "cancel" no dialog — mapeia para onClose */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => { e.preventDefault(); onClose(); };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [onClose]);

  const active = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  /* Clique no ::backdrop (o próprio <dialog> fora do panel) fecha */
  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose();
  };

  return (
    <dialog ref={ref} className="nd" onClick={onBackdropClick} aria-label={t('header.nav_aria')}>
      <div className="nd-panel">

        {/* Cabeçalho */}
        <div className="nd-header">
          <span className="nd-title">Menu</span>
          <button className="nd-close" onClick={onClose} aria-label={t('header.menu_close')}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="nd-nav">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`nd-item${active(item.to) ? ' nd-item-active' : ''}`}
              aria-current={active(item.to) ? 'page' : undefined}
              onClick={onClose}
            >
              <i className={`ti ${item.icon} nd-item-icon`} aria-hidden="true" />
              <span className="nd-item-label">{t(`nav.${item.navKey}`)}</span>
              {active(item.to) && <span className="nd-item-dot" aria-hidden="true" />}
            </Link>
          ))}
        </nav>

        {/* Rodapé: conta + painel */}
        <div className="nd-footer">
          <Link
            to={playerSession ? '/perfil' : '/login'}
            className={`nd-item nd-item-account${playerSession ? ' nd-item-logged' : ''}`}
            onClick={onClose}
          >
            <i className={`ti ${playerSession ? 'ti-user-filled' : 'ti-user-circle'} nd-item-icon`} aria-hidden="true" />
            <span className="nd-item-label">
              {playerSession ? playerSession.nick : t('header.login')}
            </span>
          </Link>
          <button
            className="nd-item nd-item-mod"
            onClick={() => { onPainel(); onClose(); }}
          >
            <i className="ti ti-shield-half nd-item-icon" aria-hidden="true" />
            <span className="nd-item-label">{t('nav.moderators')}</span>
          </button>
        </div>

      </div>
    </dialog>
  );
}
