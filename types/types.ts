export interface DrawEvent {
    type: 'START' | 'DRAW' | 'END';
    x: number;
    y: number;
    color: string;
    brushSize: number;

}