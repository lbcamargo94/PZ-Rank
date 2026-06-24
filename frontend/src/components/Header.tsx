import { Link } from 'react-router-dom';
import {
  IconBook,
  IconSettings,
  IconShieldHalf,
  IconSkull,
  IconCalendar,
  IconUserCheck,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onPainel:   () => void;
  onRules:    () => void;
  onSettings: () => void;
}

export function Header({ onPainel, onRules, onSettings }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="header-brand" aria-label="Página inicial">
          <span className="game-label">Project Zomboid</span>
          <h1 className="site-title">Ranking de Sobrevivência</h1>
          <p className="site-sub">Desafio BRASILEIRÃO PZ</p>
        </Link>
        <div className="header-actions">
          <Button variant="ghost" size="sm" onClick={onRules} aria-label="Regras do desafio">
            <IconBook size={16} aria-hidden="true" /> Regras
          </Button>
          <Button variant="ghost" size="sm" onClick={onSettings} aria-label="Configurações do desafio">
            <IconSettings size={16} aria-hidden="true" /> Configurações
          </Button>
          <Button variant="ghost" size="sm" onClick={onPainel} aria-label="Painel de moderadores">
            <IconShieldHalf size={16} aria-hidden="true" /> Moderadores
          </Button>
        </div>
      </div>
      <div className="container rules-bar">
        <span className="rule-tag"><IconSkull size={16} aria-hidden="true" /> Stats do mod</span>
        <span className="rule-tag"><IconCalendar size={16} aria-hidden="true" /> Tempo, dias, zumbis</span>
        <span className="rule-tag"><IconSettings size={16} aria-hidden="true" /> Sandbox validado</span>
        <span className="rule-tag"><IconUserCheck size={16} aria-hidden="true" /> Aprovado por moderador</span>
      </div>
    </header>
  );
}