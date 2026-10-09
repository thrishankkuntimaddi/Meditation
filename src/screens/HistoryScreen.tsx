import React, { useMemo, useState } from 'react';
import { useSessions } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { computeStreak, groupByDay, lastNDays, totalMinutes } from '../utils/stats';
import { formatClock, formatDuration } from '../utils/formatTime';
import { Card, Icon, ScreenHeader, SectionLabel } from '../components/ui';

const PAGE = 30;

const HistoryScreen: React.FC<{ onGoProfile: () => void }> = ({ onGoProfile }) => {
  const sessions = useSessions();
  const { user } = useAuth();
  const [now] = useState(() => Date.now());
  const [shown, setShown] = useState(PAGE);

  const week = useMemo(() => lastNDays(sessions, 7, now), [sessions, now]);
  const weekMinutes = week.reduce((s, d) => s + d.minutes, 0);
  const maxMin = Math.max(...week.map(d => d.minutes), 1);
  const streak = computeStreak(sessions, now);
  const groups = useMemo(() => groupByDay(sessions.slice(0, shown), now), [sessions, shown, now]);

  return (
    <div className="flex flex-col min-h-full nav-space">
      <ScreenHeader eyebrow="Journey" title="Your practice" />

      {!user && (
        <button
          onClick={onGoProfile}
          className="mx-6 mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-line/25 px-4 py-3 text-left text-muted hover:text-ink2"
        >
          <Icon name="cloud" size={18} />
          <span className="flex-1 text-[13px]">Sign in to back up your journey and sync across devices</span>
          <Icon name="chevronRight" size={16} />
        </button>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 px-6 mb-5">
        {[
          { label: 'This week', value: `${weekMinutes}`, unit: 'min' },
          { label: 'Day streak', value: `${streak}`, unit: streak === 1 ? 'day' : 'days' },
          { label: 'All time', value: `${totalMinutes(sessions)}`, unit: 'min' },
        ].map(s => (
          <Card key={s.label} className="px-3 py-3.5">
            <p className="text-[11px] text-faint">{s.label}</p>
            <p className="mt-1 text-xl font-light text-ink2 tabular-nums">
              {s.value}<span className="ml-1 text-xs text-faint">{s.unit}</span>
            </p>
          </Card>
        ))}
      </div>

      {/* 7-day chart */}
      <Card className="mx-6 mb-7 p-4">
        <SectionLabel right={`${week.reduce((s, d) => s + d.count, 0)} sessions`}>Last 7 days</SectionLabel>
        <div className="flex items-end gap-2 h-28" role="img" aria-label={`Minutes meditated over the last 7 days: ${week.map(d => d.minutes).join(', ')}`}>
          {week.map(day => (
            <div key={day.key} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
              {day.minutes > 0 && <span className="text-[10px] text-faint tabular-nums">{day.minutes}</span>}
              <div
                className={`w-full max-w-[28px] rounded-md transition-all duration-500 ${day.minutes > 0 ? 'bg-ink2/70' : 'bg-line/10'}`}
                style={{ height: `${Math.max(4, (day.minutes / maxMin) * 72)}px` }}
              />
              <span className={`text-[11px] ${day.isToday ? 'text-ink2 font-semibold' : 'text-faint'}`}>{day.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Session list */}
      <div className="px-6">
        {sessions.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center">
            <span className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-faint">
              <Icon name="meditate" size={26} />
            </span>
            <p className="text-sm text-muted">No sessions yet.</p>
            <p className="text-xs text-faint">Your completed meditations will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(g => (
              <section key={g.label}>
                <SectionLabel>{g.label}</SectionLabel>
                <div className="flex flex-col gap-2">
                  {g.items.map(s => (
                    <Card key={s.id} className="flex items-center gap-3.5 px-3 py-3">
                      <span className="w-10 h-10 rounded-xl bg-bg border border-line/10 flex items-center justify-center text-muted flex-shrink-0">
                        <Icon name={s.kind === 'breathing' ? 'wave' : 'meditate'} size={20} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink2 truncate">{s.presetName}</p>
                        <p className="text-xs text-faint mt-0.5 truncate">
                          {formatClock(s.timestamp)}{s.deviceName ? ` · ${s.deviceName}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm text-ink2 tabular-nums">{formatDuration(s.duration)}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] ${s.completed ? 'text-ok' : 'text-faint'}`}>
                          {s.completed ? <><Icon name="check" size={12} strokeWidth={2} /> Complete</> : 'Partial'}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
            {shown < sessions.length && (
              <button onClick={() => setShown(n => n + PAGE)} className="self-center h-10 px-5 rounded-xl text-sm text-muted hover:text-ink2">
                Show more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
