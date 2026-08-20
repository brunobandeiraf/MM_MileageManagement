interface BankRef {
  id: string
  name: string
}

/**
 * BankMultiSelect — checkbox list used to pick one or more banks from the
 * global catalog. Shared by the loyalty-program editor (which banks offer
 * this program), the user editor (which banks an ADMIN/FUNCIONARIO assigns
 * to a managed user) and the profile dialog (self-service assignment).
 */
export function BankMultiSelect({
  banks,
  selectedIds,
  onToggle,
  disabled,
  idPrefix,
}: {
  banks: BankRef[]
  selectedIds: Set<string>
  onToggle: (bankId: string) => void
  disabled: boolean
  idPrefix: string
}) {
  if (banks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum banco cadastrado ainda.
      </p>
    )
  }

  return (
    <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input p-3">
      {banks.map((bank) => (
        <label
          key={bank.id}
          htmlFor={`${idPrefix}-${bank.id}`}
          className="flex items-center gap-2 text-sm cursor-pointer"
        >
          <input
            id={`${idPrefix}-${bank.id}`}
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-blue-600 dark:accent-amber-500"
            checked={selectedIds.has(bank.id)}
            onChange={() => onToggle(bank.id)}
            disabled={disabled}
          />
          {bank.name}
        </label>
      ))}
    </div>
  )
}
