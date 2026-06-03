import type { DrawEvent } from './types';

class Whiteboard {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ws: WebSocket;
    private isDrawing = false;
    private color = '#000000';
    private brushSize = 2;

    constructor(canvasId: string, roomId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas 2D context');
        this.ctx = context;

        this.ws = new WebSocket(`ws://localhost:8080/ws/board/${roomId}`);

        this.setupWebsockets();
        this.setupMouseEvents();
    }

    private setupWebsockets() {
        this.ws.onmessage = (event) => {
            const data: DrawEvent = JSON.parse(event.data);
            this.handleRemoteDraw(data);
        };
    }

    private handleRemoteDraw(data: DrawEvent) {
        this.ctx.lineWidth = data.brushSize;
        this.ctx.strokeStyle = data.color;
        this.ctx.lineCap = 'round';

        if (data.type === 'START') {
            this.ctx.beginPath();
            this.ctx.moveTo(data.x, data.y);
        } else if (data.type === 'DRAW') {
            this.ctx.lineTo(data.x, data.y);
            this.ctx.stroke();
        }
    }

    private setupMouseEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            const { x, y } = this.getCoordinates(e);
            this.emitEvent('START', x, y);
            this.handleRemoteDraw({ type: 'START', x, y, color: this.color, brushSize: this.brushSize });
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const { x, y } = this.getCoordinates(e);
            this.emitEvent('DRAW', x, y);
            this.handleRemoteDraw({ type: 'DRAW', x, y, color: this.color, brushSize: this.brushSize });
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });
    }

    private emitEvent(type: DrawEvent['type'], x: number, y: number) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, x, y, color: this.color, brushSize: this.brushSize }));
        }
    }

    private getCoordinates(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }
}
