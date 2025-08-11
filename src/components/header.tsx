'use client'
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebaseClient"

function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/auth/login')
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="destructive" onClick={handleLogout}>
        <LogOut />
      </Button>
    </div>
  )
}

export { Header }
