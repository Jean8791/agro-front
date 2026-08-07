import { MatPaginatorIntl } from '@angular/material/paginator';

/** Textos do paginador em português — o Material só traz o inglês. */
export function paginatorIntlPtBr(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();

  intl.itemsPerPageLabel = 'Itens por página';
  intl.firstPageLabel = 'Primeira página';
  intl.previousPageLabel = 'Página anterior';
  intl.nextPageLabel = 'Próxima página';
  intl.lastPageLabel = 'Última página';

  intl.getRangeLabel = (pagina: number, tamanho: number, total: number): string => {
    if (total === 0) {
      return '0 de 0';
    }
    const inicio = pagina * tamanho;
    const fim = Math.min(inicio + tamanho, total);
    return `${inicio + 1} – ${fim} de ${total}`;
  };

  return intl;
}
