import {
  isDescriptionEmpty,
  sanitizeDescriptionHtml,
} from "@/lib/description-html";

type PropertyDescriptionProps = {
  html: string;
  className?: string;
};

export function PropertyDescription({ html, className }: PropertyDescriptionProps) {
  if (isDescriptionEmpty(html)) return null;

  return (
    <div
      data-testid="property-description"
      className={className ?? "property-description text-muted leading-relaxed"}
      dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(html) }}
    />
  );
}
