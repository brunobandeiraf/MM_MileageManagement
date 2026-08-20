import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export type SortOrder = 'asc' | 'desc'

interface SortableThProps {
  label: string
  column: string
  currentSort: string
  currentOrder: SortOrder
  onSort: (column: string) => void
  className?: string
}

/**
 * SortableTh — clickable table header cell. Clicking toggles asc/desc when
 * it's already the active sort column, or switches to this column (starting
 * at asc) otherwise. Shared by every list page (Usuários, Bancos, Programas
 * de Fidelidade de Bancos) so the sorting affordance looks and behaves the
 * same everywhere.
 */
export function SortableTh({ label, column, currentSort, currentOrder, onSort, className }: SortableThProps) {
  const isActive = currentSort === column

  return (
    <th className={cn('px-4 py-3 font-medium', className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="flex items-center gap-1 transition-colors hover:text-foreground"
        aria-label={`Ordenar por ${label}${isActive ? (currentOrder === 'asc' ? ', crescente' : ', decrescente') : ''}`}
      >
        {label}
        {isActive ? (
          currentOrder === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5 text-blue-600 dark:text-amber-500" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-blue-600 dark:text-amber-500" aria-hidden="true" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
        )}
      </button>
    </th>
  )
}
