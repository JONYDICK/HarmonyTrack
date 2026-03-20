import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' with { type: 'css' }

console.log('✓ main.tsx loaded');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = '<h1>ERROR: Root element not found</h1>';
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('✓ React rendered successfully');
  } catch (error) {
    console.error('Render error:', error);
    rootElement.innerHTML = `<h1 style="color: red; padding: 20px;">Render Error: ${error instanceof Error ? error.message : String(error)}</h1>`;
  }
}

