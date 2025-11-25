export class Compositor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private screenVideo: HTMLVideoElement | null = null;
    private webcamVideo: HTMLVideoElement;
    private animationFrameId: number | null = null;

    // State
    private zoomLevel: number = 1;
    private targetZoomLevel: number = 1;
    private currentZoomLevel: number = 1;
    private zoomIntensity: number = 0.1;

    // Cursor State
    private targetCursor: { x: number, y: number } = { x: 0, y: 0 };
    private currentCursor: { x: number, y: number } = { x: 0, y: 0 };
    private cursorHistory: { x: number, y: number }[] = [];
    private readonly MAX_HISTORY = 5;
    private lastCursorUpdate: number = Date.now();
    private idleThreshold: number = 2000; // 2 seconds default
    private hideCursorOnIdle: boolean = false;

    private screenBounds: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 1920, height: 1080 };

    // Studio Settings
    private backgroundColor: string = '#000000';
    private padding: number = 0;
    private borderRadius: number = 0;
    private backgroundType: 'solid' | 'gradient' | 'image' = 'solid';
    private backgroundGradient: string = '';
    private backgroundImage: HTMLImageElement | null = null;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1920;
        this.canvas.height = 1080;
        this.ctx = this.canvas.getContext('2d', { alpha: false })!;

        this.webcamVideo = document.createElement('video');
        this.webcamVideo.autoplay = true;
        this.webcamVideo.muted = true;
    }

    public setScreenStream(stream: MediaStream) {
        this.screenVideo = document.createElement('video');
        this.screenVideo.srcObject = stream;
        this.screenVideo.autoplay = true;
        this.screenVideo.muted = true;
        this.screenVideo.onloadedmetadata = () => {
            this.screenVideo!.play();
        };
    }

    public setSourceVideo(video: HTMLVideoElement) {
        this.screenVideo = video;
    }

    public setWebcamStream(stream: MediaStream | null) {
        if (stream) {
            this.webcamVideo.srcObject = stream;
            this.webcamVideo.play();
        } else {
            this.webcamVideo.srcObject = null;
        }
    }

    public setWebcamSource(video: HTMLVideoElement) {
        this.webcamVideo = video;
    }

    public setScreenBounds(bounds: { x: number, y: number, width: number, height: number }) {
        this.screenBounds = bounds;
    }

    public updateCursorPosition(x: number, y: number) {
        // Debug log (sample)
        if (Math.random() < 0.02) {
            console.log(`[Compositor.updateCursorPosition] Setting targetCursor to (${x.toFixed(3)}, ${y.toFixed(3)})`);
        }

        // Check if position actually changed to avoid fake updates
        if (x !== this.targetCursor.x || y !== this.targetCursor.y) {
            this.lastCursorUpdate = Date.now();
        }
        this.targetCursor = { x, y };

        // Initialize current if it's the first update
        if (this.currentCursor.x === 0 && this.currentCursor.y === 0) {
            this.currentCursor = { x, y };
        }
    }

    public setZoomLevel(level: number) {
        this.targetZoomLevel = level;
    }

    public setZoomIntensity(intensity: number) {
        this.zoomIntensity = intensity;
    }

    public setBackgroundColor(color: string) {
        this.backgroundColor = color;
    }

    public setPadding(padding: number) {
        this.padding = padding;
    }

    public setBorderRadius(radius: number) {
        this.borderRadius = radius;
    }

    public setBackgroundGradient(gradient: string) {
        this.backgroundGradient = gradient;
    }

    public setBackgroundImage(imageDataUrl: string | null) {
        if (imageDataUrl) {
            const img = new Image();
            img.src = imageDataUrl;
            img.onload = () => {
                this.backgroundImage = img;
            };
        } else {
            this.backgroundImage = null;
        }
    }

    public setBackgroundType(type: 'solid' | 'gradient' | 'image') {
        this.backgroundType = type;
    }

    public setHideCursorOnIdle(enable: boolean) {
        this.hideCursorOnIdle = enable;
    }

    public start() {
        if (!this.animationFrameId) {
            this.draw();
        }
    }

    public stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    public getStream() {
        return this.canvas.captureStream(60);
    }

    public getCanvas() {
        return this.canvas;
    }

    private draw = () => {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 1. Draw Background
        if (this.backgroundType === 'solid') {
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, width, height);
        } else if (this.backgroundType === 'gradient' && this.backgroundGradient) {
            const gradient = this.ctx.createLinearGradient(0, 0, width, height);
            if (this.backgroundGradient.includes('#667eea')) {
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
            } else if (this.backgroundGradient.includes('#ff9a9e')) {
                gradient.addColorStop(0, '#ff9a9e');
                gradient.addColorStop(1, '#fecfef');
            } else if (this.backgroundGradient.includes('#84fab0')) {
                gradient.addColorStop(0, '#84fab0');
                gradient.addColorStop(1, '#8fd3f4');
            } else if (this.backgroundGradient.includes('#f093fb')) {
                gradient.addColorStop(0, '#f093fb');
                gradient.addColorStop(1, '#f5576c');
            } else {
                gradient.addColorStop(0, '#333');
                gradient.addColorStop(1, '#000');
            }
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, width, height);
        } else if (this.backgroundType === 'image' && this.backgroundImage) {
            const scale = Math.max(width / this.backgroundImage.width, height / this.backgroundImage.height);
            const x = (width / 2) - (this.backgroundImage.width / 2) * scale;
            const y = (height / 2) - (this.backgroundImage.height / 2) * scale;
            this.ctx.drawImage(this.backgroundImage, x, y, this.backgroundImage.width * scale, this.backgroundImage.height * scale);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, width, height);
        }

        // Smart Zoom Logic
        this.updateSmartZoom();

        // Smooth Zoom Transition
        this.currentZoomLevel += (this.targetZoomLevel - this.currentZoomLevel) * this.zoomIntensity;

        // Smooth Cursor Transition (Momentum)
        const cursorLerp = 0.2;
        this.currentCursor.x += (this.targetCursor.x - this.currentCursor.x) * cursorLerp;
        this.currentCursor.y += (this.targetCursor.y - this.currentCursor.y) * cursorLerp;

        // Update History for Motion Blur
        this.cursorHistory.push({ ...this.currentCursor });
        if (this.cursorHistory.length > this.MAX_HISTORY) {
            this.cursorHistory.shift();
        }

        // 2. Draw Screen Content (with Padding and Radius)
        if (this.screenVideo && this.screenVideo.readyState >= 2) {
            const innerWidth = width - (this.padding * 2);
            const innerHeight = height - (this.padding * 2);
            const startX = this.padding;
            const startY = this.padding;

            this.ctx.save();

            if (this.borderRadius > 0) {
                this.ctx.beginPath();
                this.ctx.roundRect(startX, startY, innerWidth, innerHeight, this.borderRadius);
                this.ctx.clip();
            } else if (this.padding > 0) {
                this.ctx.beginPath();
                this.ctx.rect(startX, startY, innerWidth, innerHeight);
                this.ctx.clip();
            }

            // Calculate cursor position in canvas pixels for zoom center
            const scaledCursorX = this.currentCursor.x * width;
            const scaledCursorY = this.currentCursor.y * height;

            if (this.currentZoomLevel > 1.01) {
                const zoomedWidth = width / this.currentZoomLevel;
                const zoomedHeight = height / this.currentZoomLevel;

                let sx = scaledCursorX - zoomedWidth / 2;
                let sy = scaledCursorY - zoomedHeight / 2;

                sx = Math.max(0, Math.min(sx, width - zoomedWidth));
                sy = Math.max(0, Math.min(sy, height - zoomedHeight));

                this.ctx.drawImage(
                    this.screenVideo,
                    sx, sy, zoomedWidth, zoomedHeight,
                    startX, startY, innerWidth, innerHeight
                );
            } else {
                this.ctx.drawImage(this.screenVideo, startX, startY, innerWidth, innerHeight);
            }

            this.ctx.restore();
        }

        // 3. Draw Webcam Overlay
        // Check for srcObject (Stream) OR src (Blob URL)
        const hasWebcamSource = this.webcamVideo.srcObject || this.webcamVideo.src;
        if (this.webcamVideo.readyState >= 2 && hasWebcamSource) {
            const webcamWidth = 320;
            const webcamHeight = 180;
            const padding = 20;
            this.ctx.drawImage(
                this.webcamVideo,
                this.canvas.width - webcamWidth - padding,
                this.canvas.height - webcamHeight - padding,
                webcamWidth,
                webcamHeight
            );
        }

        // 4. Draw Cursor with Motion Blur
        this.drawCursor();

        this.animationFrameId = requestAnimationFrame(this.draw);
    }

    private drawCursor() {
        // Idle Check
        if (this.hideCursorOnIdle) {
            const timeSinceLastMove = Date.now() - this.lastCursorUpdate;
            if (timeSinceLastMove > this.idleThreshold) {
                return; // Hide cursor
            }
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        const innerWidth = width - (this.padding * 2);
        const innerHeight = height - (this.padding * 2);
        const startX = this.padding;
        const startY = this.padding;

        const mapCursor = (cursor: { x: number, y: number }) => {
            // Cursor x,y are now UV coordinates (0.0 - 1.0)
            // Map to canvas dimensions
            const scaledCursorX = cursor.x * width;
            const scaledCursorY = cursor.y * height;

            let drawX = scaledCursorX;
            let drawY = scaledCursorY;

            if (this.currentZoomLevel > 1.01) {
                const zoomedWidth = width / this.currentZoomLevel;
                const zoomedHeight = height / this.currentZoomLevel;

                // Current cursor (focus point) in canvas pixels
                const scaledCurrentX = this.currentCursor.x * width;
                const scaledCurrentY = this.currentCursor.y * height;

                let sx = scaledCurrentX - zoomedWidth / 2;
                let sy = scaledCurrentY - zoomedHeight / 2;
                sx = Math.max(0, Math.min(sx, width - zoomedWidth));
                sy = Math.max(0, Math.min(sy, height - zoomedHeight));

                const relX = scaledCursorX - sx;
                const relY = scaledCursorY - sy;

                drawX = (relX / zoomedWidth) * innerWidth;
                drawY = (relY / zoomedHeight) * innerHeight;
            } else {
                drawX = (scaledCursorX / width) * innerWidth;
                drawY = (scaledCursorY / height) * innerHeight;
            }

            drawX += startX;
            drawY += startY;

            return { x: drawX, y: drawY };
        };

        // Draw Ghost Cursors (Motion Blur)
        for (let i = 0; i < this.cursorHistory.length; i++) {
            const pos = mapCursor(this.cursorHistory[i]);
            const opacity = (i + 1) / (this.cursorHistory.length + 1) * 0.3; // Reduced opacity

            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI); // Bigger Ghost
            this.ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
            this.ctx.fill();
        }

        // Draw Main Cursor (Bigger Halo)
        const mainPos = mapCursor(this.currentCursor);

        // 1. Outer Halo (Semi-transparent)
        this.ctx.beginPath();
        this.ctx.arc(mainPos.x, mainPos.y, 25, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.fill();

        // 2. Inner Core (Solid)
        this.ctx.beginPath();
        this.ctx.arc(mainPos.x, mainPos.y, 12, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    private updateSmartZoom() {
        // Calculate Velocity (Distance moved since last frame)
        // We need previous cursor position.
        // currentCursor is updated every frame in draw loop via lerp.
        // targetCursor is the raw input.

        // Let's use targetCursor changes to detect "Input Activity"
        // If targetCursor hasn't changed for X ms, we are "Dwelling".

        const timeSinceLastMove = Date.now() - this.lastCursorUpdate;
        const DWELL_THRESHOLD = 400; // 0.4s to trigger zoom

        if (timeSinceLastMove > DWELL_THRESHOLD) {
            // User is dwelling/reading/focusing -> Zoom In
            this.targetZoomLevel = 1.5;
        } else {
            // User is moving -> Zoom Out (Overview)
            this.targetZoomLevel = 1.0;
        }
    }
}
