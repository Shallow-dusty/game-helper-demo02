import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { VoteRecord } from '../types';

interface VotingChartProps {
    voteHistory: VoteRecord[];
}

export const VotingChart: React.FC<VotingChartProps> = ({ voteHistory }) => {
    if (voteHistory.length === 0) {
        return (
            <div className="text-center text-stone-500 py-10">
                <p className="text-sm italic">暂无投票记录</p>
            </div>
        );
    }

    // Transform data for chart
    const chartData = voteHistory.map(record => ({
        round: `第${record.round}轮`,
        votes: record.voteCount,
        result: record.result === 'executed' ? '处决' : record.result === 'survived' ? '存活' : '取消'
    }));

    return (
        <div className="bg-stone-900 p-4 rounded-lg border border-stone-700">
            <h3 className="text-lg font-bold text-amber-400 mb-4 font-cinzel">投票趋势分析</h3>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                    <XAxis
                        dataKey="round"
                        stroke="#a8a29e"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#a8a29e"
                        style={{ fontSize: '12px' }}
                        label={{ value: '投票数', angle: -90, position: 'insideLeft', fill: '#a8a29e' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1c1917',
                            border: '1px solid #44403c',
                            borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#fbbf24' }}
                    />
                    <Legend wrapperStyle={{ color: '#a8a29e' }} />
                    <Line
                        type="monotone"
                        dataKey="votes"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        dot={{ fill: '#fbbf24', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="投票数"
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Vote Details Table */}
            <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-stone-700">
                        <tr className="text-stone-400 text-xs">
                            <th className="text-left py-2">轮次</th>
                            <th className="text-left py-2">投票数</th>
                            <th className="text-left py-2">结果</th>
                            <th className="text-left py-2">时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {voteHistory.map((record, idx) => (
                            <tr key={idx} className="border-b border-stone-800 hover:bg-stone-800/30">
                                <td className="py-2 text-amber-300">第{record.round}轮</td>
                                <td className="py-2 text-stone-300">{record.voteCount} 票</td>
                                <td className="py-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${record.result === 'executed'
                                            ? 'bg-red-900/30 text-red-300'
                                            : record.result === 'survived'
                                                ? 'bg-green-900/30 text-green-300'
                                                : 'bg-stone-700/30 text-stone-400'
                                        }`}>
                                        {record.result === 'executed' ? '处决' : record.result === 'survived' ? '存活' : '取消'}
                                    </span>
                                </td>
                                <td className="py-2 text-stone-500 text-xs">
                                    {new Date(record.timestamp).toLocaleTimeString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
