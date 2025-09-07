'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { db } from '@/lib/firebaseClient'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, orderBy, query
} from 'firebase/firestore'

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import { StepBack } from 'lucide-react'

// ---------------- Types ----------------
export interface Market {
  id: string
  name: string
  market: string
  image: string
}

// ---------------- Utils ----------------
const isUrl = (v: string) => /^https?:\/\/.+/i.test(v)
const emptyMarket: Market = { id: '', name: '', image: '', market:'' }

// ---------------- Page ----------------
export default function MarcasPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Market | null>(null)
  const [form, setForm] = useState<Market>(emptyMarket)
  const [confirmDelete, setConfirmDelete] = useState<Market | null>(null)
  const router = useRouter();

  // Load collection
  useEffect(() => {
    const qy = query(collection(db, 'marcas'), orderBy('name', 'asc'))
    const unsub = onSnapshot(qy, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Market[]
      setMarkets(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return markets
    return markets.filter(m => [m.name].some(x => (x || '').toLowerCase().includes(q)))
  }, [markets, search])

  // handlers
  const startCreate = () => {
    setEditing(null)
    setForm(emptyMarket)
    setOpenForm(true)
  }
  const startEdit = (m: Market) => {
    setEditing(m)
    setForm(m)
    setOpenForm(true)
  }
  const handleSave = async () => {
    if (!form.name.trim()) return alert('El nombre es obligatorio.')
    if (form.image && !isUrl(form.image)) return alert('La imagen debe ser una URL válida (http/https).')
    try {
      if (editing?.id) {
        await updateDoc(doc(db, 'marcas', editing.id), {
          name: form.name.trim(),
          image: form.image.trim(),
          market: form.market
        })
      } else {
        await addDoc(collection(db, 'marcas', form.market), {
          name: form.name.trim(),
          image: form.image.trim(),
          market: form.market
        })
      }
      setOpenForm(false)
      setEditing(null)
      setForm(emptyMarket)
    } catch (e: any) {
      alert(e.message)
    }
  }
  const askDelete = (m: Market) => setConfirmDelete(m)
  const doDelete = async () => {
    if (!confirmDelete?.id) return
    try {
      await deleteDoc(doc(db, 'marcas', confirmDelete.id))
      setConfirmDelete(null)
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Button onClick={() => router.push("/crud")}>
        <StepBack />
        Volver
      </Button>
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-xl">Marcas</CardTitle>
          <div className="flex w-full gap-2 md:w-auto">
            <Input
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-neutral-900/60 text-white border-white/10"
            />
            <Button onClick={startCreate}>+ Nueva marca</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-white/10">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-white">Logo</TableHead>
                    <TableHead className="text-white">Nombre</TableHead>
                    <TableHead className="text-white">Market</TableHead>
                    <TableHead className="text-right text-white">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-white/60">Cargando…</TableCell>
                    </TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-white/60">Sin resultados.</TableCell>
                    </TableRow>
                  )}
                  {filtered.map((m) => (
                    <TableRow key={m.id} className="hover:bg-white/5">
                      <TableCell className="py-3">
                        {m.image ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            <Image src={m.image} alt={m.name} fill className="object-contain" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="font-medium">{m.market}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button variant="ghost" onClick={() => startEdit(m)}>Editar</Button>
                          <Button variant="destructive" onClick={() => askDelete(m)}>Eliminar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Form (Create/Edit) */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg bg-black/90 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar marca' : 'Nueva marca'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Prosciencelogo, Dymatizelogo, ON…"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-neutral-900/60 text-white border-white/10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="market">Market</Label>
              <Input
                id="market"
                placeholder="Proscience, Dymatize, ON…"
                value={form.market}
                onChange={(e) => setForm({ ...form, market: e.target.value })}
                className="bg-neutral-900/60 text-white border-white/10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Logo (URL)</Label>
              <Input
                id="image"
                placeholder="https://…/logo.png"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="bg-neutral-900/60 text-white border-white/10"
              />
              {form.image && isUrl(form.image) && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    {/* next.config.js debe permitir el host del logo */}
                    <Image src={form.image} alt="preview" fill className="object-contain" />
                  </div>
                  <span className="text-xs text-white/60">Vista previa</span>
                </div>
              )}
            </div>

            <Separator className="bg-white/10" />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpenForm(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-black/90 text-white border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar marca</AlertDialogTitle>
          </AlertDialogHeader>
          ¿Seguro que deseas eliminar <b>{confirmDelete?.name}</b>? Esta acción no se puede deshacer.
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
