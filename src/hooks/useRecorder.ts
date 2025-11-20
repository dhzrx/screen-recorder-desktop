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

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const cursorLogRef = useRef<CursorEvent[]>([]);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        getSources();

        // Listen for cursor position
        const handleCursor = (_event: any, point: { x: number, y: number }) => {
            if (isRecording) {
                cursorLogRef.current.push({
                    x: point.x,
                    y: point.y,
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
                // Also hide floating controls via IPC if not already handled by main
                // @ts-ignore
                window.ipcRenderer.send('HIDE_FLOATING_CONTROLS');
            }
        };

        // @ts-ignore
        window.ipcRenderer.on('STOP_RECORDING', handleStopRequest);

        return () => {
            // Cleanup
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

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordedBlob(blob);
                setRecordedCursorData(cursorLogRef.current);

                // Stop tracks
                screenStream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
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
            // @ts-ignore
            window.ipcRenderer.send('HIDE_FLOATING_CONTROLS');
        }
    };

    const resetRecording = () => {
        setRecordedBlob(null);
        setRecordedCursorData([]);
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
        resetRecording
    };
}
