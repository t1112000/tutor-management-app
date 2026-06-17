export const STUDENT_COLORS = [
  // Row 1
  { hex: "#ABDEE6", bg: "linear-gradient(150deg,#ABDEE6,#C5EBF0)", shadow: "rgba(171,222,230,0.35)" },
  { hex: "#CBAACB", bg: "linear-gradient(150deg,#CBAACB,#DBBFDB)", shadow: "rgba(203,170,203,0.35)" },
  { hex: "#FFCCB6", bg: "linear-gradient(150deg,#FFCCB6,#FFD9C8)", shadow: "rgba(255,204,182,0.35)" },
  { hex: "#F3B0C3", bg: "linear-gradient(150deg,#F3B0C3,#F8C5D3)", shadow: "rgba(243,176,195,0.35)" },
  // Row 2
  { hex: "#C6DBDA", bg: "linear-gradient(150deg,#C6DBDA,#D6E8E7)", shadow: "rgba(198,219,218,0.35)" },
  { hex: "#FED7C3", bg: "linear-gradient(150deg,#FED7C3,#FEE4D5)", shadow: "rgba(254,215,195,0.35)" },
  { hex: "#ECD5E3", bg: "linear-gradient(150deg,#ECD5E3,#F3E3EE)", shadow: "rgba(236,213,227,0.35)" },
  // Row 3
  { hex: "#FF968A", bg: "linear-gradient(150deg,#FF968A,#FFAEA5)", shadow: "rgba(255,150,138,0.35)" },
  { hex: "#FFAEA5", bg: "linear-gradient(150deg,#FFAEA5,#FFC3BC)", shadow: "rgba(255,174,165,0.35)" },
  { hex: "#FFC8A2", bg: "linear-gradient(150deg,#FFC8A2,#FFD5B8)", shadow: "rgba(255,200,162,0.35)" },
  // Row 4
  { hex: "#8FCACA", bg: "linear-gradient(150deg,#8FCACA,#AADADA)", shadow: "rgba(143,202,202,0.35)" },
  { hex: "#CCE2CB", bg: "linear-gradient(150deg,#CCE2CB,#DBECDA)", shadow: "rgba(204,226,203,0.35)" },
  { hex: "#97C1A9", bg: "linear-gradient(150deg,#97C1A9,#AECFBB)", shadow: "rgba(151,193,169,0.35)" },
  // Row 5
  { hex: "#FCB9AA", bg: "linear-gradient(150deg,#FCB9AA,#FDCCC0)", shadow: "rgba(252,185,170,0.35)" },
  { hex: "#A2E1DB", bg: "linear-gradient(150deg,#A2E1DB,#BBEAE6)", shadow: "rgba(162,225,219,0.35)" },
  { hex: "#55CBCD", bg: "linear-gradient(150deg,#55CBCD,#7DD8DA)", shadow: "rgba(85,203,205,0.35)" },
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
