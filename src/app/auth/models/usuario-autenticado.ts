import { CodigoPermissao } from '../../papel/models/permissao';

/**
 * O que o front sabe de quem está logado — extraído das claims do access
 * token. `id` vem de `sub`, `permissoes` de `groups` e `produtorId` da claim
 * `produtor`, exatamente como o back monta o JWT em AuthService.gerarTokens().
 */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  /**
   * O que a pessoa pode fazer, já no formato `recurso:acao`. Vem do papel do
   * vínculo; para o super admin a lista chega vazia, porque ele não tem papel
   * — quem responde por ele é o `superAdmin`.
   */
  permissoes: CodigoPermissao[];
  /**
   * Nome do papel, só para exibir no cabeçalho. Nada decide por ele — quem
   * responde "pode?" é `permissoes`.
   */
  papelNome: string;
  /** Ausente quando é super admin: ele não entra "dentro" de um produtor. */
  produtorId?: string;
  superAdmin: boolean;
  /** `exp` do JWT, em segundos desde a época. */
  expiraEm: number;
}
