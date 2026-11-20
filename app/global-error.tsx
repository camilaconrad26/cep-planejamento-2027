"use client";

export default function ErroGeral({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#0b0b0d", color: "#f6f2e8", fontFamily: "Georgia, serif", minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, textAlign: "center" }}>
        <main>
          <h1>Algo não funcionou</h1>
          <p style={{ fontFamily: "Calibri, Carlito, sans-serif" }}>O sistema teve um problema ao abrir. Tente de novo em instantes.</p>
          <button type="button" onClick={() => reset()} style={{ minHeight: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#e8c766", color: "#0b0b0d", fontWeight: 700 }}>Tentar de novo</button>
        </main>
      </body>
    </html>
  );
}
