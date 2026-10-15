import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from './models/error-response';

/**
 * Texto para mostrar ao usuário a partir de um erro HTTP.
 *
 * <p>O back já devolve `ErrorResponse.message` pronto para leitura — inclusive
 * no 429 do rate limit, que informa quantos minutos faltam. Só os casos em que
 * não há corpo é que precisam de texto nosso.
 */
export function mensagemDoErro(erro: unknown): string {
  if (!(erro instanceof HttpErrorResponse)) {
    return 'Erro inesperado';
  }

  const corpo = erro.error as ErrorResponse | null;
  if (corpo?.message) {
    return corpo.message;
  }

  if (erro.status === 0) {
    return 'Não foi possível falar com o servidor. Verifique se o back está no ar.';
  }

  if (erro.status >= 500) {
    return 'O servidor respondeu com erro. Verifique o log do back.';
  }

  return 'Erro inesperado';
}
