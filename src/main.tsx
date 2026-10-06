import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { FeedbackProvider } from './components/Feedback'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FeedbackProvider>
          {/* HashRouter: o GitHub Pages não reescreve rotas de SPA */}
          <HashRouter>
            <App />
          </HashRouter>
        </FeedbackProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
