import ReactDOM from 'react-dom/client';
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { initEditor } from './hooks/useEditor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initEditor());
} else {
    initEditor();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
            <App />
        </InternetIdentityProvider>
    </QueryClientProvider>
);
