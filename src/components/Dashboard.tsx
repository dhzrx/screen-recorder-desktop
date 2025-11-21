import { useRecorder } from '../hooks/useRecorder';
import { Editor } from './Editor';

export function Dashboard() {
    const {
        sources,
        selectedSource,
        startRecording,
        stopRecording,
        isRecording,
        toggleWebcam,
        webcamStream,
        recordedBlob,
        recordedCursorData,
        recordedDuration,
        resetRecording,
        debugInfo
    } = useRecorder();

    if (recordedBlob) {
        return (
            <Editor
                recordedBlob={recordedBlob}
                cursorData={recordedCursorData}
                initialDuration={recordedDuration}
                onClose={resetRecording}
            />
        );
    }

    return (
        <div className="dashboard" style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#1a1a1a', color: '#fff' }}>
            {/* Main Content Area */}
            <main className="content-area" style={{ flex: 1, padding: '2rem', overflowY: 'auto', backgroundColor: '#0a0a0a' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0 }}>Screen Recorder</h1>
                    <div className="status-badge" style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        backgroundColor: isRecording ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)',
                        color: isRecording ? '#ff4444' : '#44ff44',
                        border: `1px solid ${isRecording ? '#ff4444' : '#44ff44'}`
                    }}>
                        {isRecording ? '● Recording' : '○ Ready'}
                    </div>
                </header>

                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#ccc' }}>Select Source</h2>
                <div className="sources-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {sources.map((source) => (
                        <div
                            key={source.id}
                            className={`source-card ${selectedSource === source.id ? 'selected' : ''}`}
                            onClick={() => !isRecording && startRecording(source.id)}
                            style={{
                                border: selectedSource === source.id ? '2px solid #646cff' : '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '12px',
                                cursor: isRecording ? 'default' : 'pointer',
                                opacity: isRecording && selectedSource !== source.id ? 0.5 : 1,
                                borderRadius: '12px',
                                backgroundColor: '#1a1a1a',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div style={{ aspectRatio: '16/9', overflow: 'hidden', borderRadius: '6px', marginBottom: '0.8rem', backgroundColor: '#000' }}>
                                <img
                                    src={source.thumbnail.toDataURL()}
                                    alt={source.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {source.appIcon && (
                                    <img src={source.appIcon.toDataURL()} style={{ width: 20, height: 20 }} />
                                )}
                                <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                    {source.name}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Sidebar Controls (Webcam & Stop) */}
            <aside style={{ width: '320px', flexShrink: 0, borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: '#1a1a1a' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Controls</h3>
                <button
                    onClick={toggleWebcam}
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        marginBottom: '0.8rem',
                        backgroundColor: webcamStream ? '#ff4444' : '#444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    {webcamStream ? 'Disable Webcam' : 'Enable Webcam'}
                </button>
                {isRecording ? (
                    <button
                        onClick={stopRecording}
                        style={{ width: '100%', backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '0.8rem', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Stop Recording
                    </button>
                ) : (
                    <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                        Select a source to start
                    </div>
                )}
            </aside>

            {webcamStream && (
                <div className="webcam-preview" style={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    width: 240,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    zIndex: 100
                }}>
                    <video
                        ref={video => { if (video) video.srcObject = webcamStream }}
                        autoPlay
                        muted
                        style={{ width: '100%', display: 'block' }}
                    />
                </div>
            )}
            {/* DEBUG OVERLAY */}
            {/* DEBUG OVERLAY */}
            <div style={{
                position: 'fixed',
                top: 10,
                left: 10,
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#0f0',
                padding: '10px',
                zIndex: 9999,
                fontFamily: 'monospace',
                pointerEvents: 'none',
                fontSize: '12px'
            }}>
                <p>IPC Raw: {debugInfo ? `${debugInfo.raw.x}, ${debugInfo.raw.y}` : 'Waiting...'}</p>
                <p>Calc UV: {debugInfo ? `${debugInfo.uv.u.toFixed(3)}, ${debugInfo.uv.v.toFixed(3)}` : '...'}</p>
                <p>Bounds: {debugInfo?.bounds ? `${debugInfo.bounds.width}x${debugInfo.bounds.height} @ ${debugInfo.bounds.x},${debugInfo.bounds.y}` : 'None'}</p>
                <p>Recording: {isRecording ? 'YES' : 'NO'}</p>
            </div>
        </div>
    );
}
