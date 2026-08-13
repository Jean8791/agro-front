/**
 * Espelha papel/enums/Permissao.java — o nome da constante, que é como o
 * papel a guarda e como ela viaja nos DTOs.
 */
export type Permissao =
  | 'USUARIO_LISTAR'
  | 'USUARIO_INSERIR'
  | 'USUARIO_EDITAR'
  | 'USUARIO_EXCLUIR'
  | 'USUARIO_BLOQUEAR'
  | 'PAPEL_LISTAR'
  | 'PAPEL_INSERIR'
  | 'PAPEL_EDITAR'
  | 'PAPEL_EXCLUIR';

/**
 * O código `recurso:acao` que viaja na claim `groups` do token — é isso que o
 * `@RolesAllowed` do back compara, e o que a diretiva `*appSePode` recebe.
 *
 * <p>São dois vocabulários para a mesma coisa de propósito: o DTO fala em
 * constante (`USUARIO_INSERIR`) porque é enum no Java, e o token fala em
 * código (`usuario:inserir`) porque é o que a anotação cita.
 */
export type CodigoPermissao =
  | 'usuario:listar'
  | 'usuario:inserir'
  | 'usuario:editar'
  | 'usuario:excluir'
  | 'usuario:bloquear'
  | 'papel:listar'
  | 'papel:inserir'
  | 'papel:editar'
  | 'papel:excluir';

/** Converte a constante do DTO no código que o token carrega. */
export function codigoDaPermissao(permissao: Permissao): CodigoPermissao {
  const [recurso, acao] = permissao.split('_');
  return `${recurso.toLowerCase()}:${acao.toLowerCase()}` as CodigoPermissao;
}

/** Espelha papel/dto/RecursoResponse.AcaoResponse. */
export interface AcaoDoRecurso {
  permissao: Permissao;
  acao: 'LISTAR' | 'INSERIR' | 'EDITAR' | 'EXCLUIR' | 'BLOQUEAR';
  rotulo: string;
}

/**
 * Espelha papel/dto/RecursoResponse.java — uma linha da matriz de permissões.
 * Vem pronta do back para que tela nova apareça aqui sem mexer no front.
 */
export interface RecursoComAcoes {
  recurso: string;
  rotulo: string;
  acoes: AcaoDoRecurso[];
}
