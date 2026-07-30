import { useState } from "react";
import {
  ArrowRight, BarChart2, Bell, ChevronUp, ClipboardList,
  HelpCircle, LayoutDashboard, Menu, Package, Settings,
  SlidersHorizontal,
} from "lucide-react";

export type AppPage =
  | "dashboard"
  | "inventory"
  | "purchase-lists"
  | "purchase-list-detail"
  | "analytics"
  | "settings"
  | "help";

export type SettingsTab = "general" | "account" | "security";

const NAV_ITEMS: { id: AppPage; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "inventory", label: "Inventory", icon: <Package size={16} /> },
  { id: "purchase-lists", label: "Purchase Lists", icon: <ClipboardList size={16} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart2 size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export function Sidebar({
  currentPage,
  onNavigate,
  onNavigateSettings,
  onSignOut,
}: {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onNavigateSettings: (tab: SettingsTab) => void;
  onSignOut: () => void;
}) {
  const activePage = currentPage === "purchase-list-detail" ? "purchase-lists" : currentPage;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-100 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#315eba]">
            <span className="text-xs font-bold text-white">H</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold leading-tight text-gray-900">Hexace</span>
            <span className="text-[9px] font-medium tracking-wide text-gray-400">AI-Powered Inventory Platform</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activePage;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                isActive
                  ? "bg-[#eef2f7] font-semibold text-[#315eba]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className={isActive ? "text-[#315eba]" : "text-gray-400"}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="relative border-t border-gray-100 p-4">
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full left-3 right-3 z-40 mb-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="border-b border-gray-50 px-4 py-3">
                <p className="truncate text-xs font-semibold text-gray-900">Dr. Smith</p>
                <p className="truncate text-[11px] text-gray-400">dr.smith@sunshinedental.com</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); onNavigateSettings("account"); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Settings size={14} className="text-gray-400" /> Account Settings
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onNavigateSettings("security"); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <SlidersHorizontal size={14} className="text-gray-400" /> Security
                </button>
              </div>
              <div className="border-t border-gray-50 py-1">
                <button
                  onClick={() => { setMenuOpen(false); onSignOut(); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                >
                  <ArrowRight size={14} className="rotate-180" /> Sign Out
                </button>
              </div>
            </div>
          </>
        )}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e6ebf5] text-xs font-bold text-[#404d6b]">DS</div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium leading-tight text-gray-900">Dr. Smith</p>
            <p className="truncate text-[11px] leading-tight text-gray-400">dr.smith@sunshinedental.com</p>
          </div>
          <ChevronUp size={13} className={`flex-shrink-0 text-gray-400 transition-transform ${menuOpen ? "" : "rotate-180"}`} />
        </button>
      </div>
    </aside>
  );
}

export function TopBar({
  onToggleSidebar,
  unreadCount,
  onOpenNotifications,
  onOpenHelp,
}: {
  onToggleSidebar: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <button onClick={onToggleSidebar} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50">
        <Menu size={18} />
      </button>
      <div className="flex items-center gap-2">
        <button onClick={onOpenNotifications} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button onClick={onOpenHelp} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50">
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
}
