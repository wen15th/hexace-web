import { useState, useRef, useEffect } from "react";
import { Sidebar, TopBar, type AppPage, type SettingsTab } from "./components/AppLayout";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Toaster, toast } from "sonner";
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2, Settings,
  Bell, HelpCircle, ChevronDown, Search, X, Plus, Menu,
  ChevronLeft, ChevronRight, PackagePlus, ListPlus, Pencil,
  Activity, Trash2, SlidersHorizontal, Calendar, Upload,
  FileText, ArrowUpCircle, ArrowDownCircle,
  Hash, MoreHorizontal, Tag, ChevronUp, ChevronsUpDown,
  AlertTriangle, Scan, ClipboardList, CheckCheck, Clock,
  Boxes, ArrowRight, TrendingUp, TrendingDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";
type SortDir = "asc" | "desc" | null;
type ActivityType =
  | "Increase" | "Decrease" | "Set Quantity"
  | "Item Added" | "Item Edited" | "Item Removed" | "Import Adjustment";

interface InventoryItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  location: string;
  sku: string;
  barcode: string;
  preferredSupplier: string;
  purchasePrice: string;
  expiryDate: string;
  internalNote: string;
  lastUpdated: string;
}

interface ActivityEntry {
  id: number;
  dateTime: string;
  product: string;
  type: ActivityType;
  change: number | null;
  previous: number | null;
  next: number | null;
  reason: string;
  performedBy: string;
}

interface CatalogProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  sku: string;
  barcode: string;
  specification: string;
}

interface PurchaseListItem {
  id: number;
  name: string;
  brand: string;
  quantity: number;       // requested quantity
  receivedQuantity: number; // cumulative received so far
  unit: string;
}

type ItemReceiptStatus = "pending" | "partial" | "received";

type PurchaseListStatus = "Active" | "Completed";

interface PurchaseList {
  id: number;
  name: string;
  notes: string;
  status: PurchaseListStatus;
  items: PurchaseListItem[];
  createdAt: string;
  updatedAt: string;
}

interface ClinicInventoryFields {
  quantity: string;
  minQuantity: string;
  location: string;
  preferredSupplier: string;
  purchasePrice: string;
  expiryDate: string;
  internalNote: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStatus(quantity: number, minQuantity: number): StockStatus {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= minQuantity) return "Low Stock";
  return "In Stock";
}

let nextActivityId = 100;
function makeActivity(
  product: string,
  type: ActivityType,
  change: number | null,
  previous: number | null,
  next: number | null,
  reason: string,
): ActivityEntry {
  return {
    id: nextActivityId++,
    dateTime: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    product,
    type,
    change,
    previous,
    next,
    reason,
    performedBy: "Dr. Smith",
  };
}

const EMPTY_CLINIC_FIELDS: ClinicInventoryFields = {
  quantity: "", minQuantity: "", location: "", preferredSupplier: "",
  purchasePrice: "", expiryDate: "", internalNote: "",
};

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_ITEMS: InventoryItem[] = [
  { id: 1, name: "Composite A2", brand: "3M", category: "Restorative", quantity: 18, minQuantity: 5, unit: "Box", location: "Cabinet 1 - Drawer 2", sku: "3M-CA2-001", barcode: "0350123456781", preferredSupplier: "Henry Schein", purchasePrice: "$24.50", expiryDate: "2026-12-31", internalNote: "", lastUpdated: "Jul 28" },
  { id: 2, name: "Nitrile Gloves — Medium", brand: "Medicom", category: "Disposables", quantity: 4, minQuantity: 5, unit: "Box", location: "Supply Room - Shelf 1", sku: "MED-GLV-M", barcode: "0628532000019", preferredSupplier: "Patterson Dental", purchasePrice: "$12.00", expiryDate: "", internalNote: "", lastUpdated: "Jul 28" },
  { id: 3, name: "Universal Adhesive", brand: "Kerr", category: "Restorative", quantity: 0, minQuantity: 2, unit: "Bottle", location: "Cabinet 2 - Drawer 1", sku: "KER-UA-010", barcode: "0076183100158", preferredSupplier: "Henry Schein", purchasePrice: "$38.00", expiryDate: "2025-09-30", internalNote: "", lastUpdated: "Jul 27" },
  { id: 4, name: "Syringe Needles 27G", brand: "Monoject", category: "Disposables", quantity: 12, minQuantity: 4, unit: "Box", location: "Cabinet 1 - Drawer 3", sku: "MON-27G-50", barcode: "4014837003404", preferredSupplier: "Benco Dental", purchasePrice: "$9.75", expiryDate: "", internalNote: "", lastUpdated: "Jul 27" },
  { id: 5, name: "Impression Material", brand: "3M", category: "Impression", quantity: 7, minQuantity: 8, unit: "Cartridge", location: "Cabinet 3 - Drawer 2", sku: "3M-IMP-007", barcode: "0350987654321", preferredSupplier: "Henry Schein", purchasePrice: "$55.00", expiryDate: "2026-06-30", internalNote: "Order in bulk", lastUpdated: "Jul 26" },
  { id: 6, name: "Gauze 2×2", brand: "Medicom", category: "Disposables", quantity: 24, minQuantity: 6, unit: "Pack", location: "Supply Room - Shelf 2", sku: "MED-GZ-22", barcode: "0628532000507", preferredSupplier: "Patterson Dental", purchasePrice: "$6.50", expiryDate: "", internalNote: "", lastUpdated: "Jul 26" },
  { id: 7, name: "Etchant Gel", brand: "Ultradent", category: "Restorative", quantity: 10, minQuantity: 3, unit: "Syringe", location: "Cabinet 2 - Drawer 3", sku: "ULT-ETG-10", barcode: "4002590200512", preferredSupplier: "Benco Dental", purchasePrice: "$18.00", expiryDate: "2026-03-31", internalNote: "", lastUpdated: "Jul 25" },
  { id: 8, name: "Cotton Rolls", brand: "Richmond Dental", category: "Disposables", quantity: 6, minQuantity: 10, unit: "Pack", location: "Supply Room - Shelf 3", sku: "RD-CTN-100", barcode: "8901234567890", preferredSupplier: "Henry Schein", purchasePrice: "$4.25", expiryDate: "", internalNote: "", lastUpdated: "Jul 25" },
];

const INITIAL_ACTIVITY: ActivityEntry[] = [
  { id: 1, dateTime: "Jul 28, 10:30 AM", product: "Composite A2", type: "Increase", change: 10, previous: 8, next: 18, reason: "New stock received", performedBy: "Dr. Smith" },
  { id: 2, dateTime: "Jul 28, 9:15 AM", product: "Nitrile Gloves — Medium", type: "Decrease", change: -3, previous: 7, next: 4, reason: "Product used", performedBy: "Dr. Smith" },
  { id: 3, dateTime: "Jul 27, 4:40 PM", product: "Universal Adhesive", type: "Set Quantity", change: null, previous: 3, next: 0, reason: "Physical stock count correction", performedBy: "Dr. Smith" },
  { id: 4, dateTime: "Jul 27, 2:10 PM", product: "Syringe Needles 27G", type: "Increase", change: 6, previous: 6, next: 12, reason: "New stock received", performedBy: "Dr. Smith" },
  { id: 5, dateTime: "Jul 26, 11:05 AM", product: "Impression Material", type: "Decrease", change: -2, previous: 9, next: 7, reason: "Damaged or expired", performedBy: "Dr. Smith" },
  { id: 6, dateTime: "Jul 26, 8:45 AM", product: "Gauze 2×2", type: "Increase", change: 12, previous: 12, next: 24, reason: "New stock received", performedBy: "Dr. Smith" },
  { id: 7, dateTime: "Jul 25, 3:30 PM", product: "Etchant Gel", type: "Set Quantity", change: null, previous: 11, next: 10, reason: "Physical stock count correction", performedBy: "Dr. Smith" },
  { id: 8, dateTime: "Jul 25, 10:20 AM", product: "Cotton Rolls", type: "Decrease", change: -4, previous: 10, next: 6, reason: "Product used", performedBy: "Dr. Smith" },
  { id: 9, dateTime: "Jul 24, 9:00 AM", product: "Composite A2", type: "Item Added", change: null, previous: null, next: 8, reason: "Initial inventory setup", performedBy: "Dr. Smith" },
];

const INITIAL_PURCHASE_LISTS: PurchaseList[] = [
  {
    id: 1, name: "July Restock", notes: "Monthly restocking of core clinical supplies.", status: "Active",
    createdAt: "Jul 1, 2025", updatedAt: "Jul 8, 2025, 9:40 AM",
    items: [
      { id: 101, name: "Universal Adhesive", brand: "Kerr", quantity: 4, receivedQuantity: 0, unit: "Bottle" },
      { id: 102, name: "Composite A2", brand: "3M", quantity: 6, receivedQuantity: 0, unit: "Box" },
      { id: 103, name: "Etchant Gel", brand: "Ultradent", quantity: 3, receivedQuantity: 0, unit: "Syringe" },
      { id: 104, name: "Impression Material", brand: "3M", quantity: 4, receivedQuantity: 0, unit: "Cartridge" },
      { id: 105, name: "Cotton Rolls", brand: "Richmond Dental", quantity: 10, receivedQuantity: 0, unit: "Pack" },
    ],
  },
  {
    id: 2, name: "Operatory Supplies", notes: "Restocking high-turnover operatory items.", status: "Active",
    createdAt: "Jun 28, 2025", updatedAt: "Jul 4, 2025, 8:15 AM",
    items: [
      { id: 201, name: "Nitrile Gloves — Medium", brand: "Medicom", quantity: 10, receivedQuantity: 10, unit: "Box" },
      { id: 202, name: "Gauze 2×2", brand: "Medicom", quantity: 8, receivedQuantity: 8, unit: "Pack" },
      { id: 203, name: "Syringe Needles 27G", brand: "Monoject", quantity: 6, receivedQuantity: 6, unit: "Box" },
      { id: 204, name: "Saliva Ejectors", brand: "Medicom", quantity: 5, receivedQuantity: 5, unit: "Bag" },
      { id: 205, name: "Dental Bibs", brand: "Medicom", quantity: 3, receivedQuantity: 0, unit: "Pack" },
      { id: 206, name: "Prophy Angles", brand: "Dentsply", quantity: 2, receivedQuantity: 0, unit: "Box" },
      { id: 207, name: "Articulating Paper", brand: "Bausch", quantity: 4, receivedQuantity: 2, unit: "Pack" },
      { id: 208, name: "Mixing Tips — Blue", brand: "Kettenbach", quantity: 2, receivedQuantity: 0, unit: "Box" },
      { id: 209, name: "Cotton Rolls", brand: "Richmond Dental", quantity: 5, receivedQuantity: 0, unit: "Pack" },
      { id: 210, name: "Fluoride Varnish", brand: "3M", quantity: 3, receivedQuantity: 0, unit: "Box" },
    ],
  },
  {
    id: 3, name: "PPE & Disposables", notes: "Identify PPE and disposable order requirements.", status: "Active",
    createdAt: "Jun 30, 2025", updatedAt: "Jun 30, 2025, 4:09 PM",
    items: [
      { id: 301, name: "Nitrile Gloves — Small", brand: "Medicom", quantity: 5, receivedQuantity: 0, unit: "Box" },
      { id: 302, name: "Nitrile Gloves — Large", brand: "Medicom", quantity: 5, receivedQuantity: 0, unit: "Box" },
      { id: 303, name: "Surgical Masks", brand: "Medicom", quantity: 10, receivedQuantity: 0, unit: "Box" },
      { id: 304, name: "Face Shields", brand: "3M", quantity: 4, receivedQuantity: 0, unit: "Pack" },
      { id: 305, name: "Protective Eyewear", brand: "Generic", quantity: 6, receivedQuantity: 0, unit: "Piece" },
    ],
  },
  {
    id: 4, name: "Endodontic Supplies", notes: "Files, obturation, and irrigation supplies.", status: "Active",
    createdAt: "Jun 26, 2025", updatedAt: "Jun 29, 2025, 9:22 AM",
    items: [
      { id: 401, name: "K-Files #15", brand: "Dentsply", quantity: 6, receivedQuantity: 6, unit: "Pack" },
      { id: 402, name: "K-Files #20", brand: "Dentsply", quantity: 6, receivedQuantity: 6, unit: "Pack" },
      { id: 403, name: "Gutta-Percha Points", brand: "Dentsply", quantity: 3, receivedQuantity: 3, unit: "Box" },
      { id: 404, name: "Sodium Hypochlorite", brand: "Generic", quantity: 4, receivedQuantity: 4, unit: "Bottle" },
      { id: 405, name: "EDTA Solution", brand: "Ultradent", quantity: 2, receivedQuantity: 2, unit: "Bottle" },
      { id: 406, name: "Irrigation Syringes", brand: "Monoject", quantity: 3, receivedQuantity: 0, unit: "Box" },
      { id: 407, name: "Sealer AH Plus", brand: "Dentsply", quantity: 2, receivedQuantity: 0, unit: "Kit" },
      { id: 408, name: "Rotary Files", brand: "ProTaper", quantity: 4, receivedQuantity: 0, unit: "Pack" },
    ],
  },
  {
    id: 5, name: "Front Desk Essentials", notes: "Office supplies and patient forms.", status: "Active",
    createdAt: "Jun 26, 2025", updatedAt: "Jun 26, 2025, 2:58 PM",
    items: [
      { id: 501, name: "Patient Forms (A4)", brand: "Generic", quantity: 500, receivedQuantity: 0, unit: "Sheet" },
      { id: 502, name: "Appointment Cards", brand: "Generic", quantity: 200, receivedQuantity: 0, unit: "Pack" },
      { id: 503, name: "Pens (Blue)", brand: "Bic", quantity: 5, receivedQuantity: 0, unit: "Box" },
      { id: 504, name: "Printer Paper", brand: "Generic", quantity: 10, receivedQuantity: 0, unit: "Pack" },
      { id: 505, name: "Receipt Roll", brand: "Generic", quantity: 12, receivedQuantity: 0, unit: "Roll" },
      { id: 506, name: "Rubber Stamps", brand: "Generic", quantity: 2, receivedQuantity: 0, unit: "Piece" },
    ],
  },
  {
    id: 6, name: "Impression Materials", notes: "Alginate, VPS, and accessories.", status: "Active",
    createdAt: "Jun 27, 2025", updatedAt: "Jun 27, 2025, 9:47 AM",
    items: [
      { id: 601, name: "Alginate Impression", brand: "Dentsply", quantity: 4, receivedQuantity: 4, unit: "Pack" },
      { id: 602, name: "VPS Light Body", brand: "3M", quantity: 2, receivedQuantity: 2, unit: "Cartridge" },
      { id: 603, name: "VPS Heavy Body", brand: "3M", quantity: 2, receivedQuantity: 2, unit: "Cartridge" },
      { id: 604, name: "Impression Trays — Small", brand: "Dentsply", quantity: 10, receivedQuantity: 10, unit: "Pack" },
      { id: 605, name: "Impression Trays — Medium", brand: "Dentsply", quantity: 10, receivedQuantity: 10, unit: "Pack" },
      { id: 606, name: "Mixing Tips — Blue", brand: "Kettenbach", quantity: 3, receivedQuantity: 0, unit: "Box" },
      { id: 607, name: "Tray Adhesive", brand: "3M", quantity: 2, receivedQuantity: 1, unit: "Bottle" },
      { id: 608, name: "Bowl & Spatula Set", brand: "Generic", quantity: 2, receivedQuantity: 0, unit: "Set" },
      { id: 609, name: "Bite Registration", brand: "Kerr", quantity: 3, receivedQuantity: 0, unit: "Cartridge" },
    ],
  },
  // Completed lists
  {
    id: 7, name: "June Monthly Order", notes: "Regular June supply restock.", status: "Completed",
    createdAt: "Jun 1, 2025", updatedAt: "Jun 15, 2025, 10:30 AM",
    items: [
      { id: 701, name: "Composite A2", brand: "3M", quantity: 4, receivedQuantity: 4, unit: "Box" },
      { id: 702, name: "Nitrile Gloves — Medium", brand: "Medicom", quantity: 8, receivedQuantity: 8, unit: "Box" },
      { id: 703, name: "Gauze 2×2", brand: "Medicom", quantity: 6, receivedQuantity: 6, unit: "Pack" },
    ],
  },
  {
    id: 8, name: "Q2 Restorative Restock", notes: "Quarterly restorative materials order.", status: "Completed",
    createdAt: "Apr 2, 2025", updatedAt: "Apr 18, 2025, 2:15 PM",
    items: [
      { id: 801, name: "Universal Adhesive", brand: "Kerr", quantity: 6, receivedQuantity: 6, unit: "Bottle" },
      { id: 802, name: "Composite B1", brand: "Ivoclar", quantity: 4, receivedQuantity: 4, unit: "Box" },
      { id: 803, name: "Etchant Gel", brand: "Ultradent", quantity: 5, receivedQuantity: 5, unit: "Syringe" },
      { id: 804, name: "Bonding Agent", brand: "Kerr", quantity: 3, receivedQuantity: 3, unit: "Bottle" },
    ],
  },
];

const CATALOG_PRODUCTS: CatalogProduct[] = [
  { id: 101, name: "Prophy Paste — Mint", brand: "Dentsply", category: "Prophylaxis", sku: "DEN-PP-MNT", barcode: "0350123456789", specification: "200g jar, mint flavour, medium grit" },
  { id: 102, name: "Fluoride Varnish", brand: "3M", category: "Preventive", sku: "3M-FV-005", barcode: "0350987654322", specification: "5% NaF, unit dose, 0.4mL per dose" },
  { id: 103, name: "Dental Floss Picks", brand: "Sunstar", category: "Disposables", sku: "SUN-FP-100", barcode: "4901616300019", specification: "Pack of 100, nylon floss, single-use" },
  { id: 104, name: "Articulating Paper", brand: "Bausch", category: "Diagnostic", sku: "BAU-AP-40", barcode: "4014837003405", specification: "40μm thickness, blue/red, 200 sheets" },
  { id: 105, name: "Alginate Impression", brand: "Dentsply", category: "Impression", sku: "DEN-ALG-500", barcode: "0350564738291", specification: "500g, regular-set, dust-free" },
  { id: 106, name: "Composite B1", brand: "Ivoclar", category: "Restorative", sku: "IVO-CB1-002", barcode: "0762325900023", specification: "Nanohybrid, shade B1, 4g syringe" },
  { id: 107, name: "Bonding Agent", brand: "Kerr", category: "Restorative", sku: "KER-BA-015", barcode: "0076183100159", specification: "Universal, 5th generation, 6mL bottle" },
  { id: 108, name: "Dental Bibs", brand: "Medicom", category: "Disposables", sku: "MED-BIB-500", barcode: "0628532000508", specification: "500 pcs/case, 3-ply, 13×18 in" },
  // Same SKU as an existing item to test duplicate detection
  { id: 109, name: "Composite A2", brand: "3M", category: "Restorative", sku: "3M-CA2-001", barcode: "0350123456781", specification: "Nanohybrid, shade A2, 4g syringe" },
];

const CATEGORIES = ["All Categories", "Restorative", "Disposables", "Impression", "Prophylaxis", "Preventive", "Diagnostic", "Accessories"];
const UNITS = ["Box", "Bottle", "Pack", "Syringe", "Cartridge", "Tube", "Bag", "Piece", "Roll", "Vial"];
const ADJUST_REASONS = ["New stock received", "Product used", "Damaged or expired", "Physical stock count correction", "Data correction", "Other"];
const ACTIVITY_TYPES: ActivityType[] = ["Increase", "Decrease", "Set Quantity", "Item Added", "Item Edited", "Item Removed", "Import Adjustment"];

// ─── Small reusable components ────────────────────────────────────────────────

function StatusBadge({ status }: { status: StockStatus }) {
  const s: Record<StockStatus, string> = {
    "In Stock": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Low Stock": "bg-amber-50 text-amber-700 border-amber-200",
    "Out of Stock": "bg-red-50 text-red-700 border-red-200",
  };
  const dot: Record<StockStatus, string> = {
    "In Stock": "bg-emerald-500", "Low Stock": "bg-amber-500", "Out of Stock": "bg-red-500",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot[status]}`} />
      {status}
    </span>
  );
}

function ActivityTypeBadge({ type }: { type: ActivityType }) {
  const s: Record<ActivityType, string> = {
    Increase: "bg-emerald-50 text-emerald-700",
    Decrease: "bg-red-50 text-red-700",
    "Set Quantity": "bg-blue-50 text-blue-700",
    "Item Added": "bg-teal-50 text-teal-700",
    "Item Edited": "bg-purple-50 text-purple-700",
    "Item Removed": "bg-gray-100 text-gray-600",
    "Import Adjustment": "bg-indigo-50 text-indigo-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${s[type]}`}>{type}</span>;
}

function ProductAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const colors = ["bg-blue-100 text-blue-600", "bg-purple-100 text-purple-600", "bg-teal-100 text-teal-600", "bg-orange-100 text-orange-600", "bg-pink-100 text-pink-600"];
  const c = colors[name.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : size === "lg" ? "w-14 h-14 text-lg" : "w-9 h-9 text-xs";
  return <div className={`rounded-xl flex items-center justify-center font-semibold flex-shrink-0 ${c} ${sz}`}>{initials}</div>;
}

function FilterChip({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-[#F2F5FF] text-[#4F6FD8] rounded-full text-xs font-medium">
      <span className="text-[#4F6FD8]/60">{label}:</span>
      {value}
      <button onClick={onRemove} className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#4F6FD8]/10 transition-colors">
        <X size={10} />
      </button>
    </span>
  );
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cb]);
}

function SelectDropdown({
  value, options, onChange, icon, placeholder, className = "",
}: {
  value: string; options: string[]; onChange: (v: string) => void;
  icon?: React.ReactNode; placeholder?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));
  const display = value || placeholder || options[0];
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 transition-colors w-full"
      >
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className={`flex-1 text-left truncate ${!value && placeholder ? "text-gray-400" : ""}`}>{display}</span>
        <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 min-w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${opt === value ? "text-[#4F6FD8] font-medium" : "text-gray-700"}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", readOnly, error }: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  type?: string; readOnly?: boolean; error?: boolean;
}) {
  return (
    <input type={type} value={value} readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none ${
        readOnly ? "bg-gray-50 border-gray-100 text-gray-600 cursor-default"
          : error ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
          : "bg-white border-gray-200 focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10"
      }`}
    />
  );
}

function Pagination({ total, page, perPage, onPage }: {
  total: number; page: number; perPage: number; onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-500">Showing {from}–{to} of {total} items</span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button disabled={safePage === 1} onClick={() => onPage(safePage - 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 transition-colors">
            <ChevronLeft size={12} /> Previous
          </button>
          <span className="text-xs text-gray-500">Page {safePage} of {totalPages}</span>
          <button disabled={safePage === totalPages} onClick={() => onPage(safePage + 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-gray-50 transition-colors font-medium">
            Next <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ChevronUp size={12} className="text-[#4F6FD8]" />;
  if (dir === "desc") return <ChevronDown size={12} className="text-[#4F6FD8]" />;
  return <ChevronsUpDown size={12} className="text-gray-300" />;
}

// ─── ClinicInventoryForm ──────────────────────────────────────────────────────

function ClinicInventoryForm({ fields, onChange, errors = {}, readOnlyQuantity = false }: {
  fields: ClinicInventoryFields;
  onChange: (f: ClinicInventoryFields) => void;
  errors?: Partial<Record<keyof ClinicInventoryFields, string>>;
  readOnlyQuantity?: boolean;
}) {
  const set = (k: keyof ClinicInventoryFields) => (v: string) => onChange({ ...fields, [k]: v });
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Inventory Settings</h3>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Current Quantity" required={!readOnlyQuantity} error={errors.quantity}>
          {readOnlyQuantity ? (
            <div className="flex items-center gap-2">
              <TextInput value={fields.quantity} readOnly />
              <p className="text-xs text-gray-400 whitespace-nowrap">Use Adjust Stock</p>
            </div>
          ) : (
            <TextInput type="number" value={fields.quantity} onChange={set("quantity")} placeholder="0" error={!!errors.quantity} />
          )}
        </FormField>
        <FormField label="Minimum Quantity" hint="Low stock alert threshold" error={errors.minQuantity}>
          <TextInput type="number" value={fields.minQuantity} onChange={set("minQuantity")} placeholder="0" error={!!errors.minQuantity} />
        </FormField>
      </div>
      <FormField label="Storage Location">
        <TextInput value={fields.location} onChange={set("location")} placeholder="e.g. Cabinet 1 - Drawer 2" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Preferred Supplier">
          <TextInput value={fields.preferredSupplier} onChange={set("preferredSupplier")} placeholder="e.g. Henry Schein" />
        </FormField>
        <FormField label="Purchase Price">
          <TextInput value={fields.purchasePrice} onChange={set("purchasePrice")} placeholder="e.g. $12.50" />
        </FormField>
      </div>
      <FormField label="Expiry Date">
        <TextInput type="date" value={fields.expiryDate} onChange={set("expiryDate")} />
      </FormField>
      <FormField label="Internal Note">
        <textarea value={fields.internalNote} onChange={(e) => set("internalNote")(e.target.value)}
          placeholder="Any notes visible only to your clinic..." rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 transition-all resize-none" />
      </FormField>
    </div>
  );
}

// ─── AdjustQuantityModal ──────────────────────────────────────────────────────

type AdjustMode = "Increase" | "Decrease" | "Set Quantity";

function AdjustQuantityModal({ item, onClose, onSave }: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (item: InventoryItem, newQty: number, mode: AdjustMode, reason: string, note: string) => void;
}) {
  const [mode, setMode] = useState<AdjustMode>("Increase");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const numVal = parseInt(value, 10);
  const preview = (): number | null => {
    if (isNaN(numVal)) return null;
    if (mode === "Increase") return item.quantity + numVal;
    if (mode === "Decrease") return item.quantity - numVal;
    return numVal;
  };
  const previewQty = preview();

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!value || isNaN(numVal)) { e.value = "Quantity is required"; }
    else if (!Number.isInteger(numVal)) { e.value = "Must be a whole number"; }
    else if (numVal > 99999) { e.value = "Value seems unrealistically large"; }
    else if (mode === "Increase" && numVal <= 0) { e.value = "Must be greater than 0"; }
    else if (mode === "Decrease") {
      if (numVal <= 0) { e.value = "Must be greater than 0"; }
      else if (item.quantity - numVal < 0) { e.value = `Cannot decrease below 0 (current: ${item.quantity})`; }
    } else if (mode === "Set Quantity") {
      if (numVal < 0) { e.value = "Cannot be negative"; }
    }
    if (!reason) { e.reason = "Reason is required"; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(item, previewQty!, mode, reason, note);
    onClose();
  };

  const modeBtn = (m: AdjustMode, label: string, icon: React.ReactNode) => (
    <button onClick={() => { setMode(m); setValue(""); setErrors({}); }}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
        mode === m ? "bg-[#4F6FD8] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
      {icon}{label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Adjust Stock</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Item summary */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <ProductAvatar name={item.name} />
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">{item.brand} · Current quantity: <strong>{item.quantity}</strong> {item.unit}</p>
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {modeBtn("Increase", "Increase", <ArrowUpCircle size={14} />)}
            {modeBtn("Decrease", "Decrease", <ArrowDownCircle size={14} />)}
            {modeBtn("Set Quantity", "Set", <Hash size={14} />)}
          </div>

          {/* Quantity input */}
          <FormField label={mode === "Set Quantity" ? "New Quantity" : `Amount to ${mode}`} required error={errors.value}>
            <TextInput type="number" value={value} onChange={(v) => { setValue(v); setErrors({}); }}
              placeholder="0" error={!!errors.value} />
          </FormField>

          {/* Preview */}
          {previewQty !== null && !errors.value && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm ${
              previewQty < 0 ? "bg-red-50 border border-red-100" : "bg-[#F2F5FF] border border-[#4F6FD8]/10"}`}>
              <span className="text-gray-600">New quantity will be</span>
              <span className={`font-bold text-base ${previewQty < 0 ? "text-red-600" : "text-[#4F6FD8]"}`}>{previewQty} {item.unit}</span>
            </div>
          )}

          {/* Reason */}
          <FormField label="Adjustment Reason" required error={errors.reason}>
            <SelectDropdown value={reason} options={ADJUST_REASONS} onChange={(v) => { setReason(v); setErrors((e) => ({ ...e, reason: "" })); }}
              placeholder="Select a reason" />
          </FormField>

          {/* Note */}
          <FormField label="Optional Note">
            <TextInput value={note} onChange={setNote} placeholder="Additional details..." />
          </FormField>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#4F6FD8] text-white rounded-lg hover:bg-[#3F5FC2] transition-colors font-medium">Save Adjustment</button>
        </div>
      </div>
    </div>
  );
}

// ─── EditInventoryModal ───────────────────────────────────────────────────────

function EditInventoryModal({ item, onClose, onSave }: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (updated: Partial<InventoryItem>) => void;
}) {
  const [fields, setFields] = useState<ClinicInventoryFields>({
    quantity: String(item.quantity),
    minQuantity: String(item.minQuantity),
    location: item.location,
    preferredSupplier: item.preferredSupplier,
    purchasePrice: item.purchasePrice,
    expiryDate: item.expiryDate,
    internalNote: item.internalNote,
  });

  const handleSave = () => {
    onSave({
      minQuantity: parseInt(fields.minQuantity) || 0,
      location: fields.location,
      preferredSupplier: fields.preferredSupplier,
      purchasePrice: fields.purchasePrice,
      expiryDate: fields.expiryDate,
      internalNote: fields.internalNote,
    });
    onClose();
  };

  const readOnly = [
    ["Product Name", item.name], ["Brand", item.brand], ["Category", item.category],
    ["SKU", item.sku], ["Barcode", item.barcode], ["Standard Unit", item.unit],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Inventory Information</h2>
            <p className="text-sm text-gray-500 mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Read-only product identity */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product Information — Read Only</h3>
            <div className="grid grid-cols-2 gap-3">
              {readOnly.map(([label, value]) => (
                <FormField key={label} label={label}>
                  <TextInput value={value} readOnly />
                </FormField>
              ))}
            </div>
          </div>
          {/* Editable clinic fields */}
          <ClinicInventoryForm
            fields={{ ...fields, quantity: String(item.quantity) }}
            onChange={(f) => setFields({ ...f, quantity: String(item.quantity) })}
            readOnlyQuantity
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#4F6FD8] text-white rounded-lg hover:bg-[#3F5FC2] transition-colors font-medium">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── AddToPurchaseListModal ───────────────────────────────────────────────────

function AddToPurchaseListModal({ targets, purchaseLists, onClose, onSave }: {
  targets: InventoryItem[];
  purchaseLists: PurchaseList[];
  onClose: () => void;
  onSave: (listIds: number[], quantities: number[], newListName?: string) => void;
}) {
  type Step = "select-list" | "set-quantity";
  const [step, setStep] = useState<Step>("select-list");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  // quantities keyed by target index
  const [quantities, setQuantities] = useState<Record<number, string>>(
    Object.fromEntries(targets.map((_, i) => [i, "1"]))
  );
  const activeLists = purchaseLists.filter((l) => l.status === "Active");

  const toggle = (id: number) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleCreateList = () => {
    if (!newName.trim()) return;
    setCreating(false);
    // auto-select the new list name via a sentinel — resolved in parent
    setStep("set-quantity");
  };

  const handleNext = () => {
    if (selected.size === 0 && !creating) return;
    setStep("set-quantity");
  };

  const handleBack = () => setStep("select-list");

  const handleSave = () => {
    const qtys = targets.map((_, i) => Math.max(1, parseInt(quantities[i] || "1", 10) || 1));
    if (creating && newName.trim()) {
      onSave(Array.from(selected), qtys, newName.trim());
    } else {
      onSave(Array.from(selected), qtys);
    }
    onClose();
  };

  const label = targets.length === 1 ? targets[0].name : `${targets.length} items`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add to Purchase List</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{label}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        {step === "select-list" ? (
          <>
            <div className="px-6 py-4 space-y-2 max-h-72 overflow-y-auto">
              {activeLists.length === 0 && !creating && (
                <div className="text-center py-8 text-gray-400">
                  <ListPlus size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium text-gray-500">No active purchase lists</p>
                </div>
              )}
              {activeLists.map((list) => {
                const alreadyIn = list.items.some((li) => targets.some((t) => t.name === li.name));
                return (
                  <label key={list.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selected.has(list.id) ? "bg-[#F2F5FF]" : "hover:bg-gray-50"}`}>
                    <input type="checkbox" checked={selected.has(list.id)} onChange={() => toggle(list.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#4F6FD8] focus:ring-[#4F6FD8]/30" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{list.name}</p>
                      <p className="text-xs text-gray-400">{list.items.length} items</p>
                    </div>
                    {alreadyIn && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">Already added</span>
                    )}
                  </label>
                );
              })}
              {creating ? (
                <div className="flex gap-2 pt-1">
                  <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="New list name..."
                    onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10" />
                  <button onClick={handleCreateList} className="px-3 py-2 bg-[#4F6FD8] text-white rounded-lg text-sm font-medium hover:bg-[#3F5FC2] transition-colors">OK</button>
                  <button onClick={() => setCreating(false)} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm transition-colors">✕</button>
                </div>
              ) : (
                <button onClick={() => setCreating(true)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[#4F6FD8] hover:bg-[#F2F5FF] rounded-xl transition-colors">
                  <Plus size={15} /> Create New Purchase List
                </button>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleNext} disabled={selected.size === 0 && !(creating && newName.trim())}
                className="px-4 py-2 text-sm bg-[#4F6FD8] text-white rounded-lg hover:bg-[#3F5FC2] disabled:opacity-40 transition-colors font-medium flex items-center gap-1.5">
                Next <ChevronRight size={15} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2 — set quantities */}
            <div className="px-6 py-4 space-y-3 max-h-72 overflow-y-auto">
              <p className="text-xs text-gray-500">Set the requested quantity for each item.</p>
              {targets.map((t, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <ProductAvatar name={t.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.brand}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number" min="1"
                      value={quantities[i]}
                      onChange={(e) => setQuantities((q) => ({ ...q, [i]: e.target.value }))}
                      className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10"
                    />
                    <span className="text-xs text-gray-400">{t.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-between">
              <button onClick={handleBack} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5">
                <ChevronLeft size={15} /> Back
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 text-sm bg-[#4F6FD8] text-white rounded-lg hover:bg-[#3F5FC2] transition-colors font-medium">
                Add to {selected.size > 0 ? (selected.size + " List" + (selected.size > 1 ? "s" : "")) : creating ? "New List" : "List"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── RemoveConfirmModal ───────────────────────────────────────────────────────

function RemoveConfirmModal({ item, onClose, onConfirm }: {
  item: InventoryItem; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove from Inventory?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            <strong className="text-gray-800">{item.name}</strong> will be removed from your active inventory. Historical activity records will be kept. This does not delete the product from the Product Library.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium border border-gray-200">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium">
            Remove Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AddInventoryModal ────────────────────────────────────────────────────────

type AddTab = "search" | "manual";

function AddInventoryModal({ existingSkus, onClose, onAdd, onAdjust }: {
  existingSkus: Set<string>;
  onClose: () => void;
  onAdd: (name: string, fields: ClinicInventoryFields) => void;
  onAdjust: (sku: string) => void;
}) {
  const [tab, setTab] = useState<AddTab>("search");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [clinicFields, setClinicFields] = useState<ClinicInventoryFields>(EMPTY_CLINIC_FIELDS);
  const [clinicErrors, setClinicErrors] = useState<Partial<Record<keyof ClinicInventoryFields, string>>>({});

  // Manual entry
  const [manualFields, setManualFields] = useState({
    name: "", brand: "", category: "", sku: "", barcode: "", specification: "",
  });

  const filtered = CATALOG_PRODUCTS.filter((p) => {
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  const isAlreadyInInventory = selectedProduct ? existingSkus.has(selectedProduct.sku) : false;

  const validate = (): boolean => {
    const e: Partial<Record<keyof ClinicInventoryFields, string>> = {};
    if (!clinicFields.quantity) e.quantity = "Required";
    else if (isNaN(parseInt(clinicFields.quantity))) e.quantity = "Must be a number";
    setClinicErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const name = tab === "manual" ? manualFields.name : selectedProduct!.name;
    onAdd(name, clinicFields);
    onClose();
  };

  const hasRightPanel = (tab === "search" && selectedProduct !== null) || tab === "manual";

  const tabBtn = (t: AddTab, label: string) => (
    <button onClick={() => { setTab(t); setSelectedProduct(null); setClinicFields(EMPTY_CLINIC_FIELDS); }}
      className={`px-4 py-2.5 text-sm font-medium relative transition-colors ${
        tab === t ? "text-[#4F6FD8]" : "text-gray-500 hover:text-gray-700"}`}>
      {label}
      {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F6FD8] rounded-full" />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl flex mx-4 overflow-hidden transition-all duration-300 ${hasRightPanel ? "max-w-3xl w-full" : "max-w-xl w-full"}`}
        style={{ maxHeight: "88vh" }}>
        <div className="flex flex-1 min-h-0">

          {/* Left: Search Library or hidden when Manual */}
          {tab === "search" && (
            <div className="flex flex-col min-h-0 flex-1">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Add Inventory Item</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Search the product catalog or enter manually</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"><X size={18} /></button>
              </div>
              <div className="flex border-b border-gray-100 px-6 mt-2 flex-shrink-0">
                {tabBtn("search", "Search Library")}
                {tabBtn("manual", "Manual Entry")}
              </div>
              {/* Search */}
              <div className="px-6 py-3 border-b border-gray-50 flex-shrink-0">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input autoFocus type="text" placeholder="Product name, SKU, or barcode..."
                      value={query} onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10" />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                    <Scan size={14} /> Scan
                  </button>
                </div>
              </div>
              {/* Product list */}
              <div className="flex-1 overflow-y-auto px-6 py-2">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Package size={32} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium text-gray-500">No products found</p>
                    <p className="text-xs mt-1 mb-5 text-gray-400">"{query}" is not in the Product Library</p>
                    <button onClick={() => setTab("manual")}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#4F6FD8] border border-[#4F6FD8]/30 rounded-lg hover:bg-[#4F6FD8]/5 transition-colors">
                      <Plus size={14} /> Add Product Manually
                    </button>
                  </div>
                ) : (
                  <div className="space-y-0.5 py-1">
                    {filtered.map((p) => {
                      const isSelected = selectedProduct?.id === p.id;
                      return (
                        <button key={p.id} onClick={() => { setSelectedProduct(p); setClinicFields(EMPTY_CLINIC_FIELDS); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group ${isSelected ? "bg-[#F2F5FF]" : "hover:bg-gray-50"}`}>
                          <ProductAvatar name={p.name} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isSelected ? "text-[#4F6FD8]" : "text-gray-900"}`}>{p.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{p.brand} · {p.category} · <span className="font-mono">{p.sku}</span></p>
                          </div>
                          <ChevronRight size={14} className={`flex-shrink-0 ${isSelected ? "text-[#4F6FD8]" : "text-gray-200 group-hover:text-gray-400"}`} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
                <p className="text-xs text-gray-400">{filtered.length} product{filtered.length !== 1 ? "s" : ""} in catalog</p>
              </div>
            </div>
          )}

          {/* Manual Entry — full width */}
          {tab === "manual" && (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Add Inventory Item</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Enter details for a product not in the library</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"><X size={18} /></button>
              </div>
              <div className="flex border-b border-gray-100 px-6 mt-2 flex-shrink-0">
                {tabBtn("search", "Search Library")}
                {tabBtn("manual", "Manual Entry")}
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
                  <FileText size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Manually entered products may require future standardisation. They will not appear in the shared Product Library.</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product Information</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Product Name" required>
                        <TextInput value={manualFields.name} onChange={(v) => setManualFields((f) => ({ ...f, name: v }))} placeholder="e.g. Composite A2" />
                      </FormField>
                      <FormField label="Brand" required>
                        <TextInput value={manualFields.brand} onChange={(v) => setManualFields((f) => ({ ...f, brand: v }))} placeholder="e.g. 3M" />
                      </FormField>
                    </div>
                    <FormField label="Category">
                      <SelectDropdown value={manualFields.category} options={CATEGORIES.slice(1)} onChange={(v) => setManualFields((f) => ({ ...f, category: v }))} placeholder="Select category" />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="SKU">
                        <TextInput value={manualFields.sku} onChange={(v) => setManualFields((f) => ({ ...f, sku: v }))} placeholder="e.g. 3M-CA2-001" />
                      </FormField>
                      <FormField label="Barcode">
                        <TextInput value={manualFields.barcode} onChange={(v) => setManualFields((f) => ({ ...f, barcode: v }))} placeholder="e.g. 0350123456789" />
                      </FormField>
                    </div>
                    <FormField label="Specification">
                      <TextInput value={manualFields.specification} onChange={(v) => setManualFields((f) => ({ ...f, specification: v }))} placeholder="Size, material, pack size..." />
                    </FormField>
                  </div>
                </div>
                <ClinicInventoryForm fields={clinicFields} onChange={setClinicFields} errors={clinicErrors} />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end flex-shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleAdd} className="px-4 py-2 text-sm bg-[#4F6FD8] text-white rounded-lg hover:bg-[#3F5FC2] transition-colors font-medium">Add to Inventory</button>
              </div>
            </div>
          )}

          {/* Right panel: catalog product detail + inventory settings */}
          {tab === "search" && selectedProduct && (
            <div className="w-80 flex-shrink-0 border-l border-gray-100 flex flex-col bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
                <ProductAvatar name={selectedProduct.name} size="sm" />
                <span className="text-sm font-semibold text-gray-900 truncate flex-1">{selectedProduct.name}</span>
                <button onClick={() => setSelectedProduct(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0"><X size={14} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Duplicate warning */}
                {isAlreadyInInventory && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle size={14} />
                      <p className="text-xs font-semibold">Already in your inventory</p>
                    </div>
                    <p className="text-xs text-amber-600">This product already exists. Adding it again would create a duplicate.</p>
                    <button onClick={() => { onAdjust(selectedProduct.sku); onClose(); }}
                      className="text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-800 transition-colors">
                      Adjust Stock Instead →
                    </button>
                  </div>
                )}
                {/* Product image placeholder */}
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-gray-300">
                  <Package size={24} /><span className="text-xs mt-1">No image</span>
                </div>
                {/* Product info read-only */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Information</h3>
                  {[
                    ["Product Name", selectedProduct.name],
                    ["Brand", selectedProduct.brand],
                    ["Category", selectedProduct.category],
                    ["SKU", selectedProduct.sku],
                    ["Barcode", selectedProduct.barcode],
                    ["Specification", selectedProduct.specification],
                  ].map(([label, value]) => (
                    <FormField key={label} label={label}>
                      <TextInput value={value} readOnly />
                    </FormField>
                  ))}
                </div>
                {!isAlreadyInInventory && (
                  <ClinicInventoryForm fields={clinicFields} onChange={setClinicFields} errors={clinicErrors} />
                )}
              </div>
              {!isAlreadyInInventory && (
                <div className="px-5 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                  <button onClick={() => setSelectedProduct(null)} className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">Cancel</button>
                  <button onClick={handleAdd} className="flex-1 py-2 text-sm bg-[#4F6FD8] text-white rounded-lg hover:bg-[#3F5FC2] transition-colors font-medium">Add to Inventory</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ItemDetailsDrawer ────────────────────────────────────────────────────────

function ItemDetailsDrawer({ item, onClose, onAdjust, onEdit, onPurchase, onRemove, onViewActivity }: {
  item: InventoryItem;
  onClose: () => void;
  onAdjust: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onPurchase: (items: InventoryItem[]) => void;
  onRemove: (item: InventoryItem) => void;
  onViewActivity: (productName: string) => void;
}) {
  const status = computeStatus(item.quantity, item.minQuantity);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <ProductAvatar name={item.name} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
            <p className="text-xs text-gray-400">{item.brand} · {item.category}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Product image */}
          <div className="px-5 pt-4">
            <div className="w-full aspect-[3/2] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-300">
              <div className="flex flex-col items-center gap-1"><Package size={28} /><span className="text-xs">No image</span></div>
            </div>
          </div>

          {/* Product Info */}
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product Information</h3>
            <div className="space-y-2">
              {[
                ["SKU", item.sku],
                ["Barcode", item.barcode],
                ["Unit", item.unit],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400">{l}</span>
                  <span className="text-xs font-medium text-gray-700 font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clinic Inventory Info */}
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inventory Information</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-400">Current Quantity</span>
                <span className="text-sm font-bold text-gray-900">{item.quantity} <span className="text-xs font-normal text-gray-400">{item.unit}</span></span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-400">Status</span>
                <StatusBadge status={status} />
              </div>
              {[
                ["Minimum Quantity", item.minQuantity.toString()],
                ["Location", item.location || "—"],
                ["Preferred Supplier", item.preferredSupplier || "—"],
                ["Purchase Price", item.purchasePrice || "—"],
                ["Expiry Date", item.expiryDate || "—"],
                ["Last Updated", item.lastUpdated],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400">{l}</span>
                  <span className="text-xs font-medium text-gray-700 text-right max-w-[55%]">{v}</span>
                </div>
              ))}
              {item.internalNote && (
                <div className="pt-2">
                  <p className="text-xs text-gray-400 mb-1">Internal Note</p>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{item.internalNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { onAdjust(item); onClose(); }}
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium bg-[#4F6FD8] text-white rounded-xl hover:bg-[#3F5FC2] transition-colors">
              <SlidersHorizontal size={14} /> Adjust Stock
            </button>
            <button onClick={() => { onPurchase([item]); onClose(); }}
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              <ListPlus size={14} /> Purchase List
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { onEdit(item); onClose(); }}
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              <Pencil size={14} /> Edit Info
            </button>
            <button onClick={() => { onViewActivity(item.name); onClose(); }}
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              <Activity size={14} /> Activity
            </button>
          </div>
          <button onClick={() => { onRemove(item); onClose(); }}
            className="w-full py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            Remove from Inventory
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkActionBar({ count, onPurchase, onDeselect }: {
  count: number; onPurchase: () => void; onDeselect: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-[#4F6FD8] rounded-xl text-white">
      <span className="text-sm font-medium">{count} item{count > 1 ? "s" : ""} selected</span>
      <div className="flex items-center gap-2 flex-1">
        <button onClick={onPurchase}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
          <ListPlus size={14} /> Add to Purchase List
        </button>
      </div>
      <button onClick={onDeselect} className="text-white/70 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}

// ─── ItemsTab ──────────────────────────────────────────────────────────────────

type SortKey = "name" | "quantity" | "status" | "lastUpdated";

function ItemsTab({ items, initialSearch = "", initialStatusFilter = "", onSearchConsumed, onStatusFilterConsumed, onAdjust, onEdit, onPurchase, onRemove, onViewActivity, onViewDetail }: {
  items: InventoryItem[];
  initialSearch?: string;
  initialStatusFilter?: string;
  onSearchConsumed?: () => void;
  onStatusFilterConsumed?: () => void;
  onAdjust: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onPurchase: (items: InventoryItem[]) => void;
  onRemove: (item: InventoryItem) => void;
  onViewActivity: (name: string) => void;
  onViewDetail: (item: InventoryItem) => void;
}) {
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      onSearchConsumed?.();
    }
  }, [initialSearch]);
  const [category, setCategory] = useState("All Categories");
  const [stockStatus, setStockStatus] = useState("All Status");

  useEffect(() => {
    if (initialStatusFilter) {
      setStockStatus(initialStatusFilter);
      onStatusFilterConsumed?.();
    }
  }, [initialStatusFilter]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [openAction, setOpenAction] = useState<number | null>(null);
  const perPage = 8;

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.barcode.includes(q);
    const matchCat = category === "All Categories" || item.category === category;
    const matchStatus = stockStatus === "All Status" || computeStatus(item.quantity, item.minQuantity) === stockStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return dir * a.name.localeCompare(b.name);
    if (sortKey === "quantity") return dir * (a.quantity - b.quantity);
    if (sortKey === "status") return dir * computeStatus(a.quantity, a.minQuantity).localeCompare(computeStatus(b.quantity, b.minQuantity));
    if (sortKey === "lastUpdated") return dir * a.lastUpdated.localeCompare(b.lastUpdated);
    return 0;
  });

  const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / perPage)));
  const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const allSelected = paginated.length > 0 && paginated.every((i) => selected.has(i.id));
  const toggleAll = () => {
    setSelected((s) => {
      const n = new Set(s);
      if (allSelected) paginated.forEach((i) => n.delete(i.id));
      else paginated.forEach((i) => n.add(i.id));
      return n;
    });
  };
  const toggleOne = (id: number) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const selectedItems = items.filter((i) => selected.has(i.id));

  const sortTh = (label: string, key: SortKey) => (
    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
      <button onClick={() => handleSort(key)} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
        {label} <SortIcon dir={sortKey === key ? sortDir : null} />
      </button>
    </th>
  );

  const STOCK_STATUSES_FILTER = ["All Status", "In Stock", "Low Stock", "Out of Stock"];

  return (
    <>
      {selected.size > 0 && (
        <BulkActionBar count={selected.size} onPurchase={() => onPurchase(selectedItems)} onDeselect={() => setSelected(new Set())} />
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-shrink-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Product name, SKU, or barcode" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 bg-white" />
        </div>
        <SelectDropdown value={category} options={CATEGORIES} onChange={(v) => { setCategory(v); setPage(1); }} />
        <SelectDropdown value={stockStatus} options={STOCK_STATUSES_FILTER} onChange={(v) => { setStockStatus(v); setPage(1); }} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 flex flex-col items-center text-gray-400">
          <Package size={36} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">No items match your filters</p>
          <p className="text-xs mt-1">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#4F6FD8] focus:ring-[#4F6FD8]/30" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-10" />
                  {sortTh("Product", "name")}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Brand</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                  {sortTh("Qty", "quantity")}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Unit</th>
                  {sortTh("Status", "status")}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</th>
                  {sortTh("Updated", "lastUpdated")}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => {
                  const status = computeStatus(item.quantity, item.minQuantity);
                  return (
                    <tr key={item.id} className={`border-b border-gray-50 transition-colors ${selected.has(item.id) ? "bg-[#F2F5FF]/50" : "hover:bg-gray-50/60"}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#4F6FD8] focus:ring-[#4F6FD8]/30" />
                      </td>
                      <td className="px-4 py-3"><ProductAvatar name={item.name} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => onViewDetail(item)} className="text-left hover:text-[#4F6FD8] transition-colors group">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#4F6FD8] transition-colors">{item.name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{item.sku}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.brand}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.category}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[140px] truncate">{item.location || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{item.lastUpdated}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button onClick={() => setOpenAction(openAction === item.id ? null : item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                          {openAction === item.id && (
                            <div className="absolute z-30 right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              {[
                                { id: "adjust", label: "Adjust Stock", icon: <SlidersHorizontal size={14} />, action: () => onAdjust(item) },
                                { id: "purchase", label: "Add to Purchase List", icon: <ListPlus size={14} />, action: () => onPurchase([item]) },
                                { id: "edit", label: "Edit Inventory Information", icon: <Pencil size={14} />, action: () => onEdit(item) },
                                { id: "activity", label: "View Inventory Activity", icon: <Activity size={14} />, action: () => onViewActivity(item.name) },
                              ].map((a) => (
                                <button key={a.id} onClick={() => { a.action(); setOpenAction(null); }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                  <span className="text-gray-400">{a.icon}</span>{a.label}
                                </button>
                              ))}
                              <div className="my-1 border-t border-gray-100" />
                              <button onClick={() => { onRemove(item); setOpenAction(null); }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                                <Trash2 size={14} /> Remove from Inventory
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={sorted.length} page={safePage} perPage={perPage} onPage={setPage} />
        </div>
      )}
    </>
  );
}

// ─── ActivityTab ──────────────────────────────────────────────────────────────

function ActivityTab({ activity, productFilter, onClearProductFilter }: {
  activity: ActivityEntry[];
  productFilter: string | null;
  onClearProductFilter: () => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [productDropFilter, setProductDropFilter] = useState("All Products");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const allProducts = ["All Products", ...Array.from(new Set(activity.map((a) => a.product)))];
  const activeProductFilter = productFilter || (productDropFilter !== "All Products" ? productDropFilter : null);

  const filtered = activity.filter((entry) => {
    const q = search.toLowerCase();
    const matchSearch = !q || entry.product.toLowerCase().includes(q) || entry.reason.toLowerCase().includes(q);
    const matchType = typeFilter === "All Types" || entry.type === typeFilter;
    const matchProduct = !activeProductFilter || entry.product === activeProductFilter;
    return matchSearch && matchType && matchProduct;
  });

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / perPage)));
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const activeChips: { label: string; value: string; onRemove: () => void }[] = [];
  if (productFilter) activeChips.push({ label: "Product", value: productFilter, onRemove: () => { onClearProductFilter(); } });
  if (productDropFilter !== "All Products" && !productFilter) activeChips.push({ label: "Product", value: productDropFilter, onRemove: () => setProductDropFilter("All Products") });
  if (typeFilter !== "All Types") activeChips.push({ label: "Type", value: typeFilter, onRemove: () => setTypeFilter("All Types") });

  const typeOptions = ["All Types", ...ACTIVITY_TYPES];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-shrink-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search product or reason" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-60 focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 bg-white" />
        </div>
        <SelectDropdown value={productDropFilter} options={allProducts} onChange={(v) => { setProductDropFilter(v); setPage(1); }} icon={<Tag size={13} />} />
        <SelectDropdown value={typeFilter} options={typeOptions} onChange={(v) => { setTypeFilter(v); setPage(1); }} icon={<SlidersHorizontal size={13} />} />
        <SelectDropdown value={dateFilter} options={["All Time", "Today", "Last 7 Days", "Last 30 Days"]} onChange={(v) => setDateFilter(v)} icon={<Calendar size={13} />} />
      </div>

      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Filters:</span>
          {activeChips.map((c) => <FilterChip key={c.label + c.value} label={c.label} value={c.value} onRemove={c.onRemove} />)}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 flex flex-col items-center text-gray-400">
          <Activity size={36} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">No activity found</p>
          <p className="text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Date & Time", "Product", "Action", "Change", "Previous", "New", "Reason"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{entry.dateTime}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{entry.product}</td>
                    <td className="px-4 py-3"><ActivityTypeBadge type={entry.type} /></td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {entry.change === null ? <span className="text-gray-300">—</span>
                        : <span className={entry.change > 0 ? "text-emerald-600" : "text-red-600"}>{entry.change > 0 ? `+${entry.change}` : entry.change}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.previous ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.next ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={filtered.length} page={safePage} perPage={perPage} onPage={setPage} />
        </div>
      )}
    </>
  );
}

// ─── Purchase List Detail Page ─────────────────────────────────────────────────

function exportCsv(list: PurchaseList) {
  const rows = [
    ["Product", "Brand", "Requested Qty", "Received Qty", "Unit", "Status"],
    ...list.items.map((i) => [
      i.name, i.brand, i.quantity, i.receivedQuantity, i.unit,
      itemReceiptStatus(i) === "received" ? "Received" : itemReceiptStatus(i) === "partial" ? "Partially Received" : "Pending Receipt",
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${list.name.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ReceiveConfirmModal({ item, onClose, onConfirm }: {
  item: PurchaseListItem; onClose: () => void; onConfirm: (amount: number) => void;
}) {
  const remaining = item.quantity - item.receivedQuantity;
  const [qty, setQty] = useState(String(remaining));
  const [error, setError] = useState("");

  const amount = parseInt(qty, 10);
  const inventoryIncrease = isNaN(amount) ? null : amount;

  const validate = () => {
    if (!qty || isNaN(amount) || amount <= 0) { setError("Enter a valid quantity greater than 0"); return false; }
    if (amount > remaining) { setError(`Cannot exceed remaining quantity (${remaining} ${item.unit})`); return false; }
    return true;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm(amount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Receive Items</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Product info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <ProductAvatar name={item.name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-400">{item.brand} · Remaining: {remaining} {item.unit}</p>
            </div>
          </div>

          {/* Quantity input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Quantity Received <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="number" min="1" max={remaining}
                value={qty}
                onChange={(e) => { setQty(e.target.value); setError(""); }}
                className={`w-24 px-3 py-2 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 transition-all ${error ? "border-red-300 focus:border-red-400 focus:ring-red-400/10" : "bg-white border-gray-200 focus:border-[#4F6FD8] focus:ring-[#4F6FD8]/10"}`}
              />
              <span className="text-sm text-gray-500">{item.unit}</span>
              <span className="text-xs text-gray-400">of {remaining} remaining</span>
            </div>
            {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
          </div>

          {/* Preview */}
          {inventoryIncrease !== null && inventoryIncrease > 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              <ArrowUpCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>Inventory will increase by <strong>{inventoryIncrease} {item.unit}</strong> after confirmation.</span>
            </div>
          )}

          {/* Warning */}
          <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
            <AlertTriangle size={12} /> This action cannot be undone. Verify the quantity before confirming.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium border border-gray-200">Cancel</button>
          <button onClick={handleConfirm}
            className="flex-1 py-2.5 text-sm bg-[#4F6FD8] text-white rounded-xl hover:bg-[#3F5FC2] transition-colors font-medium">
            Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function EditListModal({ list, onClose, onSave }: {
  list: PurchaseList; onClose: () => void;
  onSave: (name: string, notes: string) => void;
}) {
  const [name, setName] = useState(list.name);
  const [notes, setNotes] = useState(list.notes);
  const [error, setError] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Edit List</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">List Name <span className="text-red-500">*</span></label>
            <input autoFocus type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-all ${error ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10"}`} />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { if (!name.trim()) { setError("Required"); return; } onSave(name.trim(), notes.trim()); onClose(); }}
            className="px-4 py-2 text-sm bg-[#4F6FD8] text-white rounded-lg hover:bg-[#3F5FC2] transition-colors font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}

function ItemRowMenu({ item, onViewInInventory, onRemove }: {
  item: PurchaseListItem;
  onViewInInventory: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute z-30 right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5">
          <button onClick={() => { onViewInInventory(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
            <Package size={14} className="text-gray-400" /> View Inventory Item
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button onClick={() => { onRemove(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
            <Trash2 size={14} /> Remove from List
          </button>
        </div>
      )}
    </div>
  );
}

function PurchaseListDetailPage({ list, onBack, onUpdate, onDelete, onNavigateToInventory, onNavigateToInventoryItem }: {
  list: PurchaseList;
  onBack: () => void;
  onUpdate: (id: number, patch: Partial<PurchaseList>) => void;
  onDelete: (id: number) => void;
  onNavigateToInventory: () => void;
  onNavigateToInventoryItem: (name: string) => void;
}) {
  const [receiveTarget, setReceiveTarget] = useState<PurchaseListItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  useOutsideClick(exportRef, () => setShowExportMenu(false));
  useOutsideClick(actionRef, () => setShowActionMenu(false));

  const receivedCount = plReceived(list);
  const total = list.items.length;
  const pct = total === 0 ? 0 : Math.round((receivedCount / total) * 100);
  const allReceived = receivedCount === total && total > 0;
  const cardStatus = list.status === "Completed" ? "Completed" : plCardStatus(list);
  const isCompleted = list.status === "Completed";

  const statusStyle: Record<string, string> = {
    Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Partially Received": "bg-amber-50 text-amber-700 border-amber-200",
    "All Received": "bg-blue-50 text-blue-700 border-blue-200",
    Completed: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const handleReceiveConfirmed = (item: PurchaseListItem, amount: number) => {
    const newItems = list.items.map((i) =>
      i.id === item.id ? { ...i, receivedQuantity: Math.min(i.receivedQuantity + amount, i.quantity) } : i
    );
    onUpdate(list.id, { items: newItems, updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) });
    setReceiveTarget(null);
    toast.success(`Received ${amount} ${item.unit} of ${item.name}`);
  };

  const handleRemoveItem = (itemId: number) => {
    onUpdate(list.id, { items: list.items.filter((i) => i.id !== itemId) });
    toast.success("Item removed from list");
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
        <button onClick={onBack} className="hover:text-[#4F6FD8] transition-colors">Purchase Lists</button>
        <ChevronRight size={14} />
        <span className="text-gray-700 font-medium truncate">{list.name}</span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{list.name}</h1>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${statusStyle[cardStatus]}`}>
            {cardStatus}
          </span>
        </div>

        {/* Action buttons */}
        {!isCompleted && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Export */}
            <div className="relative" ref={exportRef}>
              <button onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                <Upload size={14} /> Export <ChevronDown size={13} className="text-gray-400" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20">
                  <button onClick={() => { exportCsv(list); setShowExportMenu(false); toast.success("CSV downloaded"); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <FileText size={14} className="text-gray-400" /> Export as CSV
                  </button>
                  <button onClick={() => { setShowExportMenu(false); toast.info("PDF export coming soon"); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <FileText size={14} className="text-gray-400" /> Export as PDF
                  </button>
                </div>
              )}
            </div>

            {/* Actions menu */}
            <div className="relative" ref={actionRef}>
              <button onClick={() => setShowActionMenu(!showActionMenu)}
                className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                <MoreHorizontal size={16} />
              </button>
              {showActionMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20">
                  <button onClick={() => { setShowEditModal(true); setShowActionMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                    <Pencil size={14} className="text-gray-400" /> Edit List
                  </button>
                  <div className="relative group/complete">
                    <button
                      onClick={() => { if (allReceived) { onUpdate(list.id, { status: "Completed" }); onBack(); toast.success(`"${list.name}" marked as completed`); setShowActionMenu(false); } }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${allReceived ? "text-gray-700 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"}`}>
                      <CheckCheck size={14} className={allReceived ? "text-emerald-500" : "text-gray-300"} />
                      Complete Purchase List
                    </button>
                    {!allReceived && (
                      <div className="absolute right-full top-0 mr-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/complete:opacity-100 transition-opacity pointer-events-none z-40 leading-snug w-40">
                        All items must be received first
                      </div>
                    )}
                  </div>
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={() => { setShowDeleteModal(true); setShowActionMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                    <Trash2 size={14} /> Delete Purchase List
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-1 flex-wrap">
        <span><strong className="text-gray-600">{total}</strong> items</span>
        <span className="text-gray-200">·</span>
        <span><strong className="text-gray-600">{receivedCount}</strong> received</span>
        <span className="text-gray-200">·</span>
        <span>Last updated {list.updatedAt}</span>
      </div>
      {list.notes && <p className="text-sm text-gray-500 mb-6">{list.notes}</p>}

      {/* Progress */}
      {!isCompleted && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-700">Receiving progress</p>
              <p className="text-xs text-gray-400 mt-0.5">{receivedCount} of {total} items fully received</p>
            </div>
            <span className="text-2xl font-bold text-[#4F6FD8]">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#4F6FD8] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide" style={{ width: "35%" }}>Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Requested Qty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Received Qty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                {!isCompleted && (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {list.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-sm text-gray-400">
                    No items in this list
                  </td>
                </tr>
              ) : (
                list.items.map((item) => {
                  const st = itemReceiptStatus(item);

                  const statusCell = () => {
                    if (st === "received") return (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#10b981" opacity="0.15"/><path d="M4 7L6 9L10 5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Received
                      </span>
                    );
                    if (st === "partial") return (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Partially Received
                      </span>
                    );
                    return <span className="text-sm text-gray-400">Pending Receipt</span>;
                  };

                  return (
                    <tr key={item.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/40">
                      {/* Product */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductAvatar name={item.name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.brand}</p>
                          </div>
                        </div>
                      </td>

                      {/* Requested Qty */}
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.quantity} <span className="text-gray-400">{item.unit}</span>
                      </td>

                      {/* Received Qty */}
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${st === "received" ? "text-emerald-600" : st === "partial" ? "text-amber-600" : "text-gray-400"}`}>
                          {item.receivedQuantity}
                        </span>
                        <span className="text-gray-400 text-sm"> {item.unit}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">{statusCell()}</td>

                      {/* Action */}
                      {!isCompleted && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {st !== "received" && (
                              <button onClick={() => setReceiveTarget(item)}
                                className="px-3 py-1.5 text-xs font-medium text-[#4F6FD8] border border-[#4F6FD8]/30 rounded-lg hover:bg-[#4F6FD8]/5 transition-colors">
                                Receive
                              </button>
                            )}
                            <ItemRowMenu
                              item={item}
                              onViewInInventory={() => onNavigateToInventoryItem(item.name)}
                              onRemove={() => handleRemoveItem(item.id)}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {receiveTarget && (
        <ReceiveConfirmModal
          item={receiveTarget}
          onClose={() => setReceiveTarget(null)}
          onConfirm={(amount) => handleReceiveConfirmed(receiveTarget, amount)}
        />
      )}
      {showEditModal && (
        <EditListModal list={list} onClose={() => setShowEditModal(false)}
          onSave={(name, notes) => { onUpdate(list.id, { name, notes }); toast.success("List updated"); }} />
      )}
      {showDeleteModal && (
        <DeleteListModal list={list} onClose={() => setShowDeleteModal(false)}
          onConfirm={() => { onDelete(list.id); onBack(); }} />
      )}
    </main>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

const USAGE_DATA_6M = [
  { month: "Feb", value: 280 }, { month: "Mar", value: 310 }, { month: "Apr", value: 295 },
  { month: "May", value: 340 }, { month: "Jun", value: 375 }, { month: "Jul", value: 412 },
];
const USAGE_DATA_12M = [
  { month: "Aug", value: 210 }, { month: "Sep", value: 235 }, { month: "Oct", value: 258 },
  { month: "Nov", value: 241 }, { month: "Dec", value: 265 }, { month: "Jan", value: 290 },
  ...USAGE_DATA_6M,
];
const USAGE_DATA_24M = [
  { month: "Aug'23", value: 145 }, { month: "Oct'23", value: 168 }, { month: "Dec'23", value: 185 },
  { month: "Feb'24", value: 172 }, { month: "Apr'24", value: 196 }, { month: "Jun'24", value: 210 },
  ...USAGE_DATA_12M,
];

const TOP_USED = [
  { name: "Composite A2", category: "Restorative", used: 48, trend: "+12%" },
  { name: "Impression Material", category: "Impression", used: 36, trend: "+8%" },
  { name: "Syringe Needles 27G", category: "Disposables", used: 35, trend: "+5%" },
  { name: "Gauze 2×2", category: "Disposables", used: 31, trend: "-2%" },
  { name: "Nitrile Gloves — M", category: "PPE", used: 28, trend: "+3%" },
];

// Shared card class — no hard border, soft layered shadow for a premium feel
const CARD = "bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.05)]";

function DashboardPage({ items, onNavigateToInventory, onNavigateWithStatusFilter }: {
  items: InventoryItem[];
  onNavigateToInventory: () => void;
  onNavigateWithStatusFilter: (filter: StockStatus) => void;
}) {
  const [usagePeriod, setUsagePeriod] = useState<"6m" | "12m" | "24m">("6m");

  const inStock = items.filter((i) => computeStatus(i.quantity, i.minQuantity) === "In Stock").length;
  const lowStock = items.filter((i) => computeStatus(i.quantity, i.minQuantity) === "Low Stock").length;
  const outOfStock = items.filter((i) => computeStatus(i.quantity, i.minQuantity) === "Out of Stock").length;
  const total = items.length;
  const expiringSoon = items.filter((i) => {
    if (!i.expiryDate) return false;
    const d = new Date(i.expiryDate);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  }).length;
  const totalValue = items.reduce((s, i) => s + (parseFloat(i.purchasePrice?.replace(/[^0-9.]/g, "") || "0") * i.quantity), 0);

  const pieData = [
    { name: "In Stock", value: inStock, color: "#10b981" },
    { name: "Low Stock", value: lowStock, color: "#f59e0b" },
    { name: "Out of Stock", value: outOfStock, color: "#ef4444" },
  ];

  const usageData = usagePeriod === "6m" ? USAGE_DATA_6M : usagePeriod === "12m" ? USAGE_DATA_12M : USAGE_DATA_24M;

  const outOfStockItems = items.filter((i) => computeStatus(i.quantity, i.minQuantity) === "Out of Stock").slice(0, 5);
  const lowStockItems = items.filter((i) => computeStatus(i.quantity, i.minQuantity) === "Low Stock").slice(0, 5);
  const expiringSoonItems = items.filter((i) => {
    if (!i.expiryDate) return false;
    const d = new Date(i.expiryDate);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  }).slice(0, 5);

  type StatCard = {
    label: string; value: string;
    sub: string; subUp?: boolean;
    accent: string; iconBg: string; icon: React.ReactNode;
    onSub?: () => void;
  };

  const statCards: StatCard[] = [
    {
      label: "Total Items", value: total.toLocaleString(),
      sub: "+24 from last month", subUp: true,
      accent: "#4F6FD8", iconBg: "#F2F5FF",
      icon: <Boxes size={17} style={{ color: "#4F6FD8" }} />,
    },
    {
      label: "Total Value",
      value: "$" + (totalValue > 0
        ? totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "18,450.60"),
      sub: "+$1.8k from last month", subUp: true,
      accent: "#10b981", iconBg: "#ecfdf5",
      icon: <BarChart2 size={17} style={{ color: "#10b981" }} />,
    },
    {
      label: "Low Stock Items", value: String(lowStock || 23),
      sub: "View All",
      accent: "#f59e0b", iconBg: "#fffbeb",
      icon: <AlertTriangle size={17} style={{ color: "#f59e0b" }} />,
      onSub: () => onNavigateWithStatusFilter("Low Stock"),
    },
    {
      label: "Out of Stock", value: String(outOfStock || 7),
      sub: "View All",
      accent: "#ef4444", iconBg: "#fef2f2",
      icon: <AlertTriangle size={17} style={{ color: "#ef4444" }} />,
      onSub: () => onNavigateWithStatusFilter("Out of Stock"),
    },
    {
      label: "Expiring Soon", value: String(expiringSoon || 15),
      sub: "View All",
      accent: "#f97316", iconBg: "#fff7ed",
      icon: <Clock size={17} style={{ color: "#f97316" }} />,
      onSub: () => onNavigateWithStatusFilter("Low Stock"),
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your inventory and clinic supply status</p>
      </div>

      {/* Row 1 — Stat cards */}
      <div className="grid grid-cols-5 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className={`${CARD} p-5`}>
            {/* top row: label + icon */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{c.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: c.iconBg }}>
                {c.icon}
              </div>
            </div>
            {/* value */}
            <p className="text-[1.6rem] font-bold text-gray-900 leading-none mb-2">{c.value}</p>
            {/* sub */}
            <div className="flex items-center gap-1">
              {c.subUp !== undefined && (
                c.subUp
                  ? <TrendingUp size={12} className="text-emerald-500 flex-shrink-0" />
                  : <TrendingDown size={12} className="text-red-400 flex-shrink-0" />
              )}
              <button onClick={c.onSub}
                className={`text-xs font-medium ${c.onSub ? "hover:underline" : ""}`}
                style={{ color: c.onSub ? c.accent : "#10b981" }}>
                {c.sub}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2 — Inventory Status | Usage Trend | Top Used Products */}
      <div className="grid grid-cols-12 gap-4">
        {/* Inventory Status */}
        <div className={`col-span-3 ${CARD} p-5 flex flex-col`}>
          <p className="text-sm font-semibold text-gray-900 mb-1">Inventory Status</p>
          <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: 160 }}>
            <PieChart width={156} height={156}>
              <Pie data={pieData} cx={74} cy={74} innerRadius={46} outerRadius={70} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-gray-900">{total}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Total Items</span>
            </div>
          </div>
          <div className="space-y-2.5 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-500">{d.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-900">{d.value.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 ml-1">({total > 0 ? Math.round(d.value / total * 100) : 0}%)</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={onNavigateToInventory}
            className="mt-4 text-xs font-semibold text-[#4F6FD8] hover:text-[#3F5FC2] transition-colors text-center flex items-center justify-center gap-1">
            View Full Inventory <ArrowRight size={11} />
          </button>
        </div>

        {/* Usage Trend */}
        <div className={`col-span-5 ${CARD} p-5 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Usage Trend</p>
            <select value={usagePeriod} onChange={(e) => setUsagePeriod(e.target.value as "6m" | "12m" | "24m")}
              className="text-xs bg-gray-50 border-0 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4F6FD8]/20 cursor-pointer">
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
              <option value="24m">Last 24 months</option>
            </select>
          </div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F6FD8" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#4F6FD8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", padding: "8px 12px" }}
                  labelStyle={{ fontWeight: 600, color: "#1f2937" }}
                  cursor={{ stroke: "#4F6FD8", strokeWidth: 1, strokeDasharray: "4 2" }}
                />
                <Area type="monotone" dataKey="value" stroke="#4F6FD8" strokeWidth={2.5} fill="url(#usageGrad)"
                  dot={false} activeDot={{ r: 4, fill: "#4F6FD8", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Used Products */}
        <div className={`col-span-4 ${CARD} p-5 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Top Used Products</p>
            <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">Last 30 days</span>
          </div>
          <div className="space-y-0">
            {/* header row */}
            <div className="grid grid-cols-[1fr_36px_56px] gap-2 pb-2 border-b border-gray-100 mb-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Used</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Trend</span>
            </div>
            {TOP_USED.map((p, i) => {
              const isUp = p.trend.startsWith("+");
              return (
                <div key={i} className="grid grid-cols-[1fr_36px_56px] gap-2 items-center py-2.5 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{p.name}</p>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{p.category}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-800 text-center">{p.used}</span>
                  <div className={`flex items-center justify-end gap-0.5 ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                    {isUp
                      ? <TrendingUp size={13} className="flex-shrink-0" />
                      : <TrendingDown size={13} className="flex-shrink-0" />}
                    <span className="text-[11px] font-semibold">{p.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3 — Out of Stock | Low Stock | Expiring Soon */}
      <div className="grid grid-cols-3 gap-4">
        {/* Out of Stock Items */}
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Out of Stock</p>
            <button onClick={() => onNavigateWithStatusFilter("Out of Stock")}
              className="text-xs font-semibold text-[#4F6FD8] hover:text-[#3F5FC2] transition-colors flex items-center gap-0.5">
              View All <ArrowRight size={11} />
            </button>
          </div>
          {outOfStockItems.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No out-of-stock items</p>
          ) : (
            <div className="space-y-3">
              {outOfStockItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  <ProductAvatar name={item.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.category}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">0 left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Low Stock Alerts</p>
            <button onClick={() => onNavigateWithStatusFilter("Low Stock")}
              className="text-xs font-semibold text-[#4F6FD8] hover:text-[#3F5FC2] transition-colors flex items-center gap-0.5">
              View All <ArrowRight size={11} />
            </button>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">All items well-stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  <ProductAvatar name={item.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-amber-500">{item.quantity} left</p>
                    <p className="text-[11px] text-gray-400">min {item.minQuantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Soon */}
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Expiring Soon</p>
            <button onClick={() => onNavigateWithStatusFilter("Low Stock")}
              className="text-xs font-semibold text-[#4F6FD8] hover:text-[#3F5FC2] transition-colors flex items-center gap-0.5">
              View All <ArrowRight size={11} />
            </button>
          </div>
          {expiringSoonItems.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No items expiring soon</p>
          ) : (
            <div className="space-y-3">
              {expiringSoonItems.map((item) => {
                const d = new Date(item.expiryDate);
                const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <ProductAvatar name={item.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{item.category}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${days <= 30 ? "text-red-500 bg-red-50" : "text-orange-500 bg-orange-50"}`}>
                      {days}d left
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── AnalyticsPage ────────────────────────────────────────────────────────────

const ANLX_CAT_COLORS: Record<string, string> = {
  Restorative: "#4F6FD8", Disposables: "#10b981", PPE: "#f59e0b", Impression: "#8b5cf6", Anesthetics: "#ef4444",
};
const ANLX_BREAKDOWN = [
  { name: "Disposables", value: 38, color: "#10b981" },
  { name: "PPE", value: 24, color: "#f59e0b" },
  { name: "Restorative", value: 17, color: "#4F6FD8" },
  { name: "Impression", value: 12, color: "#8b5cf6" },
  { name: "Anesthetics", value: 9, color: "#ef4444" },
];
const ANLX_TREND_6M = [
  { month: "Feb", Restorative: 42, Disposables: 96, PPE: 58, Impression: 24, Anesthetics: 13 },
  { month: "Mar", Restorative: 46, Disposables: 108, PPE: 65, Impression: 28, Anesthetics: 16 },
  { month: "Apr", Restorative: 43, Disposables: 102, PPE: 62, Impression: 26, Anesthetics: 14 },
  { month: "May", Restorative: 51, Disposables: 116, PPE: 70, Impression: 32, Anesthetics: 18 },
  { month: "Jun", Restorative: 55, Disposables: 124, PPE: 76, Impression: 36, Anesthetics: 20 },
  { month: "Jul", Restorative: 61, Disposables: 138, PPE: 84, Impression: 41, Anesthetics: 24 },
];
const ANLX_TREND_12M = [
  { month: "Aug", Restorative: 36, Disposables: 84, PPE: 51, Impression: 20, Anesthetics: 11 },
  { month: "Sep", Restorative: 38, Disposables: 88, PPE: 53, Impression: 21, Anesthetics: 12 },
  { month: "Oct", Restorative: 40, Disposables: 92, PPE: 55, Impression: 22, Anesthetics: 12 },
  { month: "Nov", Restorative: 39, Disposables: 90, PPE: 54, Impression: 22, Anesthetics: 13 },
  { month: "Dec", Restorative: 41, Disposables: 95, PPE: 57, Impression: 23, Anesthetics: 14 },
  { month: "Jan", Restorative: 44, Disposables: 100, PPE: 60, Impression: 25, Anesthetics: 14 },
  { month: "Feb", Restorative: 42, Disposables: 96, PPE: 58, Impression: 24, Anesthetics: 13 },
  { month: "Mar", Restorative: 46, Disposables: 108, PPE: 65, Impression: 28, Anesthetics: 16 },
  { month: "Apr", Restorative: 43, Disposables: 102, PPE: 62, Impression: 26, Anesthetics: 14 },
  { month: "May", Restorative: 51, Disposables: 116, PPE: 70, Impression: 32, Anesthetics: 18 },
  { month: "Jun", Restorative: 55, Disposables: 124, PPE: 76, Impression: 36, Anesthetics: 20 },
  { month: "Jul", Restorative: 61, Disposables: 138, PPE: 84, Impression: 41, Anesthetics: 24 },
];
const ANLX_TREND_24M = [
  { month: "Aug'23", Restorative: 28, Disposables: 64, PPE: 40, Impression: 16, Anesthetics: 8 },
  { month: "Oct'23", Restorative: 30, Disposables: 70, PPE: 43, Impression: 17, Anesthetics: 9 },
  { month: "Dec'23", Restorative: 32, Disposables: 74, PPE: 45, Impression: 18, Anesthetics: 10 },
  { month: "Feb'24", Restorative: 34, Disposables: 80, PPE: 48, Impression: 19, Anesthetics: 10 },
  { month: "Apr'24", Restorative: 38, Disposables: 86, PPE: 52, Impression: 21, Anesthetics: 11 },
  { month: "Jun'24", Restorative: 41, Disposables: 92, PPE: 56, Impression: 22, Anesthetics: 12 },
  { month: "Aug'24", Restorative: 36, Disposables: 84, PPE: 51, Impression: 20, Anesthetics: 11 },
  { month: "Oct'24", Restorative: 38, Disposables: 88, PPE: 53, Impression: 21, Anesthetics: 12 },
  { month: "Dec'24", Restorative: 41, Disposables: 95, PPE: 57, Impression: 23, Anesthetics: 14 },
  { month: "Feb'25", Restorative: 44, Disposables: 100, PPE: 60, Impression: 25, Anesthetics: 14 },
  { month: "Apr'25", Restorative: 55, Disposables: 124, PPE: 76, Impression: 36, Anesthetics: 20 },
  { month: "Jun'25", Restorative: 61, Disposables: 138, PPE: 84, Impression: 41, Anesthetics: 24 },
];

const ANLX_PRIORITY_CFG = {
  High:    { color: "#ef4444", bg: "#fef2f2", label: "High Priority",   tip: "Out of Stock: Current Quantity = 0" },
  Medium:  { color: "#f97316", bg: "#fff7ed", label: "Medium Priority", tip: "Reorder Now: Current Quantity ≤ Minimum Quantity" },
  Soon:    { color: "#f59e0b", bg: "#fffbeb", label: "Reorder Soon",    tip: "Predicted to reach Minimum Quantity within 14 days" },
  Planned: { color: "#4F6FD8", bg: "#F2F5FF", label: "Planned",         tip: "Predicted to reach Minimum Quantity in 15–30 days" },
} as const;
type PriorityKey = keyof typeof ANLX_PRIORITY_CFG;

function PriorityBadge({ p }: { p: string }) {
  const cfg = ANLX_PRIORITY_CFG[p as PriorityKey];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
  );
}

// Static AI insight cards — mock data, coming soon
const PRED_INSIGHTS = [
  {
    color: "#4F6FD8", initial: "C",
    name: "Composite A2",
    insight: "Qty is low in 8 days. Recommend ordering to avoid stockout.",
    reorder: 20,
  },
  {
    color: "#f59e0b", initial: "S",
    name: "Syringe Needles 27G",
    insight: "Demand expected to increase by 14% next month.",
    reorder: 50,
  },
  {
    color: "#10b981", initial: "G",
    name: "Gauze 2×2",
    insight: "5 units suggested quantity increase this 3 weeks.",
    reorder: 30,
  },
  {
    color: "#8b5cf6", initial: "A",
    name: "Anesthetic Cartridge",
    insight: "Consumption is stable, next order recommended in 3 weeks.",
    reorder: 15,
  },
];

// Static forecasted needs with image-matching columns
const STATIC_FORECAST = [
  { name: "Composite A2",       category: "Restorative", currentStock: 9,  avgWeekly: 6.2,  runoutDays: 7,  recQty: 30, orderBy: "Jul 18, 2024" },
  { name: "Syringe Needles 27G",category: "Disposables", currentStock: 40, avgWeekly: 12.1, runoutDays: 11, recQty: 50, orderBy: "Jul 22, 2024" },
  { name: "Impression Material",category: "Impression",  currentStock: 8,  avgWeekly: 4.8,  runoutDays: 9,  recQty: 25, orderBy: "Jul 20, 2024" },
  { name: "Universal Adhesive", category: "Restorative", currentStock: 3,  avgWeekly: 1.2,  runoutDays: 14, recQty: 12, orderBy: "Jul 29, 2024" },
  { name: "Anesthetic Cartridge",category:"Anesthetics", currentStock: 22, avgWeekly: 4.1,  runoutDays: 26, recQty: 20, orderBy: "Aug 7, 2024" },
  { name: "Disinfectant Wipes", category: "Disposables", currentStock: 12, avgWeekly: 2.3,  runoutDays: 31, recQty: 16, orderBy: "Aug 11, 2024" },
];

function runoutColor(days: number) {
  if (days <= 7)  return "#ef4444";
  if (days <= 14) return "#f97316";
  if (days <= 21) return "#f59e0b";
  return "#10b981";
}

function AnalyticsPage({ items, onNavigateToInventory }: {
  items: InventoryItem[];
  onNavigateToInventory: () => void;
}) {
  const [analysisMonth, setAnalysisMonth] = useState("2024-07");
  const [trendPeriod, setTrendPeriod] = useState<"6m" | "12m" | "24m">("6m");
  const [trendCategory, setTrendCategory] = useState("All Categories");

  const outOfStockItems = items.filter((i) => i.quantity === 0);
  const reorderNowItems = items.filter((i) => i.quantity > 0 && i.quantity <= i.minQuantity);
  const reorderSoonItems = items.filter((i) => {
    if (i.quantity <= i.minQuantity) return false;
    const rate = Math.max(0.3, i.minQuantity / 30);
    return (i.quantity - i.minQuantity) / rate <= 14;
  });
  const plannedItems = items.filter((i) => {
    if (i.quantity <= i.minQuantity) return false;
    const rate = Math.max(0.3, i.minQuantity / 30);
    const d = (i.quantity - i.minQuantity) / rate;
    return d > 14 && d <= 30;
  });

  const reachingReorder = reorderNowItems.length + reorderSoonItems.length;
  const predictedStockouts = outOfStockItems.length + Math.min(reorderNowItems.length, 2);
  const trendData = trendPeriod === "6m" ? ANLX_TREND_6M : trendPeriod === "12m" ? ANLX_TREND_12M : ANLX_TREND_24M;
  const activeCategories = trendCategory === "All Categories" ? Object.keys(ANLX_CAT_COLORS) : [trendCategory];

  // Upcoming reorders list (right panel)
  type ReorderRow = { name: string; category: string; priority: PriorityKey; orderDate: string };
  const reorderRows: ReorderRow[] = [
    ...outOfStockItems.map((i) => ({ name: i.name, category: i.category, priority: "High" as PriorityKey, orderDate: "Immediate" })),
    ...reorderNowItems.map((i) => ({ name: i.name, category: i.category, priority: "Medium" as PriorityKey, orderDate: "Within 7 days" })),
    ...reorderSoonItems.map((i) => ({ name: i.name, category: i.category, priority: "Soon" as PriorityKey, orderDate: "Aug 8–14" })),
    ...plannedItems.map((i) => ({ name: i.name, category: i.category, priority: "Planned" as PriorityKey, orderDate: "Aug 15–30" })),
  ];
  const STATIC_REORDERS: ReorderRow[] = [
    { name: "Composite A2",        category: "Restorative", priority: "High",   orderDate: "Jul 18, 2024" },
    { name: "Syringe Needles 27G", category: "Disposables", priority: "High",   orderDate: "Jul 22, 2024" },
    { name: "Universal Adhesive",  category: "Restorative", priority: "Medium", orderDate: "Jul 29, 2024" },
    { name: "Impression Material", category: "Impression",  priority: "Medium", orderDate: "Jul 20, 2024" },
    { name: "Anesthetic Cartridge",category: "Anesthetics", priority: "Soon",   orderDate: "Aug 7, 2024" },
    { name: "Disinfectant Wipes",  category: "Disposables", priority: "Planned",orderDate: "Aug 11, 2024" },
  ];
  const displayReorders = reorderRows.length >= 2
    ? reorderRows.slice(0, 8)
    : [...reorderRows, ...STATIC_REORDERS.filter((s) => !reorderRows.find((r) => r.name === s.name))].slice(0, 8);

  // Calendar
  const [calYear, calMonth] = analysisMonth.split("-").map(Number);
  const firstDay = (new Date(calYear, calMonth - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const monthLabel = new Date(calYear, calMonth - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  const calDays: Record<number, PriorityKey> = {};
  outOfStockItems.slice(0, 3).forEach((_, i) => { if (i + 1 <= daysInMonth) calDays[i + 1] = "High"; });
  reorderNowItems.slice(0, 4).forEach((_, i) => { const d = i + 3; if (d <= daysInMonth && !calDays[d]) calDays[d] = "Medium"; });
  reorderSoonItems.slice(0, 5).forEach((_, i) => { const d = i + 9; if (d <= daysInMonth && !calDays[d]) calDays[d] = "Soon"; });
  plannedItems.slice(0, 6).forEach((_, i) => { const d = i + 16; if (d <= daysInMonth && !calDays[d]) calDays[d] = "Planned"; });
  if (Object.keys(calDays).length === 0) {
    Object.assign(calDays, { 1: "High", 2: "High", 4: "Medium", 6: "Medium", 10: "Soon", 13: "Soon", 17: "Planned", 22: "Planned", 25: "Planned" });
  }

  return (
    <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Predictive insights and consumption analysis</p>
        </div>
        <div className="flex items-center gap-2.5">
          <label className="text-sm font-medium text-gray-500">Analysis Month</label>
          <input type="month" value={analysisMonth} onChange={(e) => setAnalysisMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 bg-white" />
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Monthly Consumption</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F2F5FF" }}>
              <Package size={17} style={{ color: "#4F6FD8" }} />
            </div>
          </div>
          <p className="text-[1.65rem] font-bold text-gray-900 leading-none mb-1.5">406 <span className="text-base font-semibold text-gray-400">units</span></p>
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">+12% from last month</span>
          </div>
        </div>
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Forecasted 30-Day Spend</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#ecfdf5" }}>
              <BarChart2 size={17} style={{ color: "#10b981" }} />
            </div>
          </div>
          <p className="text-[1.65rem] font-bold text-gray-900 leading-none mb-1.5">$4,621</p>
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-xs font-medium text-gray-400">+8% vs last month</span>
          </div>
        </div>
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Items Reaching Reorder</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fffbeb" }}>
              <AlertTriangle size={17} style={{ color: "#f59e0b" }} />
            </div>
          </div>
          <p className="text-[1.65rem] font-bold text-gray-900 leading-none mb-1.5">{reachingReorder || 18}</p>
          <button onClick={onNavigateToInventory} className="text-xs font-medium text-[#4F6FD8] hover:underline">
            View in Inventory →
          </button>
        </div>
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Predicted Stockouts</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fef2f2" }}>
              <AlertTriangle size={17} style={{ color: "#ef4444" }} />
            </div>
          </div>
          <p className="text-[1.65rem] font-bold text-gray-900 leading-none mb-1.5">{predictedStockouts || 8}</p>
          <span className="text-xs text-gray-400">This month</span>
        </div>
      </div>

      {/* Consumption Trend | Usage Breakdown */}
      <div className="grid grid-cols-12 gap-4">
        <div className={`col-span-7 ${CARD} p-5 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Consumption Trend</p>
            <div className="flex items-center gap-2">
              <select value={trendPeriod} onChange={(e) => setTrendPeriod(e.target.value as "6m" | "12m" | "24m")}
                className="text-xs bg-gray-50 border-0 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none">
                <option value="6m">Last 6 months</option>
                <option value="12m">Last 12 months</option>
                <option value="24m">Last 24 months</option>
              </select>
              <select value={trendCategory} onChange={(e) => setTrendCategory(e.target.value)}
                className="text-xs bg-gray-50 border-0 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none">
                {["All Categories", "Restorative", "Disposables", "PPE", "Impression", "Anesthetics"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  {activeCategories.map((cat) => (
                    <linearGradient key={cat} id={`grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={ANLX_CAT_COLORS[cat]} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={ANLX_CAT_COLORS[cat]} stopOpacity={0.01} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", padding: "8px 12px" }}
                  labelStyle={{ fontWeight: 600, color: "#1f2937" }} cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} />
                {activeCategories.map((cat) => (
                  <Area key={cat} type="monotone" dataKey={cat}
                    stroke={ANLX_CAT_COLORS[cat]} strokeWidth={2} fill={`url(#grad-${cat})`}
                    dot={false} activeDot={{ r: 4, fill: ANLX_CAT_COLORS[cat], stroke: "#fff", strokeWidth: 2 }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-50">
            {activeCategories.map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 rounded-full inline-block" style={{ backgroundColor: ANLX_CAT_COLORS[cat] }} />
                <span className="text-[11px] text-gray-500">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`col-span-5 ${CARD} p-5 flex flex-col`}>
          <p className="text-sm font-semibold text-gray-900 mb-4">Usage Breakdown <span className="text-xs font-normal text-gray-400 ml-1">by category</span></p>
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-shrink-0">
              <PieChart width={148} height={148}>
                <Pie data={ANLX_BREAKDOWN} cx={70} cy={70} innerRadius={42} outerRadius={65} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                  {ANLX_BREAKDOWN.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold text-gray-900">406</span>
                <span className="text-[10px] text-gray-400">units</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {ANLX_BREAKDOWN.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                  <span className="text-xs font-semibold text-gray-900">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: Left (wide) + Right (narrow) ── */}
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* LEFT — Predictive Analytics + Forecasted Buying Needs */}
        <div className="col-span-8 space-y-4">

          {/* Predictive Analytics */}
          <div className={`${CARD} p-5`}>
            <p className="text-sm font-semibold text-gray-900 mb-4">Predictive Analytics</p>
            <div className="grid grid-cols-2 gap-3">
              {PRED_INSIGHTS.map((card) => (
                <div key={card.name} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                  {/* Color circle */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                    style={{ backgroundColor: card.color }}>
                    {card.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{card.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{card.insight}</p>
                    <p className="text-[11px] font-semibold mt-1.5" style={{ color: card.color }}>
                      Recommended reorder: <span className="font-bold">{card.reorder} units</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* AI disclaimer */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
              <span className="text-[11px] font-semibold" style={{ color: "#f59e0b" }}>⚠ Coming Soon</span>
              <span className="text-[11px] text-gray-400">— These insights are currently sample data. Full AI-powered predictions will be available in a future release.</span>
            </div>
          </div>

          {/* Forecasted Buying Needs */}
          <div className={`${CARD} p-5`}>
            <p className="text-sm font-semibold text-gray-900 mb-4">Forecasted Buying Needs</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Product", "Current Stock", "Avg Weekly Use", "Predicted Runout", "Recommended Qty", "Order By"].map((h) => (
                      <th key={h} className="text-left pb-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide pr-3 last:pr-0 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STATIC_FORECAST.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 pr-3">
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{row.name}</p>
                        <p className="text-[10px] text-gray-400">{row.category}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-semibold text-gray-900">{row.currentStock}</td>
                      <td className="py-2.5 pr-3 text-xs text-gray-600">{row.avgWeekly}</td>
                      <td className="py-2.5 pr-3">
                        <span className="text-xs font-bold" style={{ color: runoutColor(row.runoutDays) }}>
                          {row.runoutDays} days
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-semibold text-gray-900">{row.recQty}</td>
                      <td className="py-2.5 text-xs text-gray-600 whitespace-nowrap">{row.orderBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">Showing 1 to {STATIC_FORECAST.length} of {STATIC_FORECAST.length} items</p>
          </div>
        </div>

        {/* RIGHT — Recommended Order Timing + Upcoming Reorders */}
        <div className="col-span-4 space-y-4">

          {/* Recommended Order Timing */}
          <div className={`${CARD} p-5`}>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Recommended Order Timing</p>
            <p className="text-xs text-gray-400 mb-3">{monthLabel}</p>
            <div className="grid grid-cols-7 mb-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-gray-400 pb-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const pri = calDays[day] as PriorityKey | undefined;
                const cfg = pri ? ANLX_PRIORITY_CFG[pri] : null;
                return (
                  <div key={day} title={cfg ? cfg.tip : undefined}
                    className="h-6 flex items-center justify-center rounded text-[10px] font-medium cursor-default"
                    style={cfg ? { backgroundColor: cfg.bg, color: cfg.color } : { color: "#9ca3af" }}>
                    {day}
                  </div>
                );
              })}
            </div>
            {/* Legend — 2-column grid */}
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-2 gap-y-1.5">
              {(Object.entries(ANLX_PRIORITY_CFG) as [PriorityKey, typeof ANLX_PRIORITY_CFG[PriorityKey]][]).map(([key, cfg]) => (
                <div key={key} className="relative group flex items-center gap-1 cursor-help">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className="text-[10px] text-gray-500 font-medium leading-tight">{cfg.label}</span>
                  <div className="absolute left-0 bottom-full mb-1.5 z-50 w-52 bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 leading-snug opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    {cfg.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Reorders */}
          <div className={`${CARD} p-5`}>
            <p className="text-sm font-semibold text-gray-900 mb-4">Upcoming Reorder Priorities</p>
            <div className="space-y-1">
              {displayReorders.map((row, i) => {
                const cfg = ANLX_PRIORITY_CFG[row.priority];
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/40 rounded px-1 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{row.name}</p>
                        <p className="text-[10px] text-gray-400">{row.orderDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      <button onClick={onNavigateToInventory}
                        className="text-[11px] font-semibold text-[#4F6FD8] hover:text-[#3F5FC2] transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={onNavigateToInventory}
              className="mt-3 w-full text-center text-xs font-semibold text-[#4F6FD8] hover:text-[#3F5FC2] transition-colors pt-2 border-t border-gray-100">
              View all reorder priorities →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

function SettingsPage({ initialTab = "general" }: { initialTab?: SettingsTab }) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  // General — Clinic Info
  const [clinicName, setClinicName] = useState("Sunshine Dental Clinic");
  const [clinicAddress, setClinicAddress] = useState("123 Molar Ave, Suite 4, San Francisco, CA 94110");
  const [clinicPhone, setClinicPhone] = useState("+1 (415) 555-0192");
  const [clinicInfoSaved, setClinicInfoSaved] = useState(false);

  // General — Regional
  const [region, setRegion] = useState("Canada");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [currency, setCurrency] = useState("CAD");
  const [regionalSaved, setRegionalSaved] = useState(false);

  // General — Notifications: types
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifOutOfStock, setNotifOutOfStock] = useState(true);
  const [notifExpiring, setNotifExpiring] = useState(true);
  // Notification channels
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifEmailAddr, setNotifEmailAddr] = useState("dr.smith@sunshinedental.com");
  const [notifEmailPending, setNotifEmailPending] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Account
  const [fullName, setFullName] = useState("Dr. Smith");
  const [accountPhone, setAccountPhone] = useState("+1 (415) 555-0192");
  const [accountPhoneError, setAccountPhoneError] = useState("");
  const [accountSaved, setAccountSaved] = useState(false);

  // Security — Password
  const [currPwd, setCurrPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});
  const [pwdSuccess, setPwdSuccess] = useState(false);

  function saveClinicInfo() {
    setClinicInfoSaved(true);
    setTimeout(() => setClinicInfoSaved(false), 2500);
  }

  function saveRegional() {
    setRegionalSaved(true);
    setTimeout(() => setRegionalSaved(false), 2500);
  }

  function saveNotif() {
    if (notifEmail && notifEmailPending) setNotifEmailPending(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  }

  function validatePhone(val: string) {
    if (!val) return "";
    const digits = val.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return "Please enter a valid phone number.";
    return "";
  }

  function saveAccount() {
    const err = validatePhone(accountPhone);
    if (err) { setAccountPhoneError(err); return; }
    setAccountPhoneError("");
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2500);
  }

  function changePassword() {
    const errs: Record<string, string> = {};
    if (!currPwd) errs.curr = "Current password is required.";
    if (!newPwd || newPwd.length < 8) errs.new = "Password must be at least 8 characters.";
    if (newPwd !== confirmPwd) errs.confirm = "Passwords do not match.";
    if (Object.keys(errs).length) { setPwdErrors(errs); return; }
    setPwdErrors({});
    setCurrPwd(""); setNewPwd(""); setConfirmPwd("");
    setPwdSuccess(true);
    setTimeout(() => setPwdSuccess(false), 3000);
  }

  const TABS: { id: SettingsTab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "account", label: "Account" },
    { id: "security", label: "Security" },
  ];

  const ToggleSwitch = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: on ? "#4F6FD8" : "#d1d5db", height: "22px", width: "40px" }}>
      <span className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
        style={{ width: 18, height: 18, left: 2, transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </button>
  );

  const SField = ({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  const SInput = ({ value, onChange, readOnly, placeholder, type = "text" }: {
    value: string; onChange?: (v: string) => void; readOnly?: boolean; placeholder?: string; type?: string;
  }) => (
    <input value={value} onChange={(e) => onChange?.(e.target.value)} readOnly={readOnly} type={type}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-all focus:outline-none ${
        readOnly
          ? "bg-gray-50 border-gray-100 text-gray-500 cursor-default"
          : "bg-white border-gray-200 focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 text-gray-900"
      }`} />
  );

  const SaveBtn = ({ onClick, saved, label = "Save Changes" }: { onClick: () => void; saved: boolean; label?: string }) => (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
      style={{ backgroundColor: saved ? "#10b981" : "#4F6FD8", color: "#fff" }}>
      {saved ? <><CheckCheck size={15} /> Saved</> : label}
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="border-b border-gray-200 py-7 first:pt-1 last:border-b-0 last:pb-2">
      <h3 className="mb-5 text-base font-semibold tracking-[-0.01em] text-gray-900">{title}</h3>
      <div className="space-y-5">{children}</div>
    </section>
  );

  return (
    <main className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your clinic and account preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${tab === t.id ? "text-[#4F6FD8]" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F6FD8] rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── GENERAL ── */}
      {tab === "general" && (
        <div className="max-w-3xl">

          <Section title="Clinic Information">
            <div className="space-y-4">
              <SField label="Clinic Name">
                <SInput value={clinicName} onChange={setClinicName} />
              </SField>
              <SField label="Clinic Address">
                <SInput value={clinicAddress} onChange={setClinicAddress} />
              </SField>
              <SField label="Clinic Phone Number (Optional)">
                <SInput value={clinicPhone} onChange={setClinicPhone} placeholder="+1 (555) 000-0000" />
              </SField>
              <SField label="Clinic Email" hint="Contact your administrator to change the clinic email.">
                <SInput value="admin@sunshinedental.com" readOnly />
              </SField>
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveClinicInfo} saved={clinicInfoSaved} />
            </div>
          </Section>

          <Section title="Regional Settings">
            <div className="space-y-4">
              <SField label="Region / Country">
                <select value={region} onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 focus:outline-none text-gray-900 bg-white">
                  {["United States", "Canada", "United Kingdom", "Australia", "Singapore", "Other"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </SField>
              <SField label="Timezone">
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 focus:outline-none text-gray-900 bg-white">
                  {[
                    ["America/Toronto",     "Toronto (Eastern Time)"],
                    ["America/Los_Angeles", "Pacific Time (UTC−8)"],
                    ["America/Denver",      "Mountain Time (UTC−7)"],
                    ["America/Chicago",     "Central Time (UTC−6)"],
                    ["America/New_York",    "Eastern Time (UTC−5)"],
                    ["Europe/London",       "London (UTC+0)"],
                    ["Asia/Singapore",      "Singapore (UTC+8)"],
                  ].map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </SField>
              <SField label="Currency">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 focus:outline-none text-gray-900 bg-white">
                  {["USD", "CAD", "GBP", "AUD", "SGD", "EUR"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </SField>
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveRegional} saved={regionalSaved} />
            </div>
          </Section>

          <Section title="Notification Preferences">
            {/* Notification types */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notification Types</p>
              <div className="space-y-3">
                {([
                  ["Low Stock Alerts", notifLowStock, setNotifLowStock],
                  ["Out of Stock Alerts", notifOutOfStock, setNotifOutOfStock],
                  ["Expiring Soon Alerts", notifExpiring, setNotifExpiring],
                ] as [string, boolean, (v: boolean) => void][]).map(([label, on, set]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{label}</span>
                    <ToggleSwitch on={on} onToggle={() => set(!on)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Notification channels */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notification Channels</p>
              <div className="space-y-3">
                {/* In-app */}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm text-gray-700">In-App Notifications</p>
                    <p className="text-xs text-gray-400">Show alerts inside the platform</p>
                  </div>
                  <ToggleSwitch on={notifInApp} onToggle={() => setNotifInApp(!notifInApp)} />
                </div>
                {/* Email */}
                <div className="py-2 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-700">Email Notifications</p>
                      <p className="text-xs text-gray-400">Send alerts to an email address</p>
                    </div>
                    <ToggleSwitch on={notifEmail} onToggle={() => setNotifEmail(!notifEmail)} />
                  </div>
                  {notifEmail && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <input value={notifEmailAddr}
                          onChange={(e) => { setNotifEmailAddr(e.target.value); setNotifEmailPending(true); }}
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 focus:outline-none text-gray-900"
                          placeholder="notifications@example.com" />
                      </div>
                      {notifEmailPending && (
                        <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                          <AlertTriangle size={11} /> A verification link will be sent to this address when you save.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveNotif} saved={notifSaved} />
            </div>
          </Section>
        </div>
      )}

      {/* ── ACCOUNT ── */}
      {tab === "account" && (
        <div className="max-w-3xl">
          <Section title="Personal Account Information">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
              <div className="w-14 h-14 rounded-full bg-[#e6ebf5] flex items-center justify-center text-[#404d6b] text-xl font-bold flex-shrink-0">DS</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                <p className="text-xs text-gray-400">Admin · Sunshine Dental Clinic</p>
              </div>
            </div>
            <div className="space-y-4">
              <SField label="Full Name">
                <SInput value={fullName} onChange={setFullName} />
              </SField>
              <SField label="Email Address" hint="Email address cannot be changed. Contact your administrator.">
                <SInput value="dr.smith@sunshinedental.com" readOnly />
              </SField>
              <SField label="Phone Number (Optional)" error={accountPhoneError}>
                <SInput value={accountPhone} onChange={(v) => { setAccountPhone(v); setAccountPhoneError(""); }}
                  placeholder="+1 (555) 000-0000" />
              </SField>
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={saveAccount} saved={accountSaved} />
            </div>
          </Section>
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab === "security" && (
        <div className="max-w-3xl">

          <Section title="Change Password">
            {pwdSuccess && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100">
                <CheckCheck size={16} /> Password changed successfully.
              </div>
            )}
            <div className="space-y-4">
              <SField label="Current Password" error={pwdErrors.curr}>
                <SInput value={currPwd} onChange={setCurrPwd} type="password" placeholder="Enter current password" />
              </SField>
              <SField label="New Password" error={pwdErrors.new} hint="At least 8 characters.">
                <SInput value={newPwd} onChange={setNewPwd} type="password" placeholder="Enter new password" />
              </SField>
              <SField label="Confirm New Password" error={pwdErrors.confirm}>
                <SInput value={confirmPwd} onChange={setConfirmPwd} type="password" placeholder="Re-enter new password" />
              </SField>
            </div>
            <div className="flex justify-end pt-2">
              <SaveBtn onClick={changePassword} saved={false} label="Change Password" />
            </div>
          </Section>

        </div>
      )}
    </main>
  );
}

// ─── HelpPage ─────────────────────────────────────────────────────────────────

const HELP_FAQS = [
  {
    q: "How do I add a new inventory item?",
    a: "Navigate to the Inventory page and click \"Add Inventory Item\" in the top-right corner. Fill in the item details including name, category, quantity, and minimum quantity, then click Save.",
  },
  {
    q: "How do I adjust stock quantities?",
    a: "Open the Inventory page, find the item, and click the Adjust Stock action. Choose Increase, Decrease, or Set Quantity, enter the amount and a reason, then confirm. All adjustments are recorded in the Activity log.",
  },
  {
    q: "What does \"Low Stock\" mean?",
    a: "An item is marked Low Stock when its current quantity falls at or below the Minimum Quantity you set for that item. You can configure this threshold when adding or editing an item.",
  },
  {
    q: "How do I create a Purchase List?",
    a: "Go to Purchase Lists and click \"New Purchase List\". Give it a name, then add items from your inventory. You can set requested quantities for each item before adding them to the list.",
  },
  {
    q: "How do I receive items from a Purchase List?",
    a: "Open a Purchase List, find the item you received, and click the Receive button. A confirmation modal will appear where you can enter the quantity received. This action increases the item's stock in your inventory.",
  },
  {
    q: "How do I set up stock alert notifications?",
    a: "Go to Settings → General → Notification Preferences. Toggle on Low Stock, Out of Stock, and/or Expiring Soon alerts. You can choose to be notified In-App or by Email.",
  },
  {
    q: "Can I export my inventory or activity data?",
    a: "Import and bulk adjustment via file upload (PNG, JPG, PDF) are supported in the Activity tab. Full export features are on our roadmap and will be available in a future release.",
  },
  {
    q: "What are the Predictive Analytics and AI features?",
    a: "The Analytics page shows consumption trends, forecasted buying needs, and recommended order timing based on your stock data. The Predictive Analytics section currently displays sample data — full AI-powered insights are coming in a future release.",
  },
  {
    q: "How do I change my password?",
    a: "Go to Settings → Security → Change Password. Enter your current password, then set a new one (minimum 8 characters). Click Change Password and you'll see a confirmation once it's saved.",
  },
  {
    q: "Why can't I edit my email address?",
    a: "Email addresses are managed at the account level and cannot be changed by individual users. Please contact your clinic administrator or reach out to Hexace Support.",
  },
];

function HelpPage({ onBack }: { onBack: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <main className="flex-1 overflow-y-auto px-8 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#4F6FD8] transition-colors mb-4">
            <ChevronLeft size={15} /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-sm text-gray-500 mt-1">Find answers to common questions about Hexace.</p>
        </div>

        {/* Search hint banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F2F5FF] mb-6">
          <HelpCircle size={18} className="text-[#4F6FD8] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#4F6FD8] font-medium leading-snug">
            Browse the FAQs below or contact our support team directly if you need further assistance.
          </p>
        </div>

        {/* FAQ accordion */}
        <div className={`${CARD} divide-y divide-gray-50 mb-6`}>
          {HELP_FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50/60 transition-colors">
                <span className={`text-sm font-medium leading-snug ${openIdx === i ? "text-[#4F6FD8]" : "text-gray-800"}`}>{faq.q}</span>
                <span className="flex-shrink-0 text-gray-400">
                  {openIdx === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              {openIdx === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact support */}
        <div className={`${CARD} p-6 flex flex-col items-center text-center gap-3`}>
          <div className="w-11 h-11 rounded-2xl bg-[#F2F5FF] flex items-center justify-center">
            <HelpCircle size={20} className="text-[#4F6FD8]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Still need help?</p>
            <p className="text-xs text-gray-400 mt-0.5">Our support team is happy to assist you.</p>
          </div>
          <a href="mailto:support@hexace.io"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F6FD8] text-white text-sm font-semibold hover:bg-[#3F5FC2] transition-colors">
            Contact Support
          </a>
          <p className="text-xs text-gray-400">support@hexace.io</p>
        </div>
      </div>
    </main>
  );
}

// ─── ImportHistoryModal ───────────────────────────────────────────────────────

function ImportHistoryModal({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => ACCEPTED.includes(f.type));
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...valid.filter((f) => !existing.has(f.name + f.size))];
    });
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileIcon(file: File) {
    return file.type === "application/pdf"
      ? <FileText size={18} className="text-red-400" />
      : <Package size={18} className="text-blue-400" />;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handleUpload() {
    if (!files.length) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully`);
      onClose();
    }, 1400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Import Inventory History</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload images or PDF files to import activity records</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? "border-[#4F6FD8] bg-blue-50" : "border-gray-200 hover:border-[#4F6FD8] hover:bg-blue-50/40"}`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.webp,.pdf"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <Upload size={28} className={`mx-auto mb-3 ${dragging ? "text-[#4F6FD8]" : "text-gray-300"}`} />
            <p className="text-sm font-medium text-gray-700">Drop files here, or <span className="text-[#4F6FD8]">browse</span></p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, WEBP, PDF — up to 20 MB each</p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((file, idx) => (
                <li key={idx} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  {fileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                  </div>
                  <button onClick={() => removeFile(idx)} className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {files.length === 0 && (
            <p className="text-xs text-center text-gray-400">No files selected yet</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!files.length || uploading}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#4F6FD8] rounded-lg hover:bg-[#3F5FC2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            {uploading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading…</> : <><Upload size={15} />Upload {files.length > 0 ? `(${files.length})` : ""}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Purchase Lists ────────────────────────────────────────────────────────────

function itemReceiptStatus(item: PurchaseListItem): ItemReceiptStatus {
  if (item.receivedQuantity >= item.quantity) return "received";
  if (item.receivedQuantity > 0) return "partial";
  return "pending";
}

function plReceived(list: PurchaseList) {
  return list.items.filter((i) => itemReceiptStatus(i) === "received").length;
}

function plCardStatus(list: PurchaseList): "Open" | "Partially Received" | "All Received" {
  const total = list.items.length;
  const received = plReceived(list);
  if (received === 0) return "Open";
  if (received === total) return "All Received";
  return "Partially Received";
}

// New Purchase List Modal
function NewPurchaseListModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, notes: string) => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) { setError("List name is required"); return; }
    onCreate(name.trim(), notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Purchase List</h2>
            <p className="text-sm text-gray-500 mt-0.5">Create a list to organise incoming orders</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              List Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus type="text" value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. August Restock"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-all ${
                error ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10"}`}
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what this list is for..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 transition-all resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleCreate} className="px-4 py-2 text-sm bg-[#4F6FD8] text-white rounded-lg hover:bg-[#3F5FC2] transition-colors font-medium">
            Create List
          </button>
        </div>
      </div>
    </div>
  );
}

// Card action menu
function CardMenu({ list, onComplete, onDelete }: {
  list: PurchaseList;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));

  const allReceived = plReceived(list) === list.items.length && list.items.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute z-30 right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5">
          <div className="relative group/complete">
            <button
              onClick={() => { if (allReceived) { onComplete(); setOpen(false); } }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                allReceived ? "text-gray-700 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"}`}>
              <CheckCheck size={14} className={allReceived ? "text-emerald-500" : "text-gray-300"} />
              Complete Purchase List
            </button>
            {!allReceived && (
              <div className="absolute left-full top-0 ml-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/complete:opacity-100 transition-opacity pointer-events-none z-40 w-44 leading-snug">
                Mark all items as received first
              </div>
            )}
          </div>
          <div className="my-1 border-t border-gray-100" />
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
            <Trash2 size={14} /> Delete Purchase List
          </button>
        </div>
      )}
    </div>
  );
}

// Delete confirmation
function DeleteListModal({ list, onClose, onConfirm }: {
  list: PurchaseList; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Purchase List?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            <strong className="text-gray-800">"{list.name}"</strong> and all its items will be permanently deleted. This action cannot be undone.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium border border-gray-200">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Purchase List card
function PurchaseListCard({ list, onRename, onComplete, onDelete, onOpen }: {
  list: PurchaseList;
  onRename: (id: number, name: string) => void;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const received = plReceived(list);
  const total = list.items.length;
  const pct = total === 0 ? 0 : Math.round((received / total) * 100);
  const cardStatus = list.status === "Completed" ? "Completed" : plCardStatus(list);
  const isCompleted = list.status === "Completed";

  const statusStyle = {
    Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Partially Received": "bg-amber-50 text-amber-700 border-amber-200",
    "All Received": "bg-blue-50 text-blue-700 border-blue-200",
    Completed: "bg-gray-100 text-gray-500 border-gray-200",
  }[cardStatus];

  return (
    <>
      <div className={`${CARD} flex flex-col`}>
        {/* Card header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <span className="text-base font-semibold text-gray-900 truncate block">{list.name}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}>
                {cardStatus}
              </span>
              {!isCompleted && (
                <CardMenu list={list}
                  onComplete={() => onComplete(list.id)}
                  onDelete={() => setShowDeleteModal(true)}
                />
              )}
            </div>
          </div>

          {/* Items received count */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
            <Boxes size={14} className="text-gray-400" />
            <span>
              <strong className="text-gray-900">{received}</strong> of <strong className="text-gray-900">{total}</strong> items received
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#4F6FD8] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-50" />

        {/* Card footer metadata */}
        <div className="px-5 py-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar size={11} />
            <span>Created: {list.createdAt}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={11} />
            <span>Last update: {list.updatedAt}</span>
          </div>
          {list.notes && (
            <p className="text-xs text-gray-400 truncate mt-0.5" title={list.notes}>{list.notes}</p>
          )}
        </div>

        {/* Footer — click to open detail */}
        <div className="border-t border-gray-50">
          <button onClick={() => onOpen(list.id)}
            className="w-full flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-medium text-[#4F6FD8] hover:bg-[#F2F5FF] transition-colors rounded-b-2xl">
            View Items <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteListModal list={list} onClose={() => setShowDeleteModal(false)} onConfirm={() => onDelete(list.id)} />
      )}
    </>
  );
}

// Success callout shown after creating a new list
function NewListCreatedBanner({ listName, onDismiss, onGoToInventory }: {
  listName: string; onDismiss: () => void; onGoToInventory: () => void;
}) {
  return (
    <div className="bg-[#F2F5FF] border border-[#4F6FD8]/20 rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="w-9 h-9 bg-[#4F6FD8] rounded-xl flex items-center justify-center flex-shrink-0">
        <CheckCheck size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">"{listName}" created!</p>
        <p className="text-xs text-gray-500 mt-0.5">Go to Inventory to select items to add to this list.</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onGoToInventory}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#4F6FD8] text-white text-xs font-medium rounded-lg hover:bg-[#3F5FC2] transition-colors">
          Browse Inventory <ArrowRight size={12} />
        </button>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
      </div>
    </div>
  );
}

// Main Purchase Lists page
function PurchaseListsPage({ purchaseLists, setPurchaseLists, onNavigateToInventory, onOpenDetail }: {
  purchaseLists: PurchaseList[];
  setPurchaseLists: React.Dispatch<React.SetStateAction<PurchaseList[]>>;
  onNavigateToInventory: () => void;
  onOpenDetail: (id: number) => void;
}) {
  const [tab, setTab] = useState<"Active" | "Completed">("Active");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newListBanner, setNewListBanner] = useState<string | null>(null);

  const filtered = purchaseLists.filter((l) => {
    const matchTab = l.status === tab;
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.notes.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const handleCreate = (name: string, notes: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const newList: PurchaseList = {
      id: Date.now(), name, notes, status: "Active",
      items: [], createdAt: dateStr, updatedAt: dateStr,
    };
    setPurchaseLists((prev) => [newList, ...prev]);
    setNewListBanner(name);
    toast.success(`"${name}" purchase list created`);
  };

  const handleRename = (id: number, name: string) => {
    setPurchaseLists((prev) => prev.map((l) => l.id === id ? { ...l, name } : l));
    toast.success("List renamed");
  };

  const handleComplete = (id: number) => {
    setPurchaseLists((prev) => prev.map((l) => l.id === id ? { ...l, status: "Completed" } : l));
    toast.success("Purchase list marked as completed");
  };

  const handleDelete = (id: number) => {
    setPurchaseLists((prev) => prev.filter((l) => l.id !== id));
    toast.success("Purchase list deleted");
  };


  const activeCount = purchaseLists.filter((l) => l.status === "Active").length;
  const completedCount = purchaseLists.filter((l) => l.status === "Completed").length;

  return (
    <main className="flex-1 overflow-y-auto px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Lists</h1>
          <p className="text-sm text-gray-500 mt-1">Create and track purchase lists to manage incoming inventory</p>
        </div>
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F6FD8] text-white text-sm font-semibold rounded-lg hover:bg-[#3F5FC2] transition-colors shadow-sm">
          <Plus size={16} /> New Purchase List
        </button>
      </div>

      {/* New list banner */}
      {newListBanner && (
        <div className="mb-5">
          <NewListCreatedBanner
            listName={newListBanner}
            onDismiss={() => setNewListBanner(null)}
            onGoToInventory={() => { setNewListBanner(null); onNavigateToInventory(); }}
          />
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 border-b border-gray-200 flex-1">
          {(["Active", "Completed"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium relative transition-colors flex items-center gap-2 ${tab === t ? "text-[#4F6FD8]" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tab === t ? "bg-[#4F6FD8]/10 text-[#4F6FD8]" : "bg-gray-100 text-gray-400"}`}>
                {t === "Active" ? activeCount : completedCount}
              </span>
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F6FD8] rounded-full" />}
            </button>
          ))}
        </div>
        <div className="relative w-60 flex-shrink-0 pb-px">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search purchase lists..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4F6FD8] focus:ring-2 focus:ring-[#4F6FD8]/10 bg-white" />
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <ClipboardList size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">
            {search ? "No lists match your search" : tab === "Active" ? "No active purchase lists" : "No completed lists yet"}
          </p>
          {!search && tab === "Active" && (
            <button onClick={() => setShowNewModal(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#4F6FD8] border border-[#4F6FD8]/30 rounded-lg hover:bg-[#4F6FD8]/5 transition-colors">
              <Plus size={14} /> Create your first list
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((list) => (
            <PurchaseListCard key={list.id} list={list}
              onRename={handleRename}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onOpen={onOpenDetail}
            />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewPurchaseListModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />
      )}
    </main>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

type NotifType = "Low Stock" | "Out of Stock" | "Expiring Soon";
interface NotificationEntry {
  id: number;
  type: NotifType;
  productId: number;
  productName: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationEntry[] = [
  { id: 1, type: "Out of Stock",   productId: 3, productName: "Universal Adhesive",       message: "Universal Adhesive is out of stock. Reorder immediately.",                           time: "Jul 28, 2:30 PM", read: false },
  { id: 2, type: "Low Stock",      productId: 2, productName: "Nitrile Gloves — Medium",  message: "Nitrile Gloves — Medium is running low (4 remaining, min 5).",                      time: "Jul 28, 11:00 AM", read: false },
  { id: 3, type: "Low Stock",      productId: 5, productName: "Impression Material",       message: "Impression Material is below minimum quantity (7 in stock, min 8).",                 time: "Jul 27, 3:15 PM", read: false },
  { id: 4, type: "Low Stock",      productId: 8, productName: "Cotton Rolls",              message: "Cotton Rolls stock is low (6 remaining, minimum 10 required).",                      time: "Jul 27, 9:00 AM", read: false },
  { id: 5, type: "Expiring Soon",  productId: 3, productName: "Universal Adhesive",       message: "Universal Adhesive expires Sep 30, 2025. Consider using or replacing soon.",         time: "Jul 26, 4:00 PM", read: true  },
  { id: 6, type: "Expiring Soon",  productId: 1, productName: "Composite A2",             message: "Composite A2 is approaching its expiry date (Dec 31, 2026).",                        time: "Jul 25, 10:00 AM", read: true  },
];

const NOTIF_CFG: Record<NotifType, { icon: React.ReactNode; color: string; bg: string; dot: string }> = {
  "Out of Stock":  { icon: <AlertTriangle size={15} />, color: "#ef4444", bg: "#fef2f2", dot: "#ef4444" },
  "Low Stock":     { icon: <AlertTriangle size={15} />, color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  "Expiring Soon": { icon: <Clock        size={15} />, color: "#f97316", bg: "#fff7ed", dot: "#f97316" },
};

function NotificationsDrawer({ notifications, onClose, onMarkAllRead, onClickNotif }: {
  notifications: NotificationEntry[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onClickNotif: (n: NotificationEntry) => void;
}) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-96 z-50 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Bell size={17} className="text-gray-700" />
            <span className="text-base font-semibold text-gray-900">Notifications</span>
            {unread > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white bg-[#4F6FD8]">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button onClick={onMarkAllRead}
                className="text-xs font-semibold text-[#4F6FD8] hover:text-[#3F5FC2] px-2 py-1 rounded-lg hover:bg-[#F2F5FF] transition-colors">
                Mark all as read
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">{"You're all caught up."}</p>
              <p className="text-xs text-gray-400">No notifications at this time.</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const cfg = NOTIF_CFG[n.type];
                return (
                  <button key={n.id} onClick={() => onClickNotif(n)}
                    className={`w-full text-left px-5 py-4 border-b border-gray-50 last:border-0 transition-colors hover:brightness-95 ${n.read ? "bg-white" : "bg-[#F2F5FF]/60"}`}>
                    <div className="flex items-start gap-3">
                      {/* Type icon */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                        {cfg.icon}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-[11px] font-bold uppercase tracking-wide`} style={{ color: cfg.color }}>{n.type}</span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{n.time}</span>
                        </div>
                        <p className={`text-sm leading-tight mb-1 ${n.read ? "font-medium text-gray-600" : "font-semibold text-gray-900"}`}>{n.productName}</p>
                        <p className={`text-xs leading-snug ${n.read ? "text-gray-400" : "text-gray-500"}`}>{n.message}</p>
                      </div>
                      {/* Unread dot */}
                      <div className="flex-shrink-0 mt-1.5">
                        {!n.read ? (
                          <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: "#4F6FD8" }} />
                        ) : (
                          <span className="block w-2 h-2" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function InventoryApp({ onSignOut }: { onSignOut: () => void }) {
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inventoryPreFilter, setInventoryPreFilter] = useState<string>("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>("");
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [activity, setActivity] = useState<ActivityEntry[]>(INITIAL_ACTIVITY);
  const [purchaseLists, setPurchaseLists] = useState<PurchaseList[]>(INITIAL_PURCHASE_LISTS);
  const [activeTab, setActiveTab] = useState<"items" | "activity">("items");
  const [activityProductFilter, setActivityProductFilter] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationEntry[]>(INITIAL_NOTIFICATIONS);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>("general");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleClickNotif = (n: NotificationEntry) => {
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    setShowNotifDrawer(false);

    const item = items.find((i) => i.id === n.productId);
    if (!item) return;

    setDetailItem(null);
    setActiveTab("items");
    setInventoryStatusFilter("All Status");
    setInventoryPreFilter(item.sku || item.name);
    setCurrentPage("inventory");
  };

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [purchaseTargets, setPurchaseTargets] = useState<InventoryItem[] | null>(null);
  const [removeItem, setRemoveItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);

  const existingSkus = new Set(items.map((i) => i.sku));

  // Mutate helpers
  const updateItem = (id: number, patch: Partial<InventoryItem>) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch, lastUpdated: "Jul 29" } : i));
    if (detailItem?.id === id) setDetailItem((prev) => prev ? { ...prev, ...patch } : null);
  };

  const addActivity = (entry: ActivityEntry) => setActivity((prev) => [entry, ...prev]);

  const handleAdjust = (item: InventoryItem, newQty: number, mode: AdjustMode, reason: string, _note: string) => {
    const change = mode === "Increase" ? newQty - item.quantity : mode === "Decrease" ? newQty - item.quantity : null;
    updateItem(item.id, { quantity: newQty });
    addActivity(makeActivity(item.name, mode as ActivityType, change, item.quantity, newQty, reason));
    toast.success(`Stock updated — ${item.name} is now ${newQty} ${item.unit}`);
  };

  const handleEdit = (item: InventoryItem, patch: Partial<InventoryItem>) => {
    updateItem(item.id, patch);
    addActivity(makeActivity(item.name, "Item Edited", null, null, null, "Inventory information updated"));
    toast.success("Inventory information saved");
  };

  const handleAdd = (name: string, fields: ClinicInventoryFields) => {
    const qty = parseInt(fields.quantity) || 0;
    const minQty = parseInt(fields.minQuantity) || 0;
    const newItem: InventoryItem = {
      id: Date.now(), name, brand: "—", category: "—",
      quantity: qty, minQuantity: minQty, unit: "Unit",
      location: fields.location, sku: `MAN-${Date.now()}`,
      barcode: "—", preferredSupplier: fields.preferredSupplier,
      purchasePrice: fields.purchasePrice, expiryDate: fields.expiryDate,
      internalNote: fields.internalNote, lastUpdated: "Jul 29",
    };
    setItems((prev) => [newItem, ...prev]);
    addActivity(makeActivity(name, "Item Added", null, null, qty, "Initial inventory setup"));
    toast.success(`${name} added to inventory`);
  };

  const handleAdjustBySku = (sku: string) => {
    const item = items.find((i) => i.sku === sku);
    if (item) setAdjustItem(item);
  };

  const handlePurchase = (targets: InventoryItem[], listIds: number[], quantities: number[], newListName?: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const makePLItems = (): PurchaseListItem[] =>
      targets.map((t, i) => ({ id: Date.now() + t.id + i, name: t.name, brand: t.brand, quantity: quantities[i] ?? 1, receivedQuantity: 0, unit: t.unit }));
    setPurchaseLists((prev) => {
      let lists = prev.map((l) => {
        if (!listIds.includes(l.id)) return l;
        const newItems = targets
          .filter((t) => !l.items.some((li) => li.name === t.name))
          .map((t, i) => ({ id: Date.now() + t.id + i, name: t.name, brand: t.brand, quantity: quantities[i] ?? 1, receivedQuantity: 0, unit: t.unit }));
        return { ...l, items: [...l.items, ...newItems], updatedAt: dateStr };
      });
      if (newListName) {
        const newList: PurchaseList = {
          id: Date.now(), name: newListName, notes: "", status: "Active",
          items: makePLItems(),
          createdAt: dateStr, updatedAt: dateStr,
        };
        lists = [newList, ...lists];
      }
      return lists;
    });
    const listNames = newListName ? [newListName] : purchaseLists.filter((l) => listIds.includes(l.id)).map((l) => l.name);
    toast.success(`${targets.length} item${targets.length > 1 ? "s" : ""} added to ${listNames.join(", ")}`);
  };

  const handleRemove = (item: InventoryItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    addActivity(makeActivity(item.name, "Item Removed", null, item.quantity, null, "Removed from active inventory"));
    toast.success(`${item.name} removed from inventory`);
  };

  const handleUpdateList = (id: number, patch: Partial<PurchaseList>) => {
    setPurchaseLists((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l));
  };

  const handleDeleteList = (id: number) => {
    setPurchaseLists((prev) => prev.filter((l) => l.id !== id));
    toast.success("Purchase list deleted");
  };

  const handleOpenDetail = (id: number) => {
    setSelectedListId(id);
    setCurrentPage("purchase-list-detail");
  };

  const handleNavigateToInventoryItem = (name: string) => {
    setInventoryPreFilter(name);
    setCurrentPage("inventory");
  };

  const handleNavigateWithStatusFilter = (filter: StockStatus) => {
    setInventoryStatusFilter(filter);
    setCurrentPage("inventory");
    setActiveTab("items");
  };

  const handleViewActivity = (productName: string) => {
    setActiveTab("activity");
    setActivityProductFilter(productName);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      <Toaster richColors position="bottom-right" />
      {sidebarOpen && (
        <Sidebar
          currentPage={currentPage}
          onNavigate={(p) => { setCurrentPage(p); if (p === "settings") setSettingsInitialTab("general"); }}
          onNavigateSettings={(tab) => { setSettingsInitialTab(tab); setCurrentPage("settings"); }}
          onSignOut={onSignOut}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          unreadCount={unreadCount}
          onOpenNotifications={() => setShowNotifDrawer(true)}
          onOpenHelp={() => setCurrentPage("help")}
        />

        {/* Dashboard page */}
        {currentPage === "dashboard" && (
          <DashboardPage
            items={items}
            onNavigateToInventory={() => setCurrentPage("inventory")}
            onNavigateWithStatusFilter={handleNavigateWithStatusFilter}
          />
        )}

        {/* Analytics page */}
        {currentPage === "analytics" && (
          <AnalyticsPage items={items} onNavigateToInventory={() => setCurrentPage("inventory")} />
        )}

        {/* Settings page */}
        {currentPage === "settings" && <SettingsPage initialTab={settingsInitialTab} />}

        {/* Help page */}
        {currentPage === "help" && <HelpPage onBack={() => setCurrentPage("dashboard")} />}

        {/* Purchase Lists page */}
        {currentPage === "purchase-lists" && (
          <PurchaseListsPage
            purchaseLists={purchaseLists}
            setPurchaseLists={setPurchaseLists}
            onNavigateToInventory={() => setCurrentPage("inventory")}
            onOpenDetail={handleOpenDetail}
          />
        )}

        {/* Purchase List detail */}
        {currentPage === "purchase-list-detail" && (() => {
          const list = purchaseLists.find((l) => l.id === selectedListId);
          if (!list) return null;
          return (
            <PurchaseListDetailPage
              list={list}
              onBack={() => setCurrentPage("purchase-lists")}
              onUpdate={handleUpdateList}
              onDelete={(id) => { handleDeleteList(id); setCurrentPage("purchase-lists"); }}
              onNavigateToInventory={() => setCurrentPage("inventory")}
              onNavigateToInventoryItem={handleNavigateToInventoryItem}
            />
          );
        })()}

        {/* Inventory page */}
        {currentPage === "inventory" && (
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your clinic inventory and stock levels</p>
            </div>
            {activeTab === "items" ? (
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#4F6FD8] text-white text-sm font-semibold rounded-lg hover:bg-[#3F5FC2] transition-colors shadow-sm">
                <PackagePlus size={16} /> Add Inventory Item
              </button>
            ) : (
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#4F6FD8] text-white text-sm font-semibold rounded-lg hover:bg-[#3F5FC2] transition-colors shadow-sm">
                <Upload size={16} /> Import History
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
            {(["items", "activity"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative capitalize ${activeTab === tab ? "text-[#4F6FD8]" : "text-gray-500 hover:text-gray-700"}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F6FD8] rounded-full" />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="space-y-4">
            {activeTab === "items" ? (
              <ItemsTab
                items={items}
                initialSearch={inventoryPreFilter}
                initialStatusFilter={inventoryStatusFilter}
                onSearchConsumed={() => setInventoryPreFilter("")}
                onStatusFilterConsumed={() => setInventoryStatusFilter("")}
                onAdjust={setAdjustItem}
                onEdit={setEditItem}
                onPurchase={setPurchaseTargets}
                onRemove={setRemoveItem}
                onViewActivity={handleViewActivity}
                onViewDetail={setDetailItem}
              />
            ) : (
              <ActivityTab
                activity={activity}
                productFilter={activityProductFilter}
                onClearProductFilter={() => setActivityProductFilter(null)}
              />
            )}
          </div>
        </main>
        )}
      </div>

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <NotificationsDrawer
          notifications={notifications}
          onClose={() => setShowNotifDrawer(false)}
          onMarkAllRead={handleMarkAllRead}
          onClickNotif={handleClickNotif}
        />
      )}

      {/* Drawers & Modals */}
      {detailItem && (
        <ItemDetailsDrawer
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAdjust={setAdjustItem}
          onEdit={setEditItem}
          onPurchase={setPurchaseTargets}
          onRemove={setRemoveItem}
          onViewActivity={handleViewActivity}
        />
      )}

      {adjustItem && (
        <AdjustQuantityModal item={adjustItem} onClose={() => setAdjustItem(null)}
          onSave={(item, qty, mode, reason, note) => handleAdjust(item, qty, mode, reason, note)} />
      )}

      {editItem && (
        <EditInventoryModal item={editItem} onClose={() => setEditItem(null)}
          onSave={(patch) => handleEdit(editItem, patch)} />
      )}

      {purchaseTargets && (
        <AddToPurchaseListModal
          targets={purchaseTargets}
          purchaseLists={purchaseLists}
          onClose={() => setPurchaseTargets(null)}
          onSave={(listIds, quantities, newName) => { handlePurchase(purchaseTargets, listIds, quantities, newName); setPurchaseTargets(null); }}
        />
      )}

      {removeItem && (
        <RemoveConfirmModal item={removeItem} onClose={() => setRemoveItem(null)}
          onConfirm={() => handleRemove(removeItem)} />
      )}

      {showAddModal && (
        <AddInventoryModal
          existingSkus={existingSkus}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
          onAdjust={(sku) => { handleAdjustBySku(sku); setShowAddModal(false); }}
        />
      )}

      {showImportModal && (
        <ImportHistoryModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}
