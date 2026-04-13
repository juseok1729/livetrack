import { TopNav } from './top-nav'

interface AppLayoutProps {
  children: React.ReactNode
  noPadding?: boolean
}

export function AppLayout({ children, noPadding }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <TopNav />
      <main className={noPadding ? 'pt-14' : 'pt-[88px] px-8 pb-8'}>
        {children}
      </main>
    </div>
  )
}
