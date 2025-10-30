import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Logo from '@/assets/logo.svg';

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: "Remi's Perfumes",
      },
      {
        name: 'description',
        content: 'Dior, Chanel, Gucci, Lattafa and more perfumes at the best prices in Kenya.',
      },
      {
        name: 'keywords',
        content: 'perfumes, dior, chanel, gucci, lattafa, kenya, best prices',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: Logo,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className='font-primary'>
        <HeadContent />
        {children}
        {import.meta.env.DEV && <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />}
        <Scripts />
      </body>
    </html>
  )
}
