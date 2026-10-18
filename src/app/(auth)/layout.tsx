export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-fpn-gold/20 bg-fpn-green/30 p-8 backdrop-blur">
        {children}
      </div>
    </div>
  );
}
