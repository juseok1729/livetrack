import { Sidebar } from './sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  noPadding?: boolean
}

export function AppLayout({ children, noPadding }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f8f8f8]">
      <Sidebar />
      <main className={`flex-1 ml-[220px] ${noPadding ? '' : 'p-8'}`}>
        {children}
      </main>
    </div>
  )
}
