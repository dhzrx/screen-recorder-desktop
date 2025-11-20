import { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { FloatingControls } from './components/FloatingControls'

function App() {
    const [view, setView] = useState('dashboard')

    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash === '#floating') {
                setView('floating')
            } else {
                setView('dashboard')
            }
        }

        handleHashChange() // Check initial
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [])

    return (
        <>
            {view === 'floating' ? <FloatingControls /> : <Dashboard />}
        </>
    )
}

export default App
