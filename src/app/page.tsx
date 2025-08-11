// src/app/page.tsx
'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white p-6">
      {/* Logo o título */}
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center tracking-tight">
        Bienvenido a <span className="text-red-500">Hypertrophic</span>
      </h1>
      
      {/* Subtítulo */}
      <p className="text-lg md:text-xl text-gray-300 max-w-xl text-center mb-8">
        Administra tu catálogo de productos, marcas y pedidos de forma sencilla y segura.
      </p>
      
      {/* Botón login */}
      <Button 
        onClick={() => router.push('/auth/login')} 
        className="px-8 py-6 text-lg rounded-full shadow-lg hover:scale-105 transition-transform bg-red-600 hover:bg-red-500"
      >
        Iniciar sesión
      </Button>
      
      {/* Footer o pie */}
      <footer className="absolute bottom-4 text-sm text-gray-500">
        © {new Date().getFullYear()} Hypertrophic. Todos los derechos reservados.
      </footer>
    </div>
  )
}
