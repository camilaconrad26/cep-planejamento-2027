import Image from "next/image";

export function Selo({ tamanho = "normal" }: { tamanho?: "normal" | "grande" }) {
  const g = tamanho === "grande";
  return (
    <Image
      src={g ? "/cep-selo-grande.webp" : "/cep-selo.webp"}
      alt=""
      width={g ? 168 : 56}
      height={g ? 168 : 56}
      priority={g}
      className={g ? "h-[104px] w-[104px] drop-shadow-[0_0_28px_rgba(232,199,102,.18)] lg:h-[168px] lg:w-[168px]" : "h-14 w-14"}
    />
  );
}
