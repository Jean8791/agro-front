import { Pipe, PipeTransform } from '@angular/core';

const REAIS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DECIMAL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatarReais(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : REAIS.format(valor);
}

export function formatarDecimal(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : DECIMAL.format(valor);
}

@Pipe({ name: 'reais' })
export class ReaisPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return formatarReais(valor);
  }
}

@Pipe({ name: 'decimal' })
export class DecimalPtPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return formatarDecimal(valor);
  }
}
