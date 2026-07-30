import { Boxes, Factory, MoreHorizontal, Ship, Truck, type LucideIcon } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaTelegram,
  FaThreads,
  FaTiktok,
  FaViber,
  FaWhatsapp,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

export interface SupplierTypeOption {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
}

// Довідка праворуч у формі постачальника — легенда до Select "Тип постачальника".
export const SUPPLIER_TYPE_OPTIONS: SupplierTypeOption[] = [
  {
    value: "manufacturer",
    label: "Виробник",
    description: "Власне виробництво товару",
    icon: Factory,
    colorClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    value: "distributor",
    label: "Дистриб'ютор",
    description: "Офіційний представник бренду в регіоні",
    icon: Truck,
    colorClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
  {
    value: "wholesaler",
    label: "Оптовик",
    description: "Оптовий продаж без прив'язки до бренду",
    icon: Boxes,
    colorClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "importer",
    label: "Імпортер",
    description: "Завозить товар з-за кордону",
    icon: Ship,
    colorClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  {
    value: "other",
    label: "Інше",
    description: "Інший тип співпраці",
    icon: MoreHorizontal,
    colorClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
];

export interface SupplierChannelOption {
  value: string;
  label: string;
  /** Фірмова іконка (react-icons/fa6) — lucide-react брендових лого не має. */
  icon: IconType;
  color: string;
}

export const MESSENGER_CHANNELS: SupplierChannelOption[] = [
  { value: "telegram", label: "Telegram", icon: FaTelegram, color: "#26A5E4" },
  { value: "viber", label: "Viber", icon: FaViber, color: "#7360F2" },
  { value: "whatsapp", label: "WhatsApp", icon: FaWhatsapp, color: "#25D366" },
];

export const SOCIAL_CHANNELS: SupplierChannelOption[] = [
  { value: "facebook", label: "Facebook", icon: FaFacebook, color: "#1877F2" },
  { value: "instagram", label: "Instagram", icon: FaInstagram, color: "#E1306C" },
  { value: "tiktok", label: "TikTok", icon: FaTiktok, color: "#000000" },
  { value: "threads", label: "Threads", icon: FaThreads, color: "#000000" },
];
