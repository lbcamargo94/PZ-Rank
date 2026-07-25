interface OtpInputProps {
  value:      string;
  onChange:   (v: string) => void;
  hint?:      string;
  loading?:   boolean;
  onResend?:  () => void;
  resendMsg?: string;
}

export function OtpInput({ value, onChange, hint, loading, onResend, resendMsg }: OtpInputProps) {
  return (
    <div className="otp-wrap">
      {hint && <p className="otp-hint">{hint}</p>}
      <input
        className="otp-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        autoFocus
        autoComplete="one-time-code"
        placeholder="000000"
        disabled={loading}
        aria-label="Código de verificação"
      />
      <p className="otp-meta">{value.length}/6 dígitos</p>
      {onResend && (
        <button type="button" className="btn-ghost btn-sm" onClick={onResend} disabled={loading}>
          <i className="ti ti-refresh" /> Reenviar código
        </button>
      )}
      {resendMsg && <p className="otp-resend-msg">{resendMsg}</p>}
    </div>
  );
}
