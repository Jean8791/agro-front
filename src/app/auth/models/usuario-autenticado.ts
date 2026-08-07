import { Papel } from '../../usuario/models/papel';

/**
 * O que o front sabe de quem está logado — extraído das claims do access
 * token. `id` vem de `sub`, `papel` de `groups` e `produtorId` da claim
 * `produtor`, exatamente como o back monta o JWT em AuthService.gerarTokens().
 */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  /** Papel no produtor, ou SUPER_ADMIN para usuário do produto. */
  papel: Papel | 'SUPER_ADMIN';
  /** Ausente quando é super admin: ele não entra "dentro" de um produtor. */
  produtorId?: string;
  superAdmin: boolean;
  /** `exp` do JWT, em segundos desde a época. */
  expiraEm: number;
}
