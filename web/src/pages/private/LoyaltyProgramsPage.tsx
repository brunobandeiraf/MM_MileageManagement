import * as React from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog'
import { useToast } from '../../components/ui/use-toast'
import { BankMultiSelect } from '../../components/shared/BankMultiSelect'
import { LogoUpload } from '../../components/shared/LogoUpload'
import { SortableTh, type SortOrder } from '../../components/shared/SortableTh'

interface BankRef {
  id: string
  name: string
}

interface LoyaltyProgram {
  id: string
  name: string
  logo_url: string | null
  created_at: string
  banks: BankRef[]
}

/**
 * LoyaltyProgramsPage — catálogo global de programas de fidelidade de bancos (ADMIN).
 *
 * Específico de bancos: no futuro, programas de fidelidade de companhias
 * aéreas serão um catálogo separado.
 *
 * Um programa (ex.: Livelo) pode pertencer a um ou mais bancos; o vínculo é
 * gerenciado aqui, a partir do programa, via seleção múltipla de bancos.
 */
export function LoyaltyProgramsPage() {
  const { toast } = useToast()

  const [programs, setPrograms] = React.useState<LoyaltyProgram[]>([])
  const [banks, setBanks] = React.useState<BankRef[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')

  const [createOpen, setCreateOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState('')
  const [createLogoUrl, setCreateLogoUrl] = React.useState<string | null>(null)
  const [createBankIds, setCreateBankIds] = React.useState<Set<string>>(new Set())
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)

  const [editProgram, setEditProgram] = React.useState<LoyaltyProgram | null>(null)
  const [editName, setEditName] = React.useState('')
  const [editLogoUrl, setEditLogoUrl] = React.useState<string | null>(null)
  const [editBankIds, setEditBankIds] = React.useState<Set<string>>(new Set())
  const [editError, setEditError] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  const [deleteProgram, setDeleteProgram] = React.useState<LoyaltyProgram | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const [programsRes, banksRes] = await Promise.all([
        apiGet<{ data: LoyaltyProgram[] }>('/loyalty-programs'),
        apiGet<{ data: BankRef[] }>('/banks'),
      ])
      setPrograms(programsRes.data)
      setBanks(banksRes.data)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao carregar programas de fidelidade.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const [sortBy, setSortBy] = React.useState<'name' | 'banks'>('name')
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc')

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column as 'name' | 'banks')
      setSortOrder('asc')
    }
  }

  const filteredPrograms = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? programs.filter(
          (program) =>
            program.name.toLowerCase().includes(term) ||
            program.banks.some((bank) => bank.name.toLowerCase().includes(term))
        )
      : programs

    const sorted = [...filtered].sort((a, b) => {
      const cmp = sortBy === 'name' ? a.name.localeCompare(b.name, 'pt-BR') : a.banks.length - b.banks.length
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [programs, search, sortBy, sortOrder])

  // ── Create ───────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateName('')
    setCreateLogoUrl(null)
    setCreateBankIds(new Set())
    setCreateError(null)
    setCreateOpen(true)
  }

  const toggleCreateBank = (bankId: string) => {
    setCreateBankIds((prev) => {
      const next = new Set(prev)
      if (next.has(bankId)) next.delete(bankId)
      else next.add(bankId)
      return next
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setIsCreating(true)
    try {
      await apiPost('/loyalty-programs', {
        name: createName,
        bankIds: Array.from(createBankIds),
        logo_url: createLogoUrl,
      })
      setCreateOpen(false)
      await fetchData()
      toast({ title: 'Programa criado', description: `${createName} foi adicionado com sucesso.` })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar programa de fidelidade.')
    } finally {
      setIsCreating(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────

  const openEdit = (program: LoyaltyProgram) => {
    setEditProgram(program)
    setEditName(program.name)
    setEditLogoUrl(program.logo_url)
    setEditBankIds(new Set(program.banks.map((b) => b.id)))
    setEditError(null)
  }

  const toggleEditBank = (bankId: string) => {
    setEditBankIds((prev) => {
      const next = new Set(prev)
      if (next.has(bankId)) next.delete(bankId)
      else next.add(bankId)
      return next
    })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProgram) return
    setEditError(null)
    setIsEditing(true)
    try {
      await apiPut(`/loyalty-programs/${editProgram.id}`, {
        name: editName,
        bankIds: Array.from(editBankIds),
        logo_url: editLogoUrl,
      })
      setEditProgram(null)
      await fetchData()
      toast({ title: 'Programa atualizado', description: `${editName} foi atualizado com sucesso.` })
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao atualizar programa de fidelidade.')
    } finally {
      setIsEditing(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────

  const openDelete = (program: LoyaltyProgram) => {
    setDeleteProgram(program)
    setDeleteError(null)
  }

  const handleDelete = async () => {
    if (!deleteProgram) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await apiDelete(`/loyalty-programs/${deleteProgram.id}`)
      const deletedName = deleteProgram.name
      setDeleteProgram(null)
      await fetchData()
      toast({ title: 'Programa removido', description: `${deletedName} foi removido com sucesso.` })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao remover programa de fidelidade.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Programas de Fidelidade de Bancos</h1>
        <Button onClick={openCreate}>Novo Programa</Button>
      </div>

      <div className="max-w-sm">
        <Input
          type="search"
          placeholder="Buscar por nome do programa ou do banco…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar programas por nome do programa ou do banco"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Carregando programas de fidelidade…
        </div>
      )}

      {!isLoading && fetchError && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      {!isLoading && !fetchError && (
        <div className="rounded-md border max-h-[65vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted/95 backdrop-blur-sm text-left">
                <SortableTh label="Nome" column="name" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableTh
                  label="Bancos Vinculados"
                  column="banks"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum programa de fidelidade encontrado.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((program) => (
                  <tr key={program.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                          {program.logo_url ? (
                            <img src={program.logo_url} alt={program.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {program.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {program.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {program.banks.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {program.banks.map((bank) => (
                            <Badge
                              key={bank.id}
                              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
                            >
                              {bank.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(program)}>
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDelete(program)}>
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Dialog ─────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Programa de Fidelidade de Banco</DialogTitle>
            <DialogDescription>
              Cadastre um programa (ex.: Livelo, Esfera) e selecione a quais bancos ele pertence. Um
              programa pode estar vinculado a um ou mais bancos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex justify-center">
              <LogoUpload
                logoUrl={createLogoUrl}
                onChange={setCreateLogoUrl}
                disabled={isCreating}
                alt={createName || 'Novo programa'}
                idPrefix="create-program"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-program-name">Nome do programa</Label>
              <Input
                id="create-program-name"
                type="text"
                placeholder="Ex.: Livelo"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label>Bancos vinculados</Label>
              <BankMultiSelect
                banks={banks}
                selectedIds={createBankIds}
                onToggle={toggleCreateBank}
                disabled={isCreating}
                idPrefix="create-program-bank"
              />
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando…' : 'Criar Programa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={editProgram !== null} onOpenChange={(open) => { if (!open) setEditProgram(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Programa de Fidelidade de Banco</DialogTitle>
            <DialogDescription>Atualize o nome e os bancos vinculados a este programa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="flex justify-center">
              <LogoUpload
                logoUrl={editLogoUrl}
                onChange={setEditLogoUrl}
                disabled={isEditing}
                alt={editName}
                idPrefix="edit-program"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-program-name">Nome do programa</Label>
              <Input
                id="edit-program-name"
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Bancos vinculados</Label>
              <BankMultiSelect
                banks={banks}
                selectedIds={editBankIds}
                onToggle={toggleEditBank}
                disabled={isEditing}
                idPrefix="edit-program-bank"
              />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditProgram(null)} disabled={isEditing}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? 'Salvando…' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────────── */}
      <Dialog open={deleteProgram !== null} onOpenChange={(open) => { if (!open) setDeleteProgram(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Programa de Fidelidade de Banco</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold">{deleteProgram?.name}</span>?
              Ele será desvinculado de todos os bancos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteProgram(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
