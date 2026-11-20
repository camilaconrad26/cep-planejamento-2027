import { Selo } from "@/components/ui/Selo";
import { Olho } from "@/components/ui/Olho";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="escuro flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-wrap items-center gap-x-16 gap-y-8 px-5 py-10 lg:py-14">
        <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-4">
          <Selo tamanho="grande" />
          <Olho sobreEscuro>Turma 2027 · Área da aluna</Olho>
          <p className="font-display text-[2.1rem] font-bold leading-[1.07] text-creme lg:text-[2.9rem]">
            Planejamento Estratégico <span className="text-ouro">2027</span>
          </p>
          <p className="max-w-[46ch] text-lg">Olhe para 2026, defina as metas e desdobre o ano do estratégico ao operacional, trimestre a trimestre.</p>
          <p className="mt-2 border-l-[1.5px] border-ouro-fio pl-4 font-display text-xl italic text-cinza">&quot;Antes do litígio, existe decisão.&quot;</p>
        </div>
        <div className="w-full max-w-[440px] flex-[1_1_360px]">{children}</div>
      </main>
      <footer className="border-t border-linha-escura bg-noite">
        <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-x-6 gap-y-2 px-5 py-6 text-sm text-cinza">
          <span>CEP · Clube da Estratégia Patrimonial</span><span>Planejamento Estratégico 2027</span>
        </div>
      </footer>
    </div>
  );
}
