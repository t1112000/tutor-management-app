export const STUDENT_COLORS = [
  { hex: "#6BA8F0", bg: "linear-gradient(150deg,#6BA8F0,#90C2FA,#A8D4FD)", shadow: "rgba(107,168,240,0.40)" },
  { hex: "#F07888", bg: "linear-gradient(150deg,#F07888,#F8A0B0,#FAB8C4)", shadow: "rgba(240,120,136,0.36)" },
  { hex: "#7ECBA0", bg: "linear-gradient(150deg,#7ECBA0,#98DCC0,#B0EAD0)", shadow: "rgba(126,203,160,0.40)" },
  { hex: "#B088F0", bg: "linear-gradient(150deg,#B088F0,#CCAAF8,#DAC0FC)", shadow: "rgba(176,136,240,0.40)" },
  { hex: "#F0A860", bg: "linear-gradient(150deg,#F0A860,#F8C080,#FAD098)", shadow: "rgba(240,168,96,0.40)" },
  { hex: "#60C8D8", bg: "linear-gradient(150deg,#60C8D8,#80DCEA,#9EECF8)", shadow: "rgba(96,200,216,0.40)" },
  { hex: "#E8C860", bg: "linear-gradient(150deg,#E8C860,#F4D878,#F8E290)", shadow: "rgba(232,200,96,0.40)" },
  { hex: "#F09090", bg: "linear-gradient(150deg,#F09090,#F8B0B0,#FAC8C8)", shadow: "rgba(240,144,144,0.40)" },
] as const;

export type StudentColor = (typeof STUDENT_COLORS)[number];

export function findColor(hex: string | null): StudentColor {
  return STUDENT_COLORS.find((c) => c.hex === hex) ?? STUDENT_COLORS[0];
}

export function hashColor(name: string): StudentColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return STUDENT_COLORS[hash % STUDENT_COLORS.length];
}
