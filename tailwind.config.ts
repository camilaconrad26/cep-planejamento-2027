import type { Config } from "tailwindcss";

// Identidade do CEP (cep.protecaofamiliaempresa.com).
// `ouro` só sobre fundo escuro; sobre papel, o dourado de texto é `ouro-texto`.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noite: { DEFAULT: "#0b0b0d", 2: "#16161a", 3: "#1d1d22" },
        faixa: "#111114",
        ouro: { DEFAULT: "#e8c766", fio: "#c9a24b", escuro: "#9a7b33", texto: "#7a6022" },
        creme: "#f6f2e8",
        "cinza-claro": "#ccc9c2",
        cinza: "#a39b86",
        papel: { DEFAULT: "#fbf8f1", 2: "#f3ede0" },
        tinta: "#2a2620",
        texto: "#3a352b",
        sec: "#6b6253",
        "borda-campo": "#8c7f66",
        ok: "#3f6b3a",
        alerta: "#9a4420",
      },
      borderColor: { linha: "rgba(122,96,34,.25)", "linha-escura": "rgba(232,199,102,.22)" },
      fontFamily: {
        display: ["Georgia", "var(--fonte-gelasio)", "serif"],
        corpo: ["Calibri", "var(--fonte-carlito)", '"Segoe UI"', "system-ui", "sans-serif"],
      },
      borderRadius: { cartao: "10px" },
      letterSpacing: { olho: ".28em" },
    },
  },
  plugins: [],
};
export default config;
