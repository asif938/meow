export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-b from-brand-50 to-cream">
      <div className="container-page flex min-h-[70dvh] items-center justify-center py-10">
        <div className="w-full max-w-md rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-xl shadow-orange-900/5 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
