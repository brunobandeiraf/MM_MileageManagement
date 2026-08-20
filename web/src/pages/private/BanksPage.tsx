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
import { LogoUpload } from '../../components/shared/LogoUpload'
import { SortableTh, type SortOrder } from '../../components/shared/SortableTh'

interface LoyaltyProgramRef {
  id: string
  name: string
}

interface Bank {
  id: string
  name: string
  logo_url: string | null
  created_at: string
  loyaltyPrograms: LoyaltyProgramRef[]
}

/**
 * BanksPage — catálogo global de bancos (ADMIN).
 *
 * Um cliente pode ter um ou mais bancos vinculados a ele; esta página gerencia
 * apenas o cadastro global (nome do banco). O vínculo com programas de
 * fidelidade é gerenciado em "Programas de Fidelidade de Bancos".
 */
export function BanksPage() {
  const { toast } = useToast()

  const [banks, setBanks] = React.useState<Bank[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')

  const [createOpen, setCreateOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState('')
  const [createLogoUrl, setCreateLogoUrl] = React.useState<string | null>(null)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)

  const [editBank, setEditBank] = React.useState<Bank | null>(null)
  const [editName, setEditName] = React.useState('')
  const [editLogoUrl, setEditLogoUrl] = React.useState<string | null>(null)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  const [deleteBank, setDeleteBank] = React.useState<Bank | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const fetchBanks = React.useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const res = await apiGet<{ data: Bank[] }>('/banks')
      setBanks(res.data)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao carregar bancos.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBanks()
  }, [fetchBanks])

  const [sortBy, setSortBy] = React.useState<'name' | 'programs'>('name')
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc')

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column as 'name' | 'programs')
      setSortOrder('asc')
    }
  }

  const filteredBanks = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? banks.filter(
          (bank) =>
            bank.name.toLowerCase().includes(term) ||
            bank.loyaltyPrograms.some((program) => program.name.toLowerCase().includes(term))
        )
      : banks

    const sorted = [...filtered].sort((a, b) => {
      const cmp =
        sortBy === 'name'
          ? a.name.localeCompare(b.name, 'pt-BR')
          : a.loyaltyPrograms.length - b.loyaltyPrograms.length
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [banks, search, sortBy, sortOrder])

  // ── Create ───────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateName('')
    setCreateLogoUrl(null)
    setCreateError(null)
    setCreateOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setIsCreating(true)
    try {
      await apiPost('/banks', { name: createName, logo_url: createLogoUrl })
      setCreateOpen(false)
      await fetchBanks()
      toast({ title: 'Banco criado', description: `${createName} foi adicionado com sucesso.` })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar banco.')
    } finally {
      setIsCreating(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────

  const openEdit = (bank: Bank) => {
    setEditBank(bank)
    setEditName(bank.name)
    setEditLogoUrl(bank.logo_url)
    setEditError(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBank) return
    setEditError(null)
    setIsEditing(true)
    try {
      await apiPut(`/banks/${editBank.id}`, { name: editName, logo_url: editLogoUrl })
      setEditBank(null)
      await fetchBanks()
      toast({ title: 'Banco atualizado', description: `${editName} foi atualizado com sucesso.` })
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao atualizar banco.')
    } finally {
      setIsEditing(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────

  const openDelete = (bank: Bank) => {
    setDeleteBank(bank)
    setDeleteError(null)
  }

  const handleDelete = async () => {
    if (!deleteBank) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await apiDelete(`/banks/${deleteBank.id}`)
      const deletedName = deleteBank.name
      setDeleteBank(null)
      await fetchBanks()
      toast({ title: 'Banco removido', description: `${deletedName} foi removido com sucesso.` })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao remover banco.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Bancos</h1>
        <Button onClick={openCreate}>Novo Banco</Button>
      </div>

      <div className="max-w-sm">
        <Input
          type="search"
          placeholder="Buscar por nome do banco ou do programa…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar bancos por nome do banco ou do programa"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Carregando bancos…
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
                  label="Programas de Fidelidade de Bancos"
                  column="programs"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum banco encontrado.
                  </td>
                </tr>
              ) : (
                filteredBanks.map((bank) => (
                  <tr key={bank.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                          {bank.logo_url ? (
                            <img src={bank.logo_url} alt={bank.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {bank.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {bank.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {bank.loyaltyPrograms.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {bank.loyaltyPrograms.map((program) => (
                            <Badge
                              key={program.id}
                              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
                            >
                              {program.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(bank)}>
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDelete(bank)}>
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
            <DialogTitle>Novo Banco</DialogTitle>
            <DialogDescription>
              Cadastre um banco no catálogo global. Ele ficará disponível para vínculo com programas
              de fidelidade e para atribuição a usuários.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex justify-center">
              <LogoUpload
                logoUrl={createLogoUrl}
                onChange={setCreateLogoUrl}
                disabled={isCreating}
                alt={createName || 'Novo banco'}
                idPrefix="create-bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-bank-name">Nome do banco</Label>
              <Input
                id="create-bank-name"
                type="text"
                placeholder="Ex.: Banco do Brasil"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando…' : 'Criar Banco'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={editBank !== null} onOpenChange={(open) => { if (!open) setEditBank(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Banco</DialogTitle>
            <DialogDescription>Atualize o nome do banco.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="flex justify-center">
              <LogoUpload
                logoUrl={editLogoUrl}
                onChange={setEditLogoUrl}
                disabled={isEditing}
                alt={editName}
                idPrefix="edit-bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bank-name">Nome do banco</Label>
              <Input
                id="edit-bank-name"
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isEditing}
              />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditBank(null)} disabled={isEditing}>
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
      <Dialog open={deleteBank !== null} onOpenChange={(open) => { if (!open) setDeleteBank(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Banco</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold">{deleteBank?.name}</span>?
              Ele será desvinculado de todos os programas de fidelidade e usuários. Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteBank(null)} disabled={isDeleting}>
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
