const RULES = [
  { test: (p: string) => p.length >= 8,         msg: 'A senha deve ter no mínimo 8 caracteres.' },
  { test: (p: string) => /[A-Z]/.test(p),       msg: 'A senha deve conter ao menos uma letra maiúscula (A-Z).' },
  { test: (p: string) => /[a-z]/.test(p),       msg: 'A senha deve conter ao menos uma letra minúscula (a-z).' },
  { test: (p: string) => /[0-9]/.test(p),       msg: 'A senha deve conter ao menos um número (0-9).' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), msg: 'A senha deve conter ao menos um caractere especial (!@#$%...).' },
];

export function validatePassword(password: string): string | null {
  for (const rule of RULES) {
    if (!rule.test(password)) return rule.msg;
  }
  return null;
}
