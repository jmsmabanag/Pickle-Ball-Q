import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import '../styles.css'
import { StoreProvider } from '../lib/store'
import Header from '../components/Header'
import ErrorToast from '../components/ErrorToast'

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
        title: 'unstckdq — Open Play Queue',
      },
      {
        name: 'description',
        content: 'Mobile-friendly pickleball open play queue: courts, rotation, and wait times.',
      },
      {
        name: 'theme-color',
        content: '#0f172a',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950">
        <StoreProvider>
          <Header />
          <main>{children}</main>
          <ErrorToast />
        </StoreProvider>
        <Scripts />
      </body>
    </html>
  )
}
