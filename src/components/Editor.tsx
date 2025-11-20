import React, { useEffect, useRef, useState } from 'react';
import { Compositor } from '../utils/compositor';
import { StudioSidebar } from './StudioSidebar';
import { CursorEvent } from '../hooks/useRecorder';

interface EditorProps {
    recordedBlob: Blob;
    cursorData: CursorEvent[];
    onClose: () => void;
}

export const Editor: React.FC<EditorProps> = ({ recordedBlob, cursorData, onClose }) => {
    // Studio State
    const [zoom, setZoom] = useState(1);
    const [intensity, setIntensity] = useState(0.1);
    const [bgColor, setBgColor] = useState('#000000');
    const [pad, setPad] = useState(0);
    const [radius, setRadius] = useState(0);
    const [bgType, setBgType] = useState<'solid' | 'gradient' | 'image'>('solid');
    const [bgGradient, setBgGradient] = useState('');
    const [bgImage, setBgImage] = useState<string | null>(null);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const compositorRef = useRef<Compositor | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Initialize Compositor and Video
    useEffect(() => {
        if (videoRef.current && !compositorRef.current) {
            const comp = new Compositor();
            compositorRef.current = comp;
            comp.setSourceVideo(videoRef.current);

            // Initial settings
            comp.setZoomLevel(zoom);
            comp.setZoomIntensity(intensity);
            comp.setBackgroundColor(bgColor);
            comp.setPadding(pad);
            comp.setBorderRadius(radius);
            comp.setBackgroundType(bgType);
        }

        if (videoRef.current) {
            videoRef.current.src = URL.createObjectURL(recordedBlob);
            videoRef.current.onloadedmetadata = () => {
                setDuration(videoRef.current!.duration);
            };
        }

        return () => {
            if (compositorRef.current) {
                compositorRef.current.stop();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [recordedBlob]);

    // Sync Settings
    useEffect(() => {
        if (compositorRef.current) {
            compositorRef.current.setZoomLevel(zoom);
            compositorRef.current.setZoomIntensity(intensity);
            compositorRef.current.setBackgroundColor(bgColor);
            compositorRef.current.setPadding(pad);
            compositorRef.current.setBorderRadius(radius);
            compositorRef.current.setBackgroundType(bgType);
            compositorRef.current.setBackgroundGradient(bgGradient);
            compositorRef.current.setBackgroundImage(bgImage);
        }
    }, [zoom, intensity, bgColor, pad, radius, bgType, bgGradient, bgImage]);

    // Animation Loop
    useEffect(() => {
        const draw = () => {
            if (compositorRef.current && videoRef.current && canvasRef.current) {
                // 1. Update Cursor Position based on Video Time
                const time = videoRef.current.currentTime * 1000; // ms
                const cursor = getCursorAtTime(time, cursorData);
                if (cursor) {
                    compositorRef.current.updateCursorPosition(cursor.x, cursor.y);
                }

                // 2. Draw Frame
                // We need to manually trigger draw because Compositor usually runs its own loop
                // But here we want to control it. 
                // Actually, Compositor.start() runs a loop. 
                // If we use Compositor's loop, it might drift from video?
                // Better to just call a public draw method if we exposed it, or rely on Compositor's internal loop
                // which draws whatever is on the video element.
                // Since Compositor uses requestAnimationFrame, it should be fine.
                // However, we need to make sure the Compositor is rendering to OUR canvas.
                // Currently Compositor creates its own canvas.
                // We should append that canvas to our container.
            }
            animationFrameRef.current = requestAnimationFrame(draw);
        };

        // Start Compositor's internal loop
        if (compositorRef.current) {
            compositorRef.current.start();
        }

        // We also need a loop to update React state for the timeline scrubber
        const updateTime = () => {
            if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
            }
            if (isPlaying) {
                requestAnimationFrame(updateTime);
            }
        };

        if (isPlaying) {
            updateTime();
        }

    }, [isPlaying, cursorData]);

    // Append Compositor Canvas
    useEffect(() => {
        if (containerRef.current && compositorRef.current) {
            const canvas = compositorRef.current.getCanvas();
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.objectFit = 'contain';
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(canvas);
        }
    }, []);

    const getCursorAtTime = (time: number, data: CursorEvent[]) => {
        // Simple linear search or binary search
        // For now, find the last event before time
        // Optimization: remember last index
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i].t <= time) {
                return data[i];
            }
        }
        return data[0]; // Default to start
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    return (
        <div className="editor" style={{ display: 'flex', height: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
            {/* Sidebar */}
            <aside style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #333' }}>
                <StudioSidebar
                    zoomLevel={zoom}
                    setZoomLevel={setZoom}
                    zoomIntensity={intensity}
                    setZoomIntensity={setIntensity}
                    backgroundColor={bgColor}
                    setBackgroundColor={setBgColor}
                    padding={pad}
                    setPadding={setPad}
                    borderRadius={radius}
                    setBorderRadius={setRadius}
                    backgroundType={bgType}
                    setBackgroundType={setBgType}
                    backgroundGradient={bgGradient}
                    setBackgroundGradient={setBgGradient}
                    backgroundImage={bgImage}
                    setBackgroundImage={setBgImage}
                />
                <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
                    <button onClick={onClose} style={{ width: '100%', padding: '0.8rem', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        Back to Dashboard
                    </button>
                </div>
            </aside>

            {/* Main Preview Area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                <div className="preview-container" ref={containerRef} style={{
                    flex: 1,
                    backgroundColor: '#000',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    position: 'relative'
                }}>
                    {/* Compositor Canvas will be appended here */}
                </div>

                {/* Timeline Controls */}
                <div className="timeline" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '12px' }}>
                    <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        style={{ flex: 1, accentColor: '#646cff' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{formatTime(duration)}</span>
                </div>
            </main>

            {/* Hidden Video Element for Source */}
            <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
        </div>
    );
};

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
