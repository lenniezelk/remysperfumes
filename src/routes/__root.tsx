import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Logo from '@/assets/logo.svg';
import { GoogleOAuthProvider } from '@react-oauth/google';

import appCss from '@/styles.css?url'
import { AdminAuthenticationProvider } from '@/lib/auth/admin-auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getEnvVars } from '@/lib/env-vars';
import { NotificationProvider, NotificationsList } from '@/components/notifications/Notification';
import { EnvVarsProvider } from '@/components/EnvVars';

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
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: "Remi's Perfumes",
      },
      {
        property: 'og:description',
        content: 'Dior, Chanel, Gucci, Lattafa and more perfumes at the best prices in Kenya.',
      },
      {
        property: 'og:image',
        content: Logo,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: "Remi's Perfumes",
      },
      {
        name: 'twitter:description',
        content: 'Dior, Chanel, Gucci, Lattafa and more perfumes at the best prices in Kenya.',
      },
      {
        name: 'twitter:image',
        content: Logo,
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
      {
        rel: 'preconnect',
        href: 'https://challenges.cloudflare.com'
      }
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: () => <div>404 - Not Found</div>,
  loader: async () => {
    const envVars = await getEnvVars();

    if (envVars.status === 'SUCCESS') {
      return {
        GOOGLE_OAUTH_CLIENT_ID: envVars?.data?.GOOGLE_OAUTH_CLIENT_ID || '',
        CLOUDFLARE_TURNSTILE_SECRET: envVars?.data?.CLOUDFLARE_TURNSTILE_SECRET || '',
      }
    }

    return {
      GOOGLE_OAUTH_CLIENT_ID: '',
      CLOUDFLARE_TURNSTILE_SECRET: '',
    }
  }
})

const queryClient = new QueryClient();

const App = ({ children }: { children: React.ReactNode }) => {
  const { GOOGLE_OAUTH_CLIENT_ID, CLOUDFLARE_TURNSTILE_SECRET } = Route.useLoaderData();

  return (
    <EnvVarsProvider envVars={{ GOOGLE_OAUTH_CLIENT_ID, CLOUDFLARE_TURNSTILE_SECRET }}>
      <NotificationProvider>
        <GoogleOAuthProvider clientId={GOOGLE_OAUTH_CLIENT_ID}>
          <QueryClientProvider client={queryClient}>
            <AdminAuthenticationProvider>
              {children}
              <NotificationsList />
            </AdminAuthenticationProvider>
          </QueryClientProvider>
        </GoogleOAuthProvider>
      </NotificationProvider>
    </EnvVarsProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className='font-primary text-neutral-text'>
        <HeadContent />
        <App>
          {children}
        </App>
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
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        ></script>
      </body>
    </html>
  )
}
