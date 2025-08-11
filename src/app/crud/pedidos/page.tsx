'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter } from 'next/navigation'
import { StepBack } from 'lucide-react'

type Person = {
  name?: string
  address?: string
  email?: string
  phone?: string
  document?: string
  type?: string
}

type Pedido = {
  id: string
  customer?: Person
  payer?: Person
  items: Array<{ title?: string; quantity?: number; unit_price?: number }>
  mp_id: number | string
  status: string
  amount: number
  createdAt?: any
}

const fmtCOP = (n?: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(n || 0))

const StatusBadge = ({ status }: { status?: string }) => {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | undefined> = {
    approved: 'default',
    authorized: 'secondary',
    in_process: 'secondary',
    pending: 'secondary',
    rejected: 'destructive',
    cancelled: 'destructive',
    refunded: 'outline',
    charged_back: 'outline',
  }
  const label = (status || '').replaceAll('_', ' ').toUpperCase() || '—'
  return <Badge variant={map[(status || '').toLowerCase()] ?? 'outline'}>{label}</Badge>
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Pedido[]
      setPedidos(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const openDetail = (p: Pedido) => { setSelected(p); setOpen(true) }

  const rows = useMemo(() => pedidos, [pedidos])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Button onClick={() => router.push("/")}>
        <StepBack />
        Volver
      </Button>
      <Card className="border-white/10 bg-black/40 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-white/10">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-white">Cliente</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white text-center">Teléfono</TableHead>
                    <TableHead className="text-white text-center">Estado</TableHead>
                    <TableHead className="text-white text-center">Monto</TableHead>
                    <TableHead className="text-white text-center">Fecha</TableHead>
                    <TableHead className="text-right text-white">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-white/60">
                        Cargando pedidos…
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-white/60">
                        No hay pedidos.
                      </TableCell>
                    </TableRow>
                  )}

                  {rows.map((p) => {
                    const person = p.customer ?? p.payer ?? {}
                    return (
                      <TableRow key={p.id} className="hover:bg-white/5">
                        <TableCell className="font-medium">{person.name || '—'}</TableCell>
                        <TableCell>{person.email || '—'}</TableCell>
                        <TableCell className="text-center">{person.phone || '—'}</TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-center">{fmtCOP(p.amount)}</TableCell>
                        <TableCell className="text-center">
                          {p.createdAt?.toDate?.().toLocaleString?.() || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" onClick={() => openDetail(p)}>
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Detalle en diálogo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl bg-black/90 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              {/* Cliente */}
              <section className="rounded-xl border border-white/10 p-4">
                <h3 className="mb-2 font-semibold">Cliente</h3>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <p><b>Nombre:</b> {selected.customer?.name || selected.payer?.name || '—'}</p>
                  <p><b>Email:</b> {selected.customer?.email || selected.payer?.email || '—'}</p>
                  <p><b>Teléfono:</b> {selected.customer?.phone || selected.payer?.phone || '—'}</p>
                  <p><b>Dirección:</b> {selected.customer?.address || selected.payer?.address || '—'}</p>
                  <p><b>Documento:</b> {(selected.customer?.type || selected.payer?.type || '—')}{' '}
                    {(selected.customer?.document || selected.payer?.document || '')}</p>
                </div>
              </section>

              {/* Items */}
              <section className="rounded-xl border border-white/10 p-4">
                <h3 className="mb-2 font-semibold">Items</h3>
                <div className="rounded-lg border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-white">Producto</TableHead>
                        <TableHead className="text-white text-center">Cantidad</TableHead>
                        <TableHead className="text-white text-center">Precio unitario</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selected.items || []).map((it, idx) => (
                        <TableRow key={idx} className="hover:bg-white/5">
                          <TableCell className="font-medium">{it?.title || '—'}</TableCell>
                          <TableCell className="text-center">{it?.quantity ?? '—'}</TableCell>
                          <TableCell className="text-center">{fmtCOP(it?.unit_price)}</TableCell>
                        </TableRow>
                      ))}
                      {(!selected.items || selected.items.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-4 text-center text-white/60">
                            Sin items.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 p-4">
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <p><b>ID MercadoPago:</b> {String(selected.mp_id ?? '—')}</p>
                  <p className="flex items-center gap-2">
                    <b>Estado:</b> <StatusBadge status={selected.status} />
                  </p>
                  <p><b>Total:</b> {fmtCOP(selected.amount)}</p>
                  <p><b>Fecha:</b> {selected.createdAt?.toDate?.().toLocaleString?.() || '—'}</p>
                </div>
                <Separator className="my-3 bg-white/10" />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cerrar</Button>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
