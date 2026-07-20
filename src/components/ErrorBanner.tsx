export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return <p className="g6-alert g6-alert-error">{children}</p>;
}

export function SuccessBanner({ children }: { children: React.ReactNode }) {
  return <p className="g6-alert g6-alert-success">{children}</p>;
}
