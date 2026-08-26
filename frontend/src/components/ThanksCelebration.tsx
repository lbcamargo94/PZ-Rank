import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import agradecimentoImg from '../../assets/background/agradecimento.webp';

type Stage = 'closed' | 'reveal' | 'modal';

const PARAGRAPHS: string[] = [
  'O PZ Rank — Campeonato Brasileiro de Project Zomboid só existe porque existe uma comunidade disposta a jogar, competir, ajudar, divulgar e, principalmente, construir esse projeto junto com a gente.',
  'Por isso, queremos deixar aqui o nosso muito obrigado a todos que fazem parte dessa história.',
  'Aos players, que aceitaram o desafio, criaram seus sobreviventes e estão enfrentando cada dia desse apocalipse. Cada morte, conquista, objetivo concluído, recorde quebrado e história criada dentro do campeonato dá vida ao PZ Rank.',
  'Aos streamers e criadores de conteúdo, que abrem suas transmissões, compartilham suas jornadas e ajudam outras pessoas a conhecerem o campeonato. Cada live, vídeo, postagem, clipe e divulgação faz o projeto alcançar novos sobreviventes.',
  'A todos que divulgam o PZ Rank, seja compartilhando o site, convidando amigos, falando sobre o campeonato nas comunidades ou simplesmente contando para alguém sobre o projeto: vocês fazem uma diferença enorme.',
  'Um agradecimento especial também às pessoas que cooperam financeiramente com o projeto. Essa ajuda contribui diretamente para manter nossa estrutura funcionando e permite que continuemos desenvolvendo, hospedando, melhorando e expandindo o PZ Rank. Obrigado por acreditarem no projeto e ajudarem a mantê-lo vivo.',
  'Aos nossos moderadores e colaboradores, fica um agradecimento ainda mais especial. Muito do que acontece nos bastidores não aparece para quem está jogando: são testes, discussões, análises, correções, organização, decisões, suporte aos jogadores e inúmeras horas dedicadas para que o campeonato continue funcionando e evoluindo.',
  'E também deixamos nosso reconhecimento à The Indie Stone, por criar e continuar desenvolvendo Project Zomboid. É esse universo incrível, complexo e cheio de possibilidades que tornou possível reunir nossa comunidade em torno de uma competição brasileira dedicada ao jogo.',
  'Mas, acima de qualquer sistema, ranking ou pontuação, o que realmente importa são as pessoas.',
  'O PZ Rank começou como uma ideia, mas está se tornando algo muito maior graças a cada pessoa que decidiu fazer parte dela.',
  'Ainda temos muito para construir, melhorar e aprender. O campeonato continuará evoluindo, e queremos fazer isso sempre ouvindo nossa comunidade e buscando tornar cada temporada melhor que a anterior.',
];

const THANK_YOU_LINES: string[] = [
  'Obrigado aos jogadores.',
  'Obrigado aos streamers.',
  'Obrigado aos moderadores e colaboradores.',
  'Obrigado a quem divulga.',
  'Obrigado a quem apoia financeiramente.',
  'Obrigado à comunidade de Project Zomboid.',
  'E obrigado a você que decidiu fazer parte do PZ Rank.',
];

export function ThanksCelebration() {
  const [stage, setStage] = useState<Stage>('closed');

  useEffect(() => {
    if (stage === 'closed') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setStage('closed'); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [stage]);

  return (
    <>
      <button
        type="button"
        className="btn-header btn-header-thanks"
        onClick={() => setStage('reveal')}
        title="Uma mensagem especial da equipe PZ Rank"
      >
        <i className="ti ti-heart-filled" aria-hidden="true" />
      </button>

      {stage === 'reveal' && createPortal(
        <div className="thanks-reveal-overlay" role="dialog" aria-modal="true">
          <button
            type="button"
            className="thanks-reveal-close"
            onClick={() => setStage('closed')}
            aria-label="Fechar"
          >
            <i className="ti ti-x" />
          </button>
          <div className="thanks-reveal-body">
            <i className="ti ti-heart-filled thanks-reveal-icon" aria-hidden="true" />
            <p className="thanks-reveal-tagline">Antes de continuar, temos algo pra te dizer</p>
            <button
              type="button"
              className="thanks-reveal-btn"
              onClick={() => setStage('modal')}
            >
              <i className="ti ti-heart-filled" aria-hidden="true" />
              Ver agradecimento
            </button>
          </div>
        </div>,
        document.body,
      )}

      {stage === 'modal' && createPortal(
        <div
          className="thanks-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setStage('closed')}
        >
          <button
            type="button"
            className="thanks-modal-close"
            onClick={() => setStage('closed')}
            aria-label="Fechar"
          >
            <i className="ti ti-x" />
          </button>

          <div className="thanks-modal-panel" onClick={e => e.stopPropagation()}>
            <div
              className="thanks-modal-frame"
              style={{ backgroundImage: `url(${agradecimentoImg})` }}
            >
              <div className="thanks-modal-scroll">
                <h2 className="thanks-modal-title">
                  Obrigado por fazer parte do PZ Rank! <span aria-hidden="true">💚</span>
                </h2>

                {PARAGRAPHS.map((p, i) => <p key={i} className="thanks-modal-p">{p}</p>)}

                <div className="thanks-modal-lines">
                  {THANK_YOU_LINES.map((line, i) => (
                    <p key={i} className="thanks-modal-line">{line}</p>
                  ))}
                </div>

                <p className="thanks-modal-p">Cada sobrevivente ajuda a escrever essa história.</p>
                <p className="thanks-modal-closing">Nos vemos no ranking. <span aria-hidden="true">🧟🏆</span></p>

                <p className="thanks-modal-signature">
                  Equipe PZ Rank<br />
                  Campeonato Brasileiro de Project Zomboid
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
