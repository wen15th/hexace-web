import { PackageCheck } from "lucide-react";

export function BrandLogo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex flex-shrink-0 items-center justify-center rounded-xl ${compact ? "h-8 w-8" : "h-9 w-9"} ${inverse ? "bg-white text-[#3F7665]" : "bg-[#9CD4C1] text-[#214A3F]"}`}>
        <PackageCheck size={compact ? 18 : 20} strokeWidth={2.2} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`text-[15px] font-bold tracking-[-0.01em] ${inverse ? "text-white" : "text-gray-900"}`}>HexaDent</span>
        {!compact && <span className={`text-[9px] font-medium uppercase tracking-[0.14em] ${inverse ? "text-emerald-50/70" : "text-gray-400"}`}>AI-powered platform</span>}
      </div>
    </div>
  );
}
