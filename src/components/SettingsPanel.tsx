import React from 'react';

interface SettingsPanelProps {
    zoomLevel: number;
    setZoomLevel: (level: number) => void;
    backgroundColor: string;
    setBackgroundColor: (color: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    zoomLevel,
    setZoomLevel,
    backgroundColor,
    setBackgroundColor
}) => {
    return (
        <div className="settings-panel" style={{
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <h3>Recording Settings</h3>

            <div className="setting-item" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Zoom Level: {zoomLevel}x</label>
                <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                />
            </div>

            <div className="setting-item">
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Background Color</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        style={{ height: '40px', width: '60px', border: 'none', padding: 0, cursor: 'pointer' }}
                    />
                    <span style={{ alignSelf: 'center', fontFamily: 'monospace' }}>{backgroundColor}</span>
                </div>
            </div>
        </div>
    );
};
