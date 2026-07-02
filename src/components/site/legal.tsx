export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-3 text-[15px] leading-relaxed text-black/70">{children}</div>
    </section>
  );
}
