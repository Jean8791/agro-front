/** Espelha produtor/enums/Papel.java — o papel da pessoa dentro do produtor. */
export type Papel = 'ADMIN' | 'OPERACIONAL' | 'CONSULTA';

/** Papel de quem é usuário do produto, não de um produtor. Vem no `groups`. */
export const SUPER_ADMIN = 'SUPER_ADMIN';

export const PAPEIS: ReadonlyArray<{ label: string; value: Papel }> = [
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Operacional', value: 'OPERACIONAL' },
  { label: 'Consulta', value: 'CONSULTA' },
];

export function rotuloDoPapel(papel: Papel): string {
  return PAPEIS.find((p) => p.value === papel)?.label ?? papel;
}
