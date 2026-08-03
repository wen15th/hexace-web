const BRAND_ICON_SRC = `${import.meta.env.BASE_URL}brand/hexadent_icon.svg`;

export function BrandLogo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={BRAND_ICON_SRC}
        alt=""
        aria-hidden="true"
        className={`${compact ? "h-8 w-8" : "h-10 w-10"} flex-shrink-0 ${inverse ? "brightness-0 invert" : ""}`}
      />
      <span className={`${compact ? "text-[15px]" : "text-[17px]"} font-bold tracking-[-0.02em] ${inverse ? "text-white" : "text-[#14211F]"}`}>
        HexaDent
      </span>
    </div>
  );
}
