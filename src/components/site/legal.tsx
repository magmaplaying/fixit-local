export function LegalSection({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-24">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-3 text-[15px] leading-relaxed text-black/70">{children}</div>
    </section>
  );
}
