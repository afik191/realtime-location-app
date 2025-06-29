import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainNavBar from './navbar'
import { BrowserRouter } from 'react-router-dom';
import App from './App'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <MainNavBar/>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
