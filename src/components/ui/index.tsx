import React, { useEffect, useRef, useState } from 'react';
import Icon, { type IconName } from './Icon';

export { Icon };
export type { IconName };

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ─── Screen header ────────────────────────────────────────────────────────────

export const ScreenHeader: React.FC<{ eyebrow: string; title: string; action?: React.ReactNode }> = ({
  eyebrow, title, action,
}) => (
  <header className="screen-top px-6 pb-6 flex items-end justify-between gap-4">
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-eyebrow text-faint">{eyebrow}</p>
      <h1 className="mt-1.5 text-[28px] leading-tight font-light text-ink2 truncate">{title}</h1>
    </div>
    {action}
  </header>
);

export const SectionLabel: React.FC<{ children: React.ReactNode; right?: React.ReactNode; className?: string }> = ({
  children, right, className,
}) => (
  <div className={cx('flex items-center justify-between mb-3', className)}>
    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">{children}</p>
    {right && <div className="text-xs text-faint">{right}</div>}
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cx('rounded-2xl bg-surface border border-line/10', className)} {...rest} />
);

// ─── Button ───────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dashed';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg' | 'sm';
  icon?: IconName;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-bg hover:opacity-90',
  secondary: 'bg-surface text-ink2 border border-line/15 hover:bg-surface2/60',
  ghost: 'bg-transparent text-muted hover:text-ink2',
  danger: 'bg-transparent text-danger border border-danger/25 hover:bg-danger/5',
  dashed: 'bg-transparent text-muted border-[1.5px] border-dashed border-line/25 hover:text-ink2 hover:border-line/40',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] rounded-xl gap-1.5',
  md: 'h-12 px-5 text-sm rounded-2xl gap-2',
  lg: 'h-14 px-6 text-[15px] rounded-2xl gap-2 tracking-[0.08em]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary', size = 'md', icon, block, className, children, ...rest
}) => (
  <button
    className={cx(
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none',
      'active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100',
      VARIANTS[variant], SIZES[size], block && 'w-full', className,
    )}
    {...rest}
  >
    {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
    {children}
  </button>
);

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; size?: number }> = ({
  icon, label, size = 20, className, ...rest
}) => (
  <button
    aria-label={label}
    title={label}
    className={cx(
      'inline-flex items-center justify-center w-10 h-10 rounded-xl text-muted hover:text-ink2 hover:bg-surface',
      'transition-colors disabled:opacity-30 disabled:hover:bg-transparent', className,
    )}
    {...rest}
  >
    <Icon name={icon} size={size} />
  </button>
);

// ─── Segmented control ────────────────────────────────────────────────────────

export function Segmented<T extends string>({ value, options, onChange, size = 'md', className }: {
  value: T;
  options: { value: T; label: string; icon?: IconName }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div className={cx('flex p-1 rounded-2xl bg-surface border border-line/10', className)} role="tablist">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-200',
              size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
              active ? 'bg-bg text-ink2 shadow-[0_1px_4px_rgb(0_0_0/0.08)]' : 'text-faint hover:text-muted',
            )}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }> = ({
  checked, onChange, label, disabled,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative w-11 h-[26px] rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-40',
      checked ? 'bg-ink2' : 'bg-line/25',
    )}
  >
    <span
      className={cx(
        'absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-bg shadow-sm transition-transform duration-200',
        checked && 'translate-x-[18px]',
      )}
    />
  </button>
);

// ─── Settings row ─────────────────────────────────────────────────────────────

export const Row: React.FC<{
  icon?: IconName; title: string; subtitle?: React.ReactNode; right?: React.ReactNode; onClick?: () => void;
}> = ({ icon, title, subtitle, right, onClick }) => {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cx('w-full flex items-center gap-3.5 px-4 py-3.5 text-left', onClick && 'hover:bg-surface2/40 transition-colors')}
    >
      {icon && (
        <span className="w-9 h-9 rounded-xl bg-bg border border-line/10 flex items-center justify-center text-muted flex-shrink-0">
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-ink2">{title}</span>
        {subtitle && <span className="block text-xs text-faint mt-0.5 leading-relaxed">{subtitle}</span>}
      </span>
      {right}
    </Comp>
  );
};

export const RowGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card className="overflow-hidden divide-y divide-line/10">{children}</Card>
);

// ─── Stepper ──────────────────────────────────────────────────────────────────

export const Stepper: React.FC<{
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
  format?: (v: number) => string; label: string;
}> = ({ value, onChange, min = 0, max = 999, step = 1, format = String, label }) => {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="inline-flex items-center rounded-xl border border-line/15 bg-bg" role="group" aria-label={label}>
      <button
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="w-9 h-9 flex items-center justify-center text-muted hover:text-ink2 disabled:opacity-30"
      >
        <Icon name="minus" size={16} />
      </button>
      <span className="min-w-[52px] text-center text-sm text-ink2 tabular-nums">{format(value)}</span>
      <button
        aria-label={`Increase ${label}`}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="w-9 h-9 flex items-center justify-center text-muted hover:text-ink2 disabled:opacity-30"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
};

// ─── Text field ───────────────────────────────────────────────────────────────

export const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: IconName }> = ({
  label, icon, id, className, ...rest
}) => (
  <label htmlFor={id} className="flex flex-col gap-1.5">
    <span className="text-xs text-faint">{label}</span>
    <span className="relative flex items-center">
      {icon && <Icon name={icon} size={18} className="absolute left-4 text-faint pointer-events-none" />}
      <input
        id={id}
        className={cx(
          'w-full h-12 rounded-2xl bg-surface border border-line/15 text-sm text-ink2 outline-none',
          'placeholder:text-faint/70 focus:border-line/40 transition-colors',
          icon ? 'pl-11 pr-4' : 'px-4', className,
        )}
        {...rest}
      />
    </span>
  </label>
);

// ─── Dialog ───────────────────────────────────────────────────────────────────

export const Dialog: React.FC<{
  open: boolean; title: string; body?: React.ReactNode; confirmLabel: string; cancelLabel?: string;
  destructive?: boolean; onConfirm: () => void; onCancel: () => void;
}> = ({ open, title, body, confirmLabel, cancelLabel = 'Cancel', destructive, onConfirm, onCancel }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-ink/30 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-3xl bg-bg border border-line/10 p-6 shadow-2xl animate-sheet-in pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-normal text-ink2">{title}</h2>
        {body && <div className="mt-2 text-sm text-muted leading-relaxed">{body}</div>}
        <div className="mt-6 flex gap-3">
          <Button block onClick={onCancel}>{cancelLabel}</Button>
          <Button block variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Hold-to-confirm button ───────────────────────────────────────────────────

/** Requires a sustained press, so a session can't be ended by an accidental tap. */
export const HoldButton: React.FC<{
  onConfirm: () => void; children: React.ReactNode; holdMs?: number; className?: string; id?: string;
}> = ({ onConfirm, children, holdMs = 1200, className, id }) => {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const startT = useRef(0);

  const cancel = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(0);
  };

  const begin = (e: React.PointerEvent) => {
    e.preventDefault();
    startT.current = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - startT.current) / holdMs);
      setProgress(p);
      if (p >= 1) {
        raf.current = null;
        setProgress(0);
        onConfirm();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return (
    <button
      id={id}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={e => e.preventDefault()}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onConfirm(); } }}
      className={cx('relative overflow-hidden select-none touch-none', className)}
    >
      <span
        className="absolute inset-y-0 left-0 bg-line/15"
        style={{ width: `${progress * 100}%` }}
        aria-hidden="true"
      />
      <span className="relative inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};
