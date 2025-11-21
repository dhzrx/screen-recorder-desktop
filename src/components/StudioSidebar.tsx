import React from 'react';

interface StudioSidebarProps {
    zoomLevel: number;
    setZoomLevel: (level: number) => void;
    zoomIntensity: number;
    setZoomIntensity: (intensity: number) => void;
    backgroundColor: string;
    setBackgroundColor: (color: string) => void;
    padding: number;
    setPadding: (padding: number) => void;
    borderRadius: number;
    setBorderRadius: (radius: number) => void;
    backgroundType: 'solid' | 'gradient' | 'image';
    setBackgroundType: (type: 'solid' | 'gradient' | 'image') => void;
    backgroundGradient: string;
    setBackgroundGradient: (gradient: string) => void;
    backgroundImage: string | null;
    setBackgroundImage: (image: string | null) => void;
    hideCursorOnIdle: boolean;
    setHideCursorOnIdle: (enable: boolean) => void;
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
    zoomLevel,
    setZoomLevel,
    zoomIntensity,
    setZoomIntensity,
    backgroundColor,
    setBackgroundColor,
    padding,
    setPadding,
    borderRadius,
    setBorderRadius,
    backgroundType,
    setBackgroundType,
    backgroundGradient,
    setBackgroundGradient,
    backgroundImage,
    setBackgroundImage,
    hideCursorOnIdle,
    setHideCursorOnIdle
}) => {
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setBackgroundImage(event.target.result as string);
                    setBackgroundType('image');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="studio-sidebar" style={{
            padding: '1.5rem',
            backgroundColor: '#1a1a1a',
            height: '100%',
            borderRight: '1px solid #333',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            overflowY: 'auto'
        }}>
            <div className="sidebar-header">
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Studio Settings</h2>
            </div>

            {/* Size / Layout Section */}
            <div className="control-group">
                <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#aaa' }}>Layout</label>

                <div className="control-item" style={{ marginBottom: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>Padding</span>
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>{padding}px</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="200"
                        value={padding}
                        onChange={(e) => setPadding(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#646cff' }}
                    />
                </div>

                <div className="control-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>Rounded Corners</span>
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>{borderRadius}px</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={borderRadius}
                        onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#646cff' }}
                    />
                </div>
            </div>

            {/* Background Section */}
            <div className="control-group">
                <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#aaa' }}>Background</label>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: '#2a2a2a', padding: '4px', borderRadius: '6px' }}>
                    {(['solid', 'gradient', 'image'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setBackgroundType(type)}
                            style={{
                                flex: 1,
                                padding: '6px 0',
                                border: 'none',
                                background: backgroundType === type ? '#444' : 'transparent',
                                color: backgroundType === type ? '#fff' : '#888',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {backgroundType === 'solid' && (
                    <>
                        <div className="color-presets" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                            {['#000000', '#1a1a1a', '#FF4444', '#44FF44', '#4444FF'].map(color => (
                                <div
                                    key={color}
                                    onClick={() => setBackgroundColor(color)}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1/1',
                                        backgroundColor: color,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        border: backgroundColor === color ? '2px solid white' : '1px solid #333'
                                    }}
                                />
                            ))}
                        </div>
                        <div className="custom-color" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Custom Color</span>
                        </div>
                    </>
                )}

                {backgroundType === 'gradient' && (
                    <div className="gradient-presets" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        {[
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
                            'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
                            'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)'
                        ].map((grad, i) => (
                            <div
                                key={i}
                                onClick={() => setBackgroundGradient(grad)}
                                style={{
                                    height: '60px',
                                    background: grad,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: backgroundGradient === grad ? '2px solid white' : '1px solid #333'
                                }}
                            />
                        ))}
                    </div>
                )}

                {backgroundType === 'image' && (
                    <div className="image-upload">
                        <div style={{
                            border: '2px dashed #444',
                            borderRadius: '8px',
                            padding: '1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            height: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }} onClick={() => document.getElementById('bg-image-input')?.click()}>
                            {!backgroundImage && <span style={{ fontSize: '0.85rem', color: '#888' }}>Click to Upload Image</span>}
                        </div>
                        <input
                            id="bg-image-input"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}
            </div>

            {/* Effects Section */}
            <div className="control-group">
                <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#aaa' }}>Effects</label>

                <div className="control-item" style={{ marginBottom: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>Zoom Level</span>
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>{zoomLevel}x</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#646cff' }}
                    />
                </div>

                <div className="control-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>Zoom Speed</span>
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>{Math.round(zoomIntensity * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.01"
                        max="0.5"
                        step="0.01"
                        value={zoomIntensity}
                        onChange={(e) => setZoomIntensity(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#646cff' }}
                    />
                </div>

                <div className="control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>Hide Cursor on Idle</span>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                        <input
                            type="checkbox"
                            checked={hideCursorOnIdle}
                            onChange={(e) => setHideCursorOnIdle(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: hideCursorOnIdle ? '#646cff' : '#444',
                            borderRadius: '20px',
                            transition: '0.4s'
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '16px',
                                width: '16px',
                                left: hideCursorOnIdle ? '22px' : '2px',
                                bottom: '2px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: '0.4s'
                            }} />
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};
