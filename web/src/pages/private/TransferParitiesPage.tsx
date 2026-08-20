import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog'
import { useToast } from '../../components/ui/use-toast'
import { SortableTh, type SortOrder } from '../../components/shared/SortableTh'

interface ProgramRef {
  id: string
  name: string
  logo_url: string | null
}

interface TransferParity {
  id: string
  fromProgram: ProgramRef
  toProgram: ProgramRef
  from_points: number
  to_points: number
  created_at: string
}

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function ProgramLogo({ program }: { program: ProgramRef }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
      {program.logo_url ? (
        <img src={program.logo_url} alt={program.name} className="h-full w-full object-contain" />
      ) : (
        <span className="text-[10px] font-semibold text-muted-foreground">
          {program.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

/**
 * TransferParitiesPage — catálogo de paridades de transferência entre
 * programas de fidelidade de bancos (ADMIN). Direcional: "De → Para" com uma
 * proporção (ex.: 1:1) — a transferência inversa, se existir, é um registro
 * separado. Nem todo par de programas suporta transferência; por isso este
 * catálogo é curado manualmente, e não inferido.
 */
export function TransferParitiesPage() {
  const { toast } = useToast()

  const [parities, setParities] = React.useState<TransferParity[]>([])
  const [programs, setPrograms] = React.useState<ProgramRef[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')

  const [sortBy, setSortBy] = React.useState<'from' | 'to'>('from')
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc')

  const [createOpen, setCreateOpen] = React.useState(false)
  const [createFromId, setCreateFromId] = React.useState('')
  const [createToId, setCreateToId] = React.useState('')
  const [createFromPoints, setCreateFromPoints] = React.useState('1')
  const [createToPoints, setCreateToPoints] = React.useState('1')
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)

  const [editParity, setEditParity] = React.useState<TransferParity | null>(null)
  const [editFromId, setEditFromId] = React.useState('')
  const [editToId, setEditToId] = React.useState('')
  const [editFromPoints, setEditFromPoints] = React.useState('1')
  const [editToPoints, setEditToPoints] = React.useState('1')
  const [editError, setEditError] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  const [deleteParity, setDeleteParity] = React.useState<TransferParity | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const [paritiesRes, programsRes] = await Promise.all([
        apiGet<{ data: TransferParity[] }>('/transfer-parities'),
        apiGet<{ data: ProgramRef[] }>('/loyalty-programs'),
      ])
      setParities(paritiesRes.data)
      setPrograms(programsRes.data)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao carregar paridades de transferência.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column as 'from' | 'to')
      setSortOrder('asc')
    }
  }

  const filteredParities = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? parities.filter(
          (p) =>
            p.fromProgram.name.toLowerCase().includes(term) || p.toProgram.name.toLowerCase().includes(term)
        )
      : parities

    const sorted = [...filtered].sort((a, b) => {
      const nameA = sortBy === 'from' ? a.fromProgram.name : a.toProgram.name
      const nameB = sortBy === 'from' ? b.fromProgram.name : b.toProgram.name
      const cmp = nameA.localeCompare(nameB, 'pt-BR')
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [parities, search, sortBy, sortOrder])

  // ── Create ───────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateFromId('')
    setCreateToId('')
    setCreateFromPoints('1')
    setCreateToPoints('1')
    setCreateError(null)
    setCreateOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (createFromId === createToId) {
      setCreateError('Um programa não pode transferir pontos para si mesmo.')
      return
    }
    setCreateError(null)
    setIsCreating(true)
    try {
      await apiPost('/transfer-parities', {
        fromProgramId: createFromId,
        toProgramId: createToId,
        fromPoints: Number(createFromPoints),
        toPoints: Number(createToPoints),
      })
      setCreateOpen(false)
      await fetchData()
      toast({ title: 'Paridade criada', description: 'A paridade de transferência foi adicionada com sucesso.' })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar paridade de transferência.')
    } finally {
      setIsCreating(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────

  const openEdit = (parity: TransferParity) => {
    setEditParity(parity)
    setEditFromId(parity.fromProgram.id)
    setEditToId(parity.toProgram.id)
    setEditFromPoints(String(parity.from_points))
    setEditToPoints(String(parity.to_points))
    setEditError(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editParity) return
    if (editFromId === editToId) {
      setEditError('Um programa não pode transferir pontos para si mesmo.')
      return
    }
    setEditError(null)
    setIsEditing(true)
    try {
      await apiPut(`/transfer-parities/${editParity.id}`, {
        fromProgramId: editFromId,
        toProgramId: editToId,
        fromPoints: Number(editFromPoints),
        toPoints: Number(editToPoints),
      })
      setEditParity(null)
      await fetchData()
      toast({ title: 'Paridade atualizada', description: 'A paridade de transferência foi atualizada com sucesso.' })
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao atualizar paridade de transferência.')
    } finally {
      setIsEditing(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────

  const openDelete = (parity: TransferParity) => {
    setDeleteParity(parity)
    setDeleteError(null)
  }

  const handleDelete = async () => {
    if (!deleteParity) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await apiDelete(`/transfer-parities/${deleteParity.id}`)
      setDeleteParity(null)
      await fetchData()
      toast({ title: 'Paridade removida', description: 'A paridade de transferência foi removida com sucesso.' })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao remover paridade de transferência.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paridade de Transferência</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quais programas de fidelidade podem transferir pontos entre si, e em qual proporção.
          </p>
        </div>
        <Button onClick={openCreate}>Nova Paridade</Button>
      </div>

      <div className="max-w-sm">
        <Input
          type="search"
          placeholder="Buscar por programa…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar paridades por programa"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Carregando paridades de transferência…
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
                <SortableTh label="De" column="from" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <th className="px-4 py-3 font-medium"></th>
                <SortableTh label="Para" column="to" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <th className="px-4 py-3 font-medium">Proporção</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredParities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma paridade de transferência encontrada.
                  </td>
                </tr>
              ) : (
                filteredParities.map((parity) => (
                  <tr key={parity.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <ProgramLogo program={parity.fromProgram} />
                        {parity.fromProgram.name}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <ProgramLogo program={parity.toProgram} />
                        {parity.toProgram.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {parity.from_points} : {parity.to_points}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(parity)}>
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDelete(parity)}>
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
            <DialogTitle>Nova Paridade de Transferência</DialogTitle>
            <DialogDescription>
              Defina de qual programa para qual programa é possível transferir pontos, e a
              proporção (ex.: 1:1 — 1 ponto de origem vira 1 ponto no destino).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-from-program">De (programa de origem)</Label>
              <select
                id="create-from-program"
                required
                className={SELECT_CLASS}
                value={createFromId}
                onChange={(e) => setCreateFromId(e.target.value)}
                disabled={isCreating}
              >
                <option value="" disabled>Selecione um programa</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-to-program">Para (programa de destino)</Label>
              <select
                id="create-to-program"
                required
                className={SELECT_CLASS}
                value={createToId}
                onChange={(e) => setCreateToId(e.target.value)}
                disabled={isCreating}
              >
                <option value="" disabled>Selecione um programa</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-from-points">Pontos de origem</Label>
                <Input
                  id="create-from-points"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={createFromPoints}
                  onChange={(e) => setCreateFromPoints(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-to-points">Pontos de destino</Label>
                <Input
                  id="create-to-points"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={createToPoints}
                  onChange={(e) => setCreateToPoints(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando…' : 'Criar Paridade'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={editParity !== null} onOpenChange={(open) => { if (!open) setEditParity(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Paridade de Transferência</DialogTitle>
            <DialogDescription>Atualize os programas envolvidos e/ou a proporção de pontos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-from-program">De (programa de origem)</Label>
              <select
                id="edit-from-program"
                required
                className={SELECT_CLASS}
                value={editFromId}
                onChange={(e) => setEditFromId(e.target.value)}
                disabled={isEditing}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-to-program">Para (programa de destino)</Label>
              <select
                id="edit-to-program"
                required
                className={SELECT_CLASS}
                value={editToId}
                onChange={(e) => setEditToId(e.target.value)}
                disabled={isEditing}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-from-points">Pontos de origem</Label>
                <Input
                  id="edit-from-points"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={editFromPoints}
                  onChange={(e) => setEditFromPoints(e.target.value)}
                  disabled={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-to-points">Pontos de destino</Label>
                <Input
                  id="edit-to-points"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={editToPoints}
                  onChange={(e) => setEditToPoints(e.target.value)}
                  disabled={isEditing}
                />
              </div>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditParity(null)} disabled={isEditing}>
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
      <Dialog open={deleteParity !== null} onOpenChange={(open) => { if (!open) setDeleteParity(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Paridade de Transferência</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a paridade{' '}
              <span className="font-semibold">
                {deleteParity?.fromProgram.name} → {deleteParity?.toProgram.name}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteParity(null)} disabled={isDeleting}>
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
