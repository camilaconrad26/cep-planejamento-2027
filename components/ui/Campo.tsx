import { cloneElement, isValidElement, useId, type ReactElement } from "react";

type Props = { rotulo: string; ajuda?: string; erro?: string; children: ReactElement<Record<string, unknown>> };

/** Rótulo + campo + ajuda + erro, com ligação acessível (aria-describedby / aria-invalid). */
export function Campo({ rotulo, ajuda, erro, children }: Props) {
  const id = useId();
  const idCampo = (isValidElement(children) && (children.props.id as string)) || `${id}-campo`;
  const desc = [ajuda && `${id}-ajuda`, erro && `${id}-erro`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-[0.9rem] text-sec">
      <label htmlFor={idCampo} className="font-bold text-tinta">{rotulo}</label>
      {cloneElement(children, { id: idCampo, "aria-describedby": desc, "aria-invalid": erro ? true : undefined })}
      {ajuda && <p id={`${id}-ajuda`}>{ajuda}</p>}
      {erro && <p id={`${id}-erro`} className="font-bold text-alerta">{erro}</p>}
    </div>
  );
}
