import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { formatPhone } from '../../lib/phone'
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

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400
const MIN_PASSWORD_LENGTH = 8

type Role = 'ADMIN' | 'FUNCIONARIO' | 'USER'
type CreatableRole = 'ADMIN' | 'FUNCIONARIO' | 'USER'

/**
 * User type as returned by the API.
 */
interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  created_at: string
}

interface UsersApiResponse {
  data: User[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

function roleBadge(role: Role) {
  if (role === 'ADMIN') {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
        Admin
      </Badge>
    )
  }
  if (role === 'FUNCIONARIO') {
    return (
      <Badge className="bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-100">
        Team
      </Badge>
    )
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100">
      Usuário
    </Badge>
  )
}

/**
 * UsersPage — gestão de usuários (ADMIN e FUNCIONARIO).
 * Requirements: 7.2, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9
 */
export function UsersPage() {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'ADMIN'

  // List state
  const [users, setUsers] = React.useState<User[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  // Search state
  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')

  // Create dialog state
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState('')
  const [createEmail, setCreateEmail] = React.useState('')
  const [createPhone, setCreatePhone] = React.useState('')
  const [createRole, setCreateRole] = React.useState<CreatableRole>('USER')
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)

  // Edit dialog state
  const [editUser, setEditUser] = React.useState<User | null>(null)
  const [editName, setEditName] = React.useState('')
  const [editEmail, setEditEmail] = React.useState('')
  const [editPhone, setEditPhone] = React.useState('')
  const [editPassword, setEditPassword] = React.useState('')
  const [editConfirmPassword, setEditConfirmPassword] = React.useState('')
  const [showEditPassword, setShowEditPassword] = React.useState(false)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  // Delete dialog state
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // ── Search debounce ─────────────────────────────────────────────

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1)
      setSearch(searchInput)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  // ── Data fetching ────────────────────────────────────────────────

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (search) params.set('search', search)
      const res = await apiGet<UsersApiResponse>(`/users?${params.toString()}`)
      setUsers(res.data)
      setTotal(res.pagination.total)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao carregar usuários.')
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // ── Create ───────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateName('')
    setCreateEmail('')
    setCreatePhone('')
    setCreateRole('USER')
    setCreateError(null)
    setCreateOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setIsCreating(true)
    try {
      await apiPost('/users', {
        name: createName,
        email: createEmail,
        phone: createPhone,
        role: isAdmin ? createRole : 'USER',
      })
      setCreateOpen(false)
      setPage(1)
      await fetchUsers()
      toast({ title: 'Usuário criado', description: `${createName} foi adicionado com sucesso.` })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar usuário.')
    } finally {
      setIsCreating(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────

  const openEdit = (user: User) => {
    setEditUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditPhone(user.phone)
    setEditPassword('')
    setEditConfirmPassword('')
    setShowEditPassword(false)
    setEditError(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return

    if (editPassword) {
      if (editPassword.length < MIN_PASSWORD_LENGTH) {
        setEditError(`A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
        return
      }
      if (editPassword !== editConfirmPassword) {
        setEditError('As senhas não coincidem.')
        return
      }
    }

    setEditError(null)
    setIsEditing(true)
    try {
      await apiPut(`/users/${editUser.id}`, { name: editName, email: editEmail, phone: editPhone })
      if (editPassword) {
        await apiPut(`/users/${editUser.id}/password`, { password: editPassword })
      }
      setEditUser(null)
      await fetchUsers()
      toast({ title: 'Usuário atualizado', description: `${editName} foi atualizado com sucesso.` })
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao atualizar usuário.')
    } finally {
      setIsEditing(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────

  const openDelete = (user: User) => {
    setDeleteUser(user)
    setDeleteError(null)
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await apiDelete(`/users/${deleteUser.id}`)
      const deletedName = deleteUser.name
      setDeleteUser(null)
      await fetchUsers()
      toast({ title: 'Usuário removido', description: `${deletedName} foi removido com sucesso.` })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao remover usuário.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        <Button onClick={openCreate}>Novo Usuário</Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          type="search"
          placeholder="Buscar por nome…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Buscar usuários por nome"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Carregando usuários…
        </div>
      )}

      {/* Fetch error */}
      {!isLoading && fetchError && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      {/* Table */}
      {!isLoading && !fetchError && (
        <>
          <div className="rounded-md border max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-muted/95 backdrop-blur-sm text-left">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium">Data de criação</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.phone || '—'}</td>
                      <td className="px-4 py-3">{roleBadge(user.role)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(user)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDelete(user)}
                          >
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

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {total} usuário{total === 1 ? '' : 's'} · página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Create Dialog ─────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar um novo usuário. Um email será enviado convidando a pessoa a definir a própria senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome</Label>
              <Input
                id="create-name"
                type="text"
                placeholder="Nome completo"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="email@exemplo.com"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Telefone</Label>
              <Input
                id="create-phone"
                type="tel"
                placeholder="(11) 91234-5678"
                required
                value={createPhone}
                onChange={(e) => setCreatePhone(formatPhone(e.target.value))}
                disabled={isCreating}
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="create-role">Papel</Label>
                <select
                  id="create-role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as CreatableRole)}
                  disabled={isCreating}
                >
                  <option value="USER">Usuário</option>
                  <option value="FUNCIONARIO">Team</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando…' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={editUser !== null} onOpenChange={(open) => { if (!open) setEditUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize o nome, email, telefone ou defina uma nova senha para o usuário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                type="text"
                placeholder="Nome completo"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="email@exemplo.com"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="(11) 91234-5678"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                disabled={isEditing}
              />
            </div>
            {editUser?.role !== 'ADMIN' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showEditPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      disabled={isEditing}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showEditPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      tabIndex={-1}
                    >
                      {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-confirm-password">Confirmar senha</Label>
                  <Input
                    id="edit-confirm-password"
                    type={showEditPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={editConfirmPassword}
                    onChange={(e) => setEditConfirmPassword(e.target.value)}
                    disabled={isEditing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Define a senha diretamente. A pessoa será notificada por email. Mínimo de {MIN_PASSWORD_LENGTH} caracteres.
                  </p>
                </div>
              </>
            )}
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditUser(null)}
                disabled={isEditing}
              >
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
      <Dialog open={deleteUser !== null} onOpenChange={(open) => { if (!open) setDeleteUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold">{deleteUser?.name}</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteUser(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
