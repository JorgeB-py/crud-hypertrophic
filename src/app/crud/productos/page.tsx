'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, orderBy, query
} from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StepBack } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ================== Tipos ==================
export interface Variant {
  sku: string
  flavor: string
  servings: number
  price: number
  stock: number
  weight: string
  extra?: Record<string, any>
}

export interface Product {
  id: string
  name: string
  image: string
  table: string
  description: string
  market: string
  category: string
  variants: Variant[]
  extra?: Record<string, any>
}

export interface Market { id: string; market: string; image: string }

// ================== Utils ==================
const isUrl = (v: string) => /^https?:\/\/.+/i.test(v)
const toNum = (v: any) => Number.isFinite(Number(v)) ? Number(v) : 0

const emptyVariant: Variant = {
  sku: '', flavor: '', servings: 0, price: 0, stock: 0, weight: '', extra: {}
}

const emptyProduct: Product = {
  id: '', name: '', image: '', table: '', description: '',
  market: '', category: '', variants: [], extra: {}
}

// ================== Key/Value editor (editable de verdad) ==================
function KvTable({
  label, value, onChange, addLabel = 'Añadir campo'
}: {
  label: string
  value?: Record<string, any>
  onChange: (next: Record<string, any>) => void
  addLabel?: string
}) {
  const [rows, setRows] = useState<Array<{ k: string; v: string }>>([])
  const [newK, setNewK] = useState(''); const [newV, setNewV] = useState('')

  useEffect(() => {
    const entries = Object.entries(value || {}).map(([k, v]) => ({ k, v: String(v) }))
    setRows(entries)
  }, [JSON.stringify(value || {})])

  const pushRow = () => {
    const k = newK.trim()
    if (!k) return
    const next = [...rows, { k, v: newV }]
    setRows(next)
    onChange(Object.fromEntries(next.map(r => [r.k, r.v])))
    setNewK(''); setNewV('')
  }

  const updateRow = (idx: number, field: 'k' | 'v', val: string) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [field]: val } : r)
    setRows(next)
    onChange(Object.fromEntries(next.map(r => [r.k, r.v])))
  }

  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx)
    setRows(next)
    onChange(Object.fromEntries(next.map(r => [r.k, r.v])))
  }

  return (
    <div className="rounded-xl border border-white/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-white/50">Clave → Valor (se guarda como objeto)</span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-black/60 backdrop-blur">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-white">Clave</TableHead>
              <TableHead className="text-white">Valor</TableHead>
              <TableHead className="text-white text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-sm text-white/60 py-4">Sin campos.</TableCell></TableRow>
            )}
            {rows.map((r, idx) => (
              <TableRow key={idx} className="hover:bg-white/5">
                <TableCell className="align-middle">
                  <Input value={r.k} onChange={e => updateRow(idx, 'k', e.target.value)}
                    className="bg-neutral-900/60 text-white border-white/10" />
                </TableCell>
                <TableCell className="align-middle">
                  <Input value={r.v} onChange={e => updateRow(idx, 'v', e.target.value)}
                    className="bg-neutral-900/60 text-white border-white/10" />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" onClick={() => removeRow(idx)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <Input placeholder="ej: certificacion" value={newK} onChange={e => setNewK(e.target.value)}
                  className="bg-neutral-900/60 text-white border-white/10" />
              </TableCell>
              <TableCell>
                <Input placeholder="ej: INVIMA XYZ" value={newV} onChange={e => setNewV(e.target.value)}
                  className="bg-neutral-900/60 text-white border-white/10" />
              </TableCell>
              <TableCell className="text-right">
                <Button onClick={pushRow}>{addLabel}</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ================== Variants Editor (acordeón + extras) ==================
function VariantsEditor({
  variants, setVariants
}: { variants: Variant[]; setVariants: (v: Variant[]) => void }) {
  const addVariant = () => {
    if (variants.length > 0) {
      const last = variants[variants.length - 1]
      // Duplica la última variante exactamente como está
      setVariants([...variants, { ...last }])
    } else {
      setVariants([{ ...emptyVariant }])
    }
  }

  const update = (idx: number, patch: Partial<Variant>) => {
    const next = [...variants]; 
    next[idx] = { ...next[idx], ...patch } 
    setVariants(next)
  }

  const remove = (idx: number) => 
    setVariants(variants.filter((_, i) => i !== idx))

  return (
    <div className="rounded-xl border border-white/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Variantes</span>
        <Button variant="ghost" onClick={addVariant}>+ Añadir variante</Button>
      </div>

      {(!variants || variants.length === 0) && (
        <p className="text-sm text-white/60">No hay variantes. Usa “Añadir variante”.</p>
      )}

      <Accordion type="multiple" className="space-y-2">
        {(variants || []).map((v, idx) => (
          <AccordionItem key={idx} value={`v-${idx}`} className="rounded-xl border border-white/10">
            <AccordionTrigger className="px-3">
              <div className="flex w-full items-center justify-between gap-2 pr-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className='text-white'>{v.sku || 'SKU'}</Badge>
                  <span className="text-sm">{v.flavor || 'Sabor'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span>Porciones: {toNum(v.servings)}</span>
                  <span>Precio: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(toNum(v.price))}</span>
                  <span>Stock: {toNum(v.stock)}</span>
                  <span>Peso: {v.weight || '—'}</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="grid gap-2 md:grid-cols-6">
                <div>
                  <Label className="text-xs">SKU</Label>
                  <Input value={v.sku} onChange={e => update(idx, { sku: e.target.value })}
                    className="bg-neutral-900/60 text-white border-white/10" />
                </div>
                <div>
                  <Label className="text-xs">Sabor</Label>
                  <Input value={v.flavor} onChange={e => update(idx, { flavor: e.target.value })}
                    className="bg-neutral-900/60 text-white border-white/10" />
                </div>
                <div>
                  <Label className="text-xs">Porciones</Label>
                  <Input type="number" value={v.servings} onChange={e => update(idx, { servings: toNum(e.target.value) })}
                    className="bg-neutral-900/60 text-white border-white/10" />
                </div>
                <div>
                  <Label className="text-xs">Precio (COP)</Label>
                  <Input type="number" value={v.price} onChange={e => update(idx, { price: toNum(e.target.value) })}
                    className="bg-neutral-900/60 text-white border-white/10" />
                </div>
                <div>
                  <Label className="text-xs">Stock</Label>
                  <Input type="number" value={v.stock} onChange={e => update(idx, { stock: toNum(e.target.value) })}
                    className="bg-neutral-900/60 text-white border-white/10" />
                </div>
                <div>
                  <Label className="text-xs">Peso</Label>
                  <Input value={v.weight} onChange={e => update(idx, { weight: e.target.value })}
                    className="bg-neutral-900/60 text-white border-white/10" />
                </div>
              </div>

              <div className="mt-3">
                <KvTable
                  label="Campos extra (variante)"
                  value={v.extra || {}}
                  onChange={next => update(idx, { extra: next })}
                />
              </div>

              <div className="mt-2 flex justify-end">
                <Button variant="destructive" onClick={() => remove(idx)}>Eliminar variante</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}


// ================== Página ==================
export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Product>({ ...emptyProduct })
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [customMarket, setCustomMarket] = useState('')
  const router = useRouter()

  // Productos
  useEffect(() => {
    const qy = query(collection(db, 'productos'), orderBy('name', 'asc'))
    const unsub = onSnapshot(qy, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Product[]
      setProducts(list); setLoading(false)
    })
    return () => unsub()
  }, [])

  // Marcas para el selector
  useEffect(() => {
    const qy = query(collection(db, 'marcas'), orderBy('market', 'asc'))
    const unsub = onSnapshot(qy, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Market[]
      setMarkets(list)
    })
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(p =>
      [p.name, p.market, p.category].some(x => (x || '').toLowerCase().includes(q))
    )
  }, [products, search])

  // Handlers
  const startCreate = () => {
    setEditing(null)
    setForm({ ...emptyProduct })
    setCustomMarket('')
    setOpenForm(true)
  }

  const startEdit = (p: Product) => {
    setEditing(p)
    setForm({ ...(p as any) })
    setCustomMarket('')
    setOpenForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return alert('El nombre es obligatorio.')
    if (form.image && !isUrl(form.image)) return alert('La imagen debe ser una URL válida (http/https).')
    if (form.table && !isUrl(form.table)) return alert('La tabla nutricional debe ser una URL válida (http/https).')

    const chosenMarket = customMarket.trim() ? customMarket.trim() : form.market.trim()

    const payload = {
      name: form.name.trim(),
      image: form.image.trim(),
      table: form.table.trim(),
      description: form.description.trim(),
      market: chosenMarket, // vínculo simple por nombre/ID
      category: form.category.trim(),
      variants: (form.variants || []).map(v => ({
        sku: String(v.sku || '').trim(),
        flavor: String(v.flavor || '').trim(),
        servings: toNum(v.servings),
        price: toNum(v.price),
        stock: toNum(v.stock),
        weight: String(v.weight || '').trim(),
        ...(v.extra ? { extra: v.extra } : {})
      })),
      ...(form.extra ? { extra: form.extra } : {}),
    }

    try {
      if (editing?.id) {
        await updateDoc(doc(db, 'productos', editing.id), payload as any)
      } else {
        await addDoc(collection(db, 'productos'), payload as any)
      }
      setOpenForm(false)
      setEditing(null)
      setForm({ ...emptyProduct })
    } catch (e: any) {
      alert(e.message)
    }
  }

  const askDelete = (p: Product) => setConfirmDelete(p)
  const doDelete = async () => {
    if (!confirmDelete?.id) return
    try {
      await deleteDoc(doc(db, 'productos', confirmDelete.id))
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
          <CardTitle className="text-xl">Productos</CardTitle>
          <div className="flex w-full gap-2 md:w-auto">
            <Input
              placeholder="Buscar (nombre, marca o categoría)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-neutral-900/60 text-white border-white/10"
            />
            <Button onClick={startCreate}>+ Nuevo producto</Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Contenedor scrolleable con header sticky */}
          <div className="relative max-h-[65vh] overflow-auto rounded-xl border border-white/10">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-black/70 backdrop-blur">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-white">Imagen</TableHead>
                  <TableHead className="text-white">Nombre</TableHead>
                  <TableHead className="text-white">Marca</TableHead>
                  <TableHead className="text-white">Categoría</TableHead>
                  <TableHead className="text-white text-center">Variantes</TableHead>
                  <TableHead className="text-right text-white">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-white/60">Cargando…</TableCell>
                  </TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-white/60">Sin resultados.</TableCell>
                  </TableRow>
                )}
                {filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-white/5">
                    <TableCell className="py-3">
                      {p.image ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                          <Image src={p.image} alt={p.name} fill className="object-contain" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.market}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-center">{p.variants?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="ghost" onClick={() => startEdit(p)}>Editar</Button>
                        <Button variant="destructive" onClick={() => askDelete(p)}>Eliminar</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formulario Crear/Editar (con scroll interno y mejor layout) */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-black/90 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-neutral-900/60 text-white border-white/10" />
              </div>

              {/* Selector de marca (desde colección "marcas") con opción de escribir */}
              <div className="grid gap-2">
                <Label className="text-xs">Marca (market)</Label>
                <div className="flex gap-2">
                  <Select
                    value={form.market || ''}
                    onValueChange={(val) => setForm({ ...form, market: val })}
                  >
                    <SelectTrigger className="bg-neutral-900/60 text-white border-white/10">
                      <SelectValue placeholder="Selecciona una marca" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 text-white border-white/10">
                      {markets.map(m => (
                        <SelectItem key={m.id} value={m.market}>{m.market}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="bg-neutral-900/60 text-white border-white/10" />
              </div>

              <div>
                <Label className="text-xs">Imagen (URL)</Label>
                <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://…/army.png" className="bg-neutral-900/60 text-white border-white/10" />
                {form.image && isUrl(form.image) && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      <Image src={form.image} alt="preview" fill className="object-contain" />
                    </div>
                    <span className="text-xs text-white/60">Vista previa</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Tabla nutricional (URL)</Label>
                <Input value={form.table} onChange={(e) => setForm({ ...form, table: e.target.value })}
                  placeholder="https://…/table.png" className="bg-neutral-900/60 text-white border-white/10" />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-neutral-900/60 text-white border-white/10 min-h-[90px]" />
              </div>
            </div>

            <KvTable
              label="Campos extra (producto)"
              value={form.extra || {}}
              onChange={(next) => setForm({ ...form, extra: next })}
            />

            <VariantsEditor
              variants={form.variants || []}
              setVariants={(v) => setForm({ ...form, variants: v })}
            />

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
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
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
