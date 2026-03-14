"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Pencil, Eraser, Trash2, Undo2, X, Minus, Plus } from "lucide-react";

interface DrawEvent {
  type: "draw" | "clear" | "undo";
  x?: number;
  y?: number;
  prevX?: number;
  prevY?: number;
  color?: string;
  thickness?: number;
  tool?: string;
}

interface WhiteboardProps {
  isHost: boolean;
  incomingDrawEvents: DrawEvent[];
  onDraw: (event: DrawEvent) => void;
  onClose: () => void;
}

const COLORS = [
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default function Whiteboard({
  isHost,
  incomingDrawEvents,
  onDraw,
  onClose,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [thickness, setThickness] = useState(3);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const processedEventsRef = useRef(0);

  // Helper to redraw a set of events
  const drawEvents = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      events: DrawEvent[],
    ) => {
      for (const evt of events) {
        if (
          evt.type === "draw" &&
          evt.prevX != null &&
          evt.prevY != null &&
          evt.x != null &&
          evt.y != null
        ) {
          ctx.beginPath();
          ctx.strokeStyle =
            evt.tool === "eraser" ? "#1a1a2e" : evt.color || "#ffffff";
          ctx.lineWidth = evt.thickness || 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(evt.prevX * canvas.width, evt.prevY * canvas.height);
          ctx.lineTo(evt.x * canvas.width, evt.y * canvas.height);
          ctx.stroke();
        } else if (evt.type === "clear") {
          ctx.fillStyle = "#1a1a2e";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    },
    [],
  );

  // Initialize canvas & handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Redraw EVERYTHING because the canvas was cleared by resize
        drawEvents(ctx, canvas, incomingDrawEvents);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [incomingDrawEvents, drawEvents]);

  // Process ONLY incoming draw events incrementally
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newEvents = incomingDrawEvents.slice(processedEventsRef.current);
    drawEvents(ctx, canvas, newEvents);
    processedEventsRef.current = incomingDrawEvents.length;
  }, [incomingDrawEvents, drawEvents]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    );
    if (historyRef.current.length > 50) historyRef.current.shift();
  }, []);

  const getCanvasPos = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / canvas.width,
      y: (e.clientY - rect.top) / canvas.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isHost) return;
    saveHistory();
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    lastPos.current = pos;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isHost) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos.current) return;

    const pos = getCanvasPos(e);
    const strokeColor = tool === "eraser" ? "#1a1a2e" : color;

    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = tool === "eraser" ? thickness * 4 : thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(
      lastPos.current.x * canvas.width,
      lastPos.current.y * canvas.height,
    );
    ctx.lineTo(pos.x * canvas.width, pos.y * canvas.height);
    ctx.stroke();

    // Broadcast the drawing event
    const drawEvt: DrawEvent = {
      type: "draw",
      x: pos.x,
      y: pos.y,
      prevX: lastPos.current.x,
      prevY: lastPos.current.y,
      color,
      thickness: tool === "eraser" ? thickness * 4 : thickness,
      tool,
    };
    onDraw(drawEvt);
    lastPos.current = pos;
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleClear = () => {
    if (!isHost) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveHistory();
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onDraw({ type: "clear" });
  };

  const handleUndo = () => {
    if (!isHost) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const prev = historyRef.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gray-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            <Pencil size={14} className="ml-2 text-indigo-400" />
            <span className="text-[10px] font-black tracking-widest uppercase text-white/60 mx-1">
              Whiteboard
            </span>
          </div>

          {isHost && (
            <>
              {/* Tool Selector */}
              <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 gap-0.5">
                <button
                  onClick={() => setTool("pen")}
                  className={`p-2 rounded-lg transition-all ${tool === "pen" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
                  title="Pen"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setTool("eraser")}
                  className={`p-2 rounded-lg transition-all ${tool === "eraser" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
                  title="Eraser"
                >
                  <Eraser size={16} />
                </button>
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1.5 border border-white/10">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full transition-all hover:scale-125 ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Thickness */}
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                <button
                  onClick={() => setThickness(Math.max(1, thickness - 1))}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Minus size={14} />
                </button>
                <span className="text-[10px] font-black text-white/60 w-4 text-center">
                  {thickness}
                </span>
                <button
                  onClick={() => setThickness(Math.min(20, thickness + 1))}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Undo / Clear */}
              <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-1 border border-white/10">
                <button
                  onClick={handleUndo}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  title="Undo"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  onClick={handleClear}
                  className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                  title="Clear all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </>
          )}

          {!isHost && (
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              View Only
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Close whiteboard"
        >
          <X size={18} />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`absolute inset-0 ${isHost ? (tool === "eraser" ? "cursor-cell" : "cursor-crosshair") : "cursor-default"}`}
        />
      </div>
    </div>
  );
}
