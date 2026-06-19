import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import 'remochi/css';
import { ThemeWrapper } from 'remochi';
import CalendarApp from './calendar/CalendarApp.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeWrapper defaultTheme="light" fontFamily="Prelude">
    <CalendarApp />
    </ThemeWrapper>
  </StrictMode>,
)
