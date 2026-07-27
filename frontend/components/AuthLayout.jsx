import Logo from './Logo';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo href="/login" />
        </div>

        <div className="card">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Secure personal finance management
        </p>
      </div>
    </div>
  );
}
