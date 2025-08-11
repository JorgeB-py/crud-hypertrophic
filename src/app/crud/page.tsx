"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Package, Tag, Receipt, ChevronRight } from "lucide-react"

export default function Home() {
  const router = useRouter()

  const tiles = [
    {
      title: "Productos",
      desc: "Crea, edita y organiza tu catálogo con variantes y campos extra.",
      icon: <Package className="h-6 w-6" aria-hidden="true" />,
      onClick: () => router.push("/crud/productos"),
    },
    {
      title: "Marcas",
      desc: "Gestiona los fabricantes y su imagen para vincularlos a productos.",
      icon: <Tag className="h-6 w-6" aria-hidden="true" />,
      onClick: () => router.push("/crud/marcas"),
    },
    {
      title: "Pedidos",
      desc: "Revisa estados, items e información del cliente en detalle.",
      icon: <Receipt className="h-6 w-6" aria-hidden="true" />,
      onClick: () => router.push("/crud/pedidos"),
    },
  ]

  return (
    <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-6 py-10 text-white">
      <div className="w-full max-w-6xl">
        {/* Hero */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            HYPERTROPHIC
          </h1>
          <p className="mt-3 text-base md:text-lg text-white/70">
            Panel de administración para productos, marcas y pedidos.
          </p>
        </header>

        {/* Grid de tarjetas */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Card
              key={t.title}
              className="group border-white/10 bg-black/40 backdrop-blur hover:bg-black/55 transition-all duration-200 hover:shadow-lg hover:shadow-black/30"
            >
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                  {t.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                  <CardDescription className="text-white/60">
                    {t.desc}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={t.onClick}
                  className="w-full justify-between bg-[#A40606] hover:bg-[#A40606]/85"
                >
                  Entrar
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer sutil */}
        <div className="mt-10 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Hypertrophic — Panel de administración
        </div>
      </div>
    </section>
  )
}
