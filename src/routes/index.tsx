import { createFileRoute } from '@tanstack/react-router'
import Logo from '@/assets/logo.svg'
import Heading from '@/components/Heading'

export const Route = createFileRoute('/')({ component: App })

function App() {

  return (
    <div className="relative min-h-screen bg-linear-to-br from-neutral-bg-light to-neutral-bg flex flex-col overflow-hidden">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img
              src={Logo}
              alt="Remi's Perfumes Logo"
              className="h-32 w-32 drop-shadow-lg"
            />
          </div>

          {/* Main Heading */}
          <Heading level={1} className="mb-4">
            <span className="text-brand">Remi's</span>
            <span className="text-accent"> Perfumes</span>
          </Heading>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-neutral-text-secondary mb-8 leading-relaxed">
            Discover luxury fragrances from <span className="font-semibold text-accent">Dior</span>,
            <span className="font-semibold text-accent"> Chanel</span>,
            <span className="font-semibold text-accent"> Gucci</span>,
            <span className="font-semibold text-accent"> Lattafa</span> and more at the best prices in Kenya.
          </p>

          {/* Coming Soon Badge */}
          <div className="inline-block bg-brand text-white px-6 py-3 rounded-full text-lg font-medium mb-8 shadow-lg">
            ✨ Coming Soon ✨
          </div>

          {/* Description */}
          <p className="text-neutral-text-secondary mb-12 max-w-lg mx-auto">
            We're crafting something special for fragrance lovers. Get ready to experience premium perfumes at unbeatable prices.
          </p>
        </div>
      </main>

      <footer className="px-4 pb-6 text-center text-sm text-neutral-text-secondary">
        © {new Date().getFullYear()} Remi's Perfumes • Website by{' '}
        <a
          href="https://lennyk.dev/"
          className="text-accent hover:text-accent-dark transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          LennyK
        </a>
      </footer>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute top-10 left-10 w-20 h-20 bg-brand-light/30 rounded-full blur-xl"></div>
      <div className="pointer-events-none absolute bottom-24 right-10 w-32 h-32 bg-accent-light/20 rounded-full blur-xl"></div>
      <div className="pointer-events-none absolute top-1/2 left-4 w-16 h-16 bg-brand/20 rounded-full blur-lg"></div>
    </div>
  )
}
