import { useState, useEffect, useRef } from 'react';

export interface DesktopCapturerSource {
    id: string;
    name: string;
    thumbnail: {
        toDataURL: () => string;
    };
    display_id: string;
    appIcon: {
        toDataURL: () => string;
    } | null;
}

export interface CursorEvent {
    x: number;
    y: number;
    t: number; // Timestamp relative to start
}

export function useRecorder() {
    const [sources, setSources] = useState<DesktopCapturerSource[]>([]);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedCursorData, setRecordedCursorData] = useState<CursorEvent[]>([]);
    const [recordedDuration, setRecordedDuration] = useState<number>(0);
    const [debugInfo, setDebugInfo] = useState<{ raw: { x: number, y: number }, uv: { u: number, v: number }, bounds: any } | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const cursorLogRef = useRef<CursorEvent[]>([]);
    const startTimeRef = useRef<number>(0);
    const recordingBoundsRef = useRef<{ x: number, y: number, width: number, height: number } | null>(null);
    const isRecordingRef = useRef<boolean>(false);

    useEffect(() => {
        getSources();

        // Listen for cursor position
        const handleCursor = (_event: any, point: { x: number, y: number }) => {
            let u = 0;
            let v = 0;
            const bounds = recordingBoundsRef.current;

            // Normalize to UV coordinates (0.0 - 1.0)
            if (bounds && bounds.width > 0 && bounds.height > 0) {
                u = (point.x - bounds.x) / bounds.width;
                v = (point.y - bounds.y) / bounds.height;
            } else {
                // Fallback
                u = point.x / 1920;
                v = point.y / 1080;
            }

            setDebugInfo({ raw: point, uv: { u, v }, bounds });

            if (isRecordingRef.current) {
                cursorLogRef.current.push({
                    x: u, // Store as UV
                    y: v, // Store as UV
                    t: Date.now() - startTimeRef.current
                });
            }
        };

        // @ts-ignore
        window.ipcRenderer.on('cursor-position', handleCursor);

        // Listen for STOP_RECORDING request from Main process (triggered by Floating Window)
        const handleStopRequest = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                isRecordingRef.current = false;
                // Also hide floating controls via IPC if not already handled by main
                // @ts-ignore
                window.ipcRenderer.send('HIDE_FLOATING_CONTROLS');
            }
        };

        // @ts-ignore
        window.ipcRenderer.on('STOP_RECORDING', handleStopRequest);

        return () => {
            // Cleanup
            // @ts-ignore
            window.ipcRenderer.off('cursor-position', handleCursor);
            // @ts-ignore
            window.ipcRenderer.off('STOP_RECORDING', handleStopRequest);
        };
    }, [isRecording]);

    const getSources = async () => {
        try {
            // @ts-ignore
            const availableSources = await window.ipcRenderer.getScreenSources();
            setSources(availableSources);
        } catch (error) {
            console.error('Error getting sources:', error);
        }
    };

    const toggleWebcam = async () => {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            setWebcamStream(null);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setWebcamStream(stream);
            } catch (e) {
                console.error('Error accessing webcam:', e);
            }
        }
    };

    const startRecording = async (sourceId: string) => {
        try {
            console.log('Starting recording for Source ID:', sourceId);

            // Find the source object to get display_id
            const source = sources.find(s => s.id === sourceId);
            const displayId = source?.display_id;

            // 0. Get Screen Bounds for Cursor Normalization
            try {
                // @ts-ignore
                const bounds = await window.ipcRenderer.getScreenBounds(sourceId, displayId);
                if (bounds && bounds.width > 0 && bounds.height > 0) {
                    recordingBoundsRef.current = bounds;
                } else {
                    console.warn('Invalid bounds received, falling back to default');
                    recordingBoundsRef.current = { x: 0, y: 0, width: 1920, height: 1080 };
                }
                console.log('Recording Bounds:', recordingBoundsRef.current);
            } catch (err) {
                console.error('Failed to get screen bounds:', err);
                recordingBoundsRef.current = { x: 0, y: 0, width: 1920, height: 1080 }; // Fallback
            }

            // 1. Get Screen Stream (Raw)
            const screenStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId,
                        minWidth: 1920,
                        maxWidth: 1920,
                        minHeight: 1080,
                        maxHeight: 1080
                    }
                } as any
            });

            // Start Recording
            const mediaRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm; codecs=vp9' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            cursorLogRef.current = [];
            startTimeRef.current = Date.now();
            setRecordedDuration(0);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordedBlob(blob);
                setRecordedCursorData(cursorLogRef.current);
                setRecordedDuration((Date.now() - startTimeRef.current) / 1000); // Seconds

                // Stop tracks
                screenStream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            isRecordingRef.current = true;
            setSelectedSource(sourceId);

            // @ts-ignore
            window.ipcRenderer.send('SHOW_FLOATING_CONTROLS');

        } catch (e) {
            console.error('Error starting recording:', e);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            isRecordingRef.current = false;
            // @ts-ignore
            window.ipcRenderer.send('HIDE_FLOATING_CONTROLS');
        }
    };

    const resetRecording = () => {
        setRecordedBlob(null);
        setRecordedCursorData([]);
        setRecordedDuration(0);
        setSelectedSource(null);
    };

    return {
        sources,
        selectedSource,
        startRecording,
        stopRecording,
        isRecording,
        webcamEnabled: !!webcamStream,
        toggleWebcam,
        webcamStream,
        recordedBlob,
        recordedCursorData,
        recordedDuration,
        resetRecording,
        debugInfo
    };
}
