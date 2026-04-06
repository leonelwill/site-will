interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
  light?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = true,
  light = false,
}: SectionHeadingProps) {
  return (
    <div className={centered ? "text-center max-w-3xl mx-auto" : "max-w-2xl"}>
      {eyebrow && (
        <p className={`text-sm font-semibold uppercase tracking-widest mb-3 ${light ? "text-brand-accent" : "text-brand-primary"}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`text-3xl sm:text-4xl font-bold leading-tight ${light ? "text-white" : "text-brand-dark"}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/70" : "text-muted-foreground"}`}>
          {description}
        </p>
      )}
    </div>
  );
}
