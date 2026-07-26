export interface PasswordCheck {
  ok:           boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber:    boolean;
  hasSpecial:   boolean;
}

export function checkPassword(password: string): PasswordCheck {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber    = /[0-9]/.test(password);
  const hasSpecial   = /[^a-zA-Z0-9]/.test(password);
  return {
    ok: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial,
    hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial,
  };
}
