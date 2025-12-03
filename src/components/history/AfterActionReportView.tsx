import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { useStore } from '../../store';
import { generateAfterActionReport, formatReportAsText, type TimelineEvent } from '../../lib/reportGenerator';
import { TEAM_COLORS } from '../../constants';
import { Button } from '../ui/button';
import { X, Download, Trophy, Skull, Clock, Users, Vote, Copy, Check, Camera } from 'lucide-react';
import { showSuccess, showError } from '../ui/Toast';

interface AfterActionReportViewProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 复盘战报组件
 * 
 * 展示游戏结束后的完整战报，支持：
 * - 时间轴视图
 * - 玩家统计
 * - 文本导出
 * - 分享功能
 */
export const AfterActionReportView: React.FC<AfterActionReportViewProps> = ({ isOpen, onClose }) => {
  const gameState = useStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'players'>('summary');
  const [copied, setCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 生成战报
  const report = useMemo(() => {
    if (!gameState) return null;
    return generateAfterActionReport(gameState);
  }, [gameState]);
  
  if (!isOpen || !report) return null;
  
  const handleCopyText = () => {
    const text = formatReportAsText(report);
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showSuccess('战报已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const handleDownload = () => {
    const text = formatReportAsText(report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grimoire-report-${report.gameId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('战报已下载');
  };
  
  // 截图导出功能
  const handleCaptureImage = async () => {
    if (!contentRef.current) return;
    
    setIsCapturing(true);
    
    try {
      // 等待一帧让 UI 更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#1c1917', // stone-900
        scale: 2, // 高清导出
        useCORS: true,
        logging: false,
        windowWidth: contentRef.current.scrollWidth,
        windowHeight: contentRef.current.scrollHeight,
      });
      
      // 创建下载链接
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `grimoire-report-${report.gameId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      showSuccess('战报图片已保存');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      showError('截图失败，请重试');
    } finally {
      setIsCapturing(false);
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-3xl max-h-[90vh] mx-4 glass-panel rounded-xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${report.winner === 'GOOD' ? 'bg-amber-900/50' : 'bg-red-900/50'}
              `}>
                {report.winner === 'GOOD' ? <Trophy className="w-5 h-5 text-amber-400" /> : <Skull className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <h2 className="font-cinzel text-xl text-amber-200">游戏战报</h2>
                <p className="text-xs text-stone-500">{report.scriptName} • {report.totalRounds} 轮</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyText} title="复制文本">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} title="下载文本">
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => void handleCaptureImage()} 
                disabled={isCapturing}
                title="保存为图片"
              >
                {isCapturing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Camera className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* 标签页 */}
          <div className="flex border-b border-stone-800">
            {(['summary', 'timeline', 'players'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab 
                    ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-900/10' 
                    : 'text-stone-500 hover:text-stone-300'
                  }
                `}
              >
                {tab === 'summary' && '📊 概览'}
                {tab === 'timeline' && '⏱️ 时间轴'}
                {tab === 'players' && '👥 玩家'}
              </button>
            ))}
          </div>
          
          {/* 内容区 */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 bg-stone-900"
               data-html2canvas-ignore-scroll="true"
          >
            {/* 概览标签页 */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* 胜负结果 */}
                <div className={`
                  p-6 rounded-xl text-center
                  ${report.winner === 'GOOD' 
                    ? 'bg-gradient-to-br from-amber-900/30 to-amber-950/30 border border-amber-700/30' 
                    : 'bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-700/30'
                  }
                `}>
                  <h3 className={`text-3xl font-cinzel font-bold ${report.winner === 'GOOD' ? 'text-amber-400' : 'text-red-400'}`}>
                    {report.winner === 'GOOD' ? '善良阵营胜利!' : '邪恶阵营胜利!'}
                  </h3>
                  <p className="text-stone-400 mt-2">{report.winReason}</p>
                </div>
                
                {/* 统计卡片 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={<Clock className="w-5 h-5" />} label="游戏时长" value={`${report.duration}分钟`} />
                  <StatCard icon={<Users className="w-5 h-5" />} label="玩家人数" value={`${report.playerSummaries.length}`} />
                  <StatCard icon={<Skull className="w-5 h-5" />} label="死亡人数" value={`${report.statistics.totalDeaths}`} />
                  <StatCard icon={<Vote className="w-5 h-5" />} label="处决次数" value={`${report.statistics.totalExecutions}`} />
                </div>
                
                {/* MVP */}
                {report.mvp && (
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-amber-800/50 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-amber-600 uppercase tracking-wider">最佳玩家 MVP</p>
                        <p className="text-lg font-bold text-amber-200">{report.mvp.name}</p>
                        <p className="text-sm text-stone-500">{report.mvp.realRole} • 存活 {report.mvp.survivalRounds} 轮</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 时间轴标签页 */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {report.timeline.length === 0 ? (
                  <p className="text-center text-stone-500 py-8">暂无时间轴事件</p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-stone-700">
                    {report.timeline.map((event, index) => (
                      <TimelineEventCard key={event.id} event={event} index={index} />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* 玩家标签页 */}
            {activeTab === 'players' && (
              <div className="space-y-3">
                {report.playerSummaries.map((player, index) => {
                  const teamColor = player.team ? TEAM_COLORS[player.team as keyof typeof TEAM_COLORS] : '#57534e';
                  
                  return (
                    <motion.div
                      key={player.seatId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        flex items-center gap-4 p-3 rounded-lg
                        ${player.isDead ? 'bg-stone-900/50' : 'bg-stone-800/50'}
                        border border-stone-700/50
                      `}
                    >
                      {/* 座位号 */}
                      <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-sm font-bold text-stone-400">
                        {player.seatId + 1}
                      </div>
                      
                      {/* 玩家信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${player.isDead ? 'text-stone-500 line-through' : 'text-stone-200'}`}>
                            {player.name}
                          </span>
                          {player.wasMisled && (
                            <span className="text-xs bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded">伪装</span>
                          )}
                          {player.wasTainted && (
                            <span className="text-xs bg-purple-900/50 text-purple-400 px-1.5 py-0.5 rounded">受影响</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${teamColor}33`, color: teamColor }}
                          >
                            {player.realRole || '未知'}
                          </span>
                          <span className="text-xs text-stone-500">
                            存活 {player.survivalRounds} 轮 • 投票 {player.votesCast} 次
                          </span>
                        </div>
                      </div>
                      
                      {/* 状态 */}
                      <div className="text-xl">
                        {player.isDead ? '☠️' : '✅'}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// 统计卡片组件
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="p-4 rounded-lg bg-stone-800/50 border border-stone-700/50 text-center">
    <div className="flex justify-center text-amber-400 mb-2">{icon}</div>
    <div className="text-lg font-bold text-stone-200">{value}</div>
    <div className="text-xs text-stone-500">{label}</div>
  </div>
);

// 时间轴事件卡片
const TimelineEventCard: React.FC<{ event: TimelineEvent; index: number }> = ({ event, index }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'phase_change': return '🔄';
      case 'death': return '💀';
      case 'vote': return '🗳️';
      case 'execution': return '⚖️';
      case 'ability': return '✨';
      case 'game_end': return '🏁';
      default: return '📝';
    }
  };
  
  const time = new Date(event.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="relative pb-4"
    >
      {/* 时间轴节点 */}
      <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-stone-800 border-2 border-amber-600 flex items-center justify-center text-[8px]">
      </div>
      
      {/* 内容 */}
      <div className="ml-4 p-3 rounded-lg bg-stone-800/30 border border-stone-700/30">
        <div className="flex items-center gap-2 mb-1">
          <span>{getEventIcon()}</span>
          <span className="font-bold text-stone-200">{event.title}</span>
          <span className="text-xs text-stone-500 ml-auto">{time}</span>
        </div>
        <p className="text-sm text-stone-400">{event.description}</p>
      </div>
    </motion.div>
  );
};

export default AfterActionReportView;
