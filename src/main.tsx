import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* Les notifications héritent du thème et du relief : `richColors` est
        volontairement absent — il impose sa propre palette par-dessus la charte. */}
    <Toaster
      position="bottom-right" closeButton
      toastOptions={{
        classNames: {
          toast: 'bg-card text-card-foreground border border-border relief-flottant ' +
                 'rounded-[var(--mode-radius-container)] font-sans',
          description: 'text-muted-foreground',
        },
      }}
    />
  </StrictMode>,
)
