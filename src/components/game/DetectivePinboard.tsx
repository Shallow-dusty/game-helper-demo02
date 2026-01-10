import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

interface Connection {
  id: string;
  from: Point;
  to: Point;
  type: 'suspect' | 'trust'; // 红线(怀疑) 或 绿线(信任)
  marker?: '?' | '!'; // 标记
  createdAt: number;
}

interface DetectivePinboardProps {
  width: number;
  height: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 房间ID，用于localStorage隔离 */
  roomId?: string;
}

const STORAGE_KEY_PREFIX = 'detective_pinboard_';

/**
 * 侦探红线 (Detective's Pinboard)
 * 
 * 本地可视化推理辅助工具：
 * - Alt + 拖拽 = 红线（怀疑）
 * - Shift + 拖拽 = 绿线（信任）
 * - 双击连线 = 添加/切换标记 (?/!)
 * - 右键连线 = 删除
 * - 数据存储在 localStorage
 */
export const DetectivePinboard: React.FC<DetectivePinboardProps> = ({
  width,
  height,
  enabled = true,
  roomId = 'default'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawType, setDrawType] = useState<'suspect' | 'trust'>('suspect');
  const [currentPos, setCurrentPos] = useState<Point | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  // 用于未来的选中高亮功能
  void setSelectedConnection;

  const storageKey = `${STORAGE_KEY_PREFIX}${roomId}`;

  // 从 localStorage 加载数据
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Connection[];
        setConnections(parsed);
      }
    } catch {
      console.warn('Failed to load detective pinboard data');
    }
  }, [storageKey]);

  // 保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(connections));
    } catch {
      console.warn('Failed to save detective pinboard data');
    }
  }, [connections, storageKey]);

  // 绘制所有连线
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 绘制已保存的连线
    connections.forEach(conn => {
      ctx.beginPath();
      ctx.moveTo(conn.from.x, conn.from.y);
      ctx.lineTo(conn.to.x, conn.to.y);
      
      // 红线(怀疑) 或 绿线(信任)
      ctx.strokeStyle = conn.type === 'suspect' 
        ? 'rgba(239, 68, 68, 0.7)' // 红色
        : 'rgba(34, 197, 94, 0.7)'; // 绿色
      ctx.lineWidth = selectedConnection === conn.id ? 4 : 2;
      ctx.setLineDash(conn.type === 'suspect' ? [] : [8, 4]); // 信任线用虚线
      ctx.stroke();

      // 绘制标记
      if (conn.marker) {
        const midX = (conn.from.x + conn.to.x) / 2;
        const midY = (conn.from.y + conn.to.y) / 2;
        
        ctx.font = 'bold 16px serif';
        ctx.fillStyle = conn.type === 'suspect' ? '#ef4444' : '#22c55e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 背景圆
        ctx.beginPath();
        ctx.arc(midX, midY, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();
        
        // 标记文字
        ctx.fillStyle = conn.type === 'suspect' ? '#ef4444' : '#22c55e';
        ctx.fillText(conn.marker, midX, midY);
      }

      // 绘制端点
      [conn.from, conn.to].forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = conn.type === 'suspect' ? '#ef4444' : '#22c55e';
        ctx.fill();
      });
    });

    // 绘制正在拖拽的线
    if (isDrawing && drawStart && currentPos) {
      ctx.beginPath();
      ctx.moveTo(drawStart.x, drawStart.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = drawType === 'suspect' 
        ? 'rgba(239, 68, 68, 0.5)' 
        : 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash(drawType === 'suspect' ? [] : [8, 4]);
      ctx.stroke();
    }
  }, [connections, width, height, isDrawing, drawStart, currentPos, drawType, selectedConnection]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Alt = 红线(怀疑), Shift = 绿线(信任)
    if (e.altKey || e.shiftKey) {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawType(e.altKey ? 'suspect' : 'trust');
      setCurrentPos({ x, y });
    }
  }, [enabled]);

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setCurrentPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [isDrawing]);

  // 鼠标释放
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) {
      setIsDrawing(false);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    // 最小距离检查
    const distance = Math.sqrt(
      Math.pow(endX - drawStart.x, 2) + Math.pow(endY - drawStart.y, 2)
    );

    if (distance > 30) {
      const newConnection: Connection = {
        id: `conn_${String(Date.now())}`,
        from: drawStart,
        to: { x: endX, y: endY },
        type: drawType,
        createdAt: Date.now()
      };
      setConnections(prev => [...prev, newConnection]);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentPos(null);
  }, [isDrawing, drawStart, drawType]);

  // 双击添加/切换标记
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 查找最近的连线中点
    let closestConn: Connection | null = null;
    let minDist = 30;

    for (const conn of connections) {
      const midX = (conn.from.x + conn.to.x) / 2;
      const midY = (conn.from.y + conn.to.y) / 2;
      const dist = Math.sqrt(Math.pow(x - midX, 2) + Math.pow(y - midY, 2));

      if (dist < minDist) {
        minDist = dist;
        closestConn = conn;
      }
    }

    if (closestConn !== null) {
      const targetId = closestConn.id;
      setConnections(prev => prev.map(c => {
        if (c.id === targetId) {
          // 循环切换: 无 -> ? -> ! -> 无
          const markers: (undefined | '?' | '!')[] = [undefined, '?', '!'];
          const currentIdx = markers.indexOf(c.marker);
          const nextIdx = (currentIdx + 1) % markers.length;
          return { ...c, marker: markers[nextIdx] };
        }
        return c;
      }));
    }
  }, [connections]);

  // 右键删除
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 查找最近的连线
    let closestConnId: string | null = null;
    let minDist = 20;

    for (const conn of connections) {
      // 点到线段的距离
      const dist = pointToLineDistance(
        { x, y },
        conn.from,
        conn.to
      );

      if (dist < minDist) {
        minDist = dist;
        closestConnId = conn.id;
      }
    }

    if (closestConnId !== null) {
      const targetId = closestConnId;
      setConnections(prev => prev.filter(c => c.id !== targetId));
    }
  }, [connections]);

  // 清除所有连线
  const clearAll = useCallback(() => {
    setConnections([]);
  }, []);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[50]">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-auto"
        style={{ cursor: 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDrawing(false)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />
      
      {/* 工具提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute bottom-4 left-4 bg-stone-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-stone-400 pointer-events-auto"
      >
        <div className="flex items-center gap-4">
          <span><kbd className="px-1 bg-stone-700 rounded">Alt</kbd>+拖拽 = <span className="text-red-400">怀疑</span></span>
          <span><kbd className="px-1 bg-stone-700 rounded">Shift</kbd>+拖拽 = <span className="text-green-400">信任</span></span>
          <span>双击 = 标记</span>
          <span>右键 = 删除</span>
          <button 
            onClick={clearAll}
            className="ml-2 px-2 py-0.5 bg-stone-700 hover:bg-stone-600 rounded text-stone-300"
          >
            清除
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// 点到线段的距离
function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

export default DetectivePinboard;
