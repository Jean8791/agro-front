/** Espelha raiox/checklist/enums/ModuloChecklist.java. */
export type ModuloChecklist = 'VEGETAL' | 'ANIMAL' | 'AMBOS';

/** Espelha raiox/checklist/dto/ChecklistItemResponse.java. */
export interface ChecklistItem {
  id: string;
  modulo: ModuloChecklist;
  rotulo: string;
  nota: string;
}

/** Espelha raiox/checklist/dto/ChecklistItemRequest.java. */
export interface ChecklistItemRequest {
  modulo: ModuloChecklist;
  rotulo: string;
  nota: string;
}
