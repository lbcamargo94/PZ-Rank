import { Link } from 'react-router-dom';
import './tips.css';

export function TipsPage() {
  return (
    <div className="tips-wip-page">
      <Link to="/" className="tips-wip-back">
        <i className="ti ti-arrow-left" />
        <span>Início</span>
      </Link>

      <div className="tips-wip-content">
        <div className="tips-wip-icon-wrap">
          <i className="ti ti-barrier-block tips-wip-icon" />
        </div>
        <h1 className="tips-wip-title">EM CONSTRUÇÃO</h1>
        <p className="tips-wip-subtitle">
          O guia de dicas está sendo reescrito.<br />
          Em breve disponível.
        </p>
      </div>
    </div>
  );
}
