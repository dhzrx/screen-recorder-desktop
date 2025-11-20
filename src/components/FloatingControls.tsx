import React from 'react';

export function FloatingControls() {
    const handleStop = () => {
        // @ts-ignore
        window.ipcRenderer.send('REQUEST_STOP_RECORDING');
    };

    return (
        <div className="floating-controls" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '30px',
            padding: '0 20px',
            gap: '10px',
            userSelect: 'none',
            // @ts-ignore
            WebkitAppRegion: 'drag',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ff4444',
                boxShadow: '0 0 10px #ff4444',
                animation: 'pulse 1.5s infinite'
            }} />
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>REC</span>

            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.3)' }} />

            <button
                onClick={handleStop}
                style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    // @ts-ignore
                    WebkitAppRegion: 'no-drag'
                }}
                title="Stop Recording"
            >
                ⏹
            </button>
            <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
        </div>
    );
}
