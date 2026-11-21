"use client";
import { Botao } from "@/components/ui/Botao";
export const BotaoImprimir = () => <Botao onClick={() => window.print()}>Imprimir ou salvar em PDF</Botao>;
