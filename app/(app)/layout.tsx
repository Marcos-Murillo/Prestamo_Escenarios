import { Sidebar } from "@/components/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* En desktop el sidebar ocupa ~80px a la izquierda, en móvil es bottom nav */}
      <div className="md:pl-20 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
