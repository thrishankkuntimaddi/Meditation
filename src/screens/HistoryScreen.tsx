import React, { useEffect, useState } from 'react';
import type { Session } from '../types';
import { loadLocalSessions, getStreak } from '../utils/localStorage';
import { fetchSessions } from '../firebase/sessions';
import { useAuth } from '../context/AuthContext';
import { formatTime, formatDate } from '../utils/formatTime';

const HistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>(() => loadLocalSessions());
  const streak = getStreak();

  useEffect(() => {
    if (!user) return;
    fetchSessions(user.uid).then(remote => {
      if (remote.length > 0) setSessions(remote);
    });
  }, [user]);

  // Group sessions by day for chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toDateString();
    const daySessions = sessions.filter(s => new Date(s.timestamp).toDateString() === key);
    const minutes = Math.round(daySessions.reduce((sum, s) => sum + s.duration, 0) / 60);
    return {
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      minutes,
      count: daySessions.length,
    };
  }).reverse();

  const maxMin = Math.max(...last7.map(d => d.minutes), 1);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-xs text-stone-400 tracking-widest uppercase mb-1" style={{ letterSpacing: '0.2em' }}>History</p>
        <h2 className="text-2xl font-light text-stone-700">Your journey</h2>
      </div>

      {/* Streak banner */}
      {streak > 0 && (
        <div
          className="mx-6 mb-6 px-5 py-4 rounded-2xl flex items-center gap-3"
          style={{ background: '#F5F5F4', border: '1px solid rgba(120,113,108,0.1)' }}
        >
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-medium text-stone-700">{streak}-day streak</p>
            <p className="text-xs text-stone-400">Keep the momentum going</p>
          </div>
        </div>
      )}

      {/* 7-day bar chart */}
      <div className="mx-6 mb-6 p-4 rounded-2xl" style={{ background: '#F5F5F4', border: '1px solid rgba(120,113,108,0.1)' }}>
        <p className="text-xs text-stone-400 uppercase tracking-widest mb-4" style={{ letterSpacing: '0.15em' }}>
          Last 7 days
        </p>
        <div className="flex items-end gap-2 h-20">
          {last7.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${Math.max(4, (day.minutes / maxMin) * 64)}px`,
                  background: day.minutes > 0
                    ? 'linear-gradient(to top, #44403C, #78716C)'
                    : 'rgba(120,113,108,0.12)',
                  minHeight: 4,
                }}
              />
              <span className="text-xs text-stone-400">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div className="px-6 flex flex-col gap-2">
        <p className="text-xs text-stone-400 uppercase tracking-widest mb-1" style={{ letterSpacing: '0.15em' }}>Sessions</p>
        {sessions.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-2">
            <span className="text-3xl opacity-30">◎</span>
            <p className="text-sm text-stone-400">No sessions yet. Begin meditating.</p>
          </div>
        )}
        {sessions.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
            style={{ background: '#F5F5F4', border: '1px solid rgba(120,113,108,0.08)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: s.completed ? '#44403C' : 'rgba(120,113,108,0.15)' }}
            >
              <span className="text-xs" style={{ color: s.completed ? '#FAFAF9' : '#A8A29E' }}>
                {s.completed ? '✓' : '◐'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-600">{s.presetName}</p>
              <p className="text-xs text-stone-400">{formatDate(s.timestamp)}</p>
            </div>
            <span className="text-sm text-stone-500 font-mono">{formatTime(s.duration)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryScreen;
