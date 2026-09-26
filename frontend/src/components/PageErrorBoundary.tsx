import { Component, type ReactNode } from 'react';
import { isChunkLoadError } from '../lib/lazyPage';

// Sem isto, um erro ao abrir uma página (ex: arquivo de versão antiga do site)
// desmontava tudo e deixava a tela em branco. Agora mostra o que houve e um botão
// pra recarregar. `resetKey` = rota atual: trocar de página limpa o erro.

interface Props { children: ReactNode; resetKey: string }
interface State { error: unknown }

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State { return { error }; }

  componentDidCatch(error: unknown) { console.error('[página] erro ao renderizar:', error); }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const outdated = isChunkLoadError(this.state.error);
    return (
      <div className="container page-error" role="alert">
        <i className="ti ti-refresh-alert" aria-hidden="true" />
        <h1>{outdated ? 'O site foi atualizado' : 'Não foi possível abrir esta página'}</h1>
        <p>
          {outdated
            ? 'Uma versão nova do PZ Rank acabou de ser publicada. Recarregue para continuar.'
            : 'Ocorreu um erro inesperado. Tente recarregar a página.'}
        </p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          <i className="ti ti-refresh" /> Recarregar
        </button>
      </div>
    );
  }
}
