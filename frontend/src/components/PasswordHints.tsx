import { checkPassword } from '../lib/password';

const RULES = [
  { key: 'hasMinLength' as const, label: 'Mínimo 8 caracteres' },
  { key: 'hasUppercase' as const, label: '1 letra maiúscula (A-Z)' },
  { key: 'hasLowercase' as const, label: '1 letra minúscula (a-z)' },
  { key: 'hasNumber'    as const, label: '1 número (0-9)' },
  { key: 'hasSpecial'   as const, label: '1 caractere especial (!@#$%...)' },
];

export function PasswordHints({ password }: { password: string }) {
  if (!password) return null;
  const c = checkPassword(password);
  return (
    <ul className="password-hints">
      {RULES.map(r => (
        <li key={r.key} className={c[r.key] ? 'hint-ok' : 'hint-err'}>
          <i className={`ti ${c[r.key] ? 'ti-check' : 'ti-x'}`} />
          {r.label}
        </li>
      ))}
    </ul>
  );
}
