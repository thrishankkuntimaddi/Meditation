import React, { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useStore';
import { store } from '../../lib/store';
import { notify, type NotifyPermission } from '../../lib/reminders/notify';
import { sampleMessage } from '../../lib/reminders/messages';
import { platform } from '../../native';
import type { ReminderKind, ReminderPlan, ReminderTone } from '../../types';
import { Button, Icon, Row, RowGroup, SectionLabel, Segmented, Toggle, type IconName } from '../ui';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TONES: { value: ReminderTone; label: string; hint: string }[] = [
  { value: 'gentle', label: 'Gentle', hint: 'Soft invitations, never pushy.' },
  { value: 'encouraging', label: 'Encouraging', hint: 'Warm motivation to keep you going.' },
  { value: 'disciplined', label: 'Disciplined', hint: 'Short and direct — for building a habit.' },
];

const KIND_META: Record<ReminderKind, { title: string; icon: IconName; hint: string }> = {
  meditation: { title: 'Meditation reminder', icon: 'meditate', hint: 'A daily invitation to sit.' },
  breathing: { title: 'Breathing break', icon: 'wave', hint: 'A short reset during the day.' },
};

const PlanEditor: React.FC<{ kind: ReminderKind; plan: ReminderPlan; onChange: (p: ReminderPlan) => void }> = ({
  kind, plan, onChange,
}) => {
  const meta = KIND_META[kind];
  const toggleDay = (d: number) =>
    onChange({ ...plan, days: plan.days.includes(d) ? plan.days.filter(x => x !== d) : [...plan.days, d].sort() });

  return (
    <div>
      <Row icon={meta.icon} title={meta.title} subtitle={meta.hint}
        right={<Toggle label={meta.title} checked={plan.enabled} onChange={enabled => onChange({ ...plan, enabled })} />} />
      {plan.enabled && (
        <div className="px-4 pb-4 -mt-1 flex flex-col gap-3 animate-fade-in">
          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted">Time</span>
            <input
              type="time"
              value={plan.time}
              onChange={e => e.target.value && onChange({ ...plan, time: e.target.value })}
              className="h-9 px-3 rounded-xl bg-bg border border-line/15 text-sm text-ink2 outline-none tabular-nums"
              aria-label={`${meta.title} time`}
            />
          </label>
          <div className="flex justify-between gap-1" role="group" aria-label={`${meta.title} days`}>
            {DAY_LETTERS.map((l, d) => {
              const on = plan.days.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  aria-pressed={on}
                  aria-label={DAY_NAMES[d]}
                  className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                    on ? 'bg-ink2 text-bg' : 'bg-bg text-faint border border-line/15'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/** Minimal, personal practice reminders. */
const RemindersSection: React.FC = () => {
  const { reminders } = useSettings();
  const [perm, setPerm] = useState<NotifyPermission | null>(null);
  const [tested, setTested] = useState(false);

  useEffect(() => { notify.permission().then(setPerm); }, []);

  const update = async (patch: Partial<typeof reminders>) => {
    const next = { ...reminders, ...patch };
    // Ask for permission the first time a reminder is switched on
    if ((next.meditation.enabled || next.breathing.enabled) && perm === 'prompt') {
      setPerm(await notify.request());
    }
    store.updateSettings({ reminders: next });
  };

  const anyOn = reminders.meditation.enabled || reminders.breathing.enabled;
  const sample = sampleMessage(reminders.meditation.enabled || !reminders.breathing.enabled ? 'meditation' : 'breathing', reminders.tone);
  const tone = TONES.find(t => t.value === reminders.tone)!;

  return (
    <section>
      <SectionLabel>Reminders</SectionLabel>
      <RowGroup>
        <PlanEditor kind="meditation" plan={reminders.meditation} onChange={meditation => update({ meditation })} />
        <PlanEditor kind="breathing" plan={reminders.breathing} onChange={breathing => update({ breathing })} />
      </RowGroup>

      {anyOn && (
        <div className="mt-3 flex flex-col gap-3 animate-fade-in">
          <div>
            <Segmented
              size="sm"
              value={reminders.tone}
              onChange={t => update({ tone: t })}
              options={TONES.map(t => ({ value: t.value, label: t.label }))}
            />
            <p className="mt-2 px-1 text-xs text-faint">{tone.hint}</p>
          </div>

          {/* Preview of what a reminder looks like */}
          <div className="rounded-2xl border border-line/15 bg-bg px-4 py-3 flex gap-3">
            <span className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted flex-shrink-0">
              <Icon name="meditate" size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-ink2">{sample.title}</span>
              <span className="block text-xs text-muted mt-0.5 leading-relaxed">{sample.body}</span>
            </span>
          </div>

          <RowGroup>
            <Row icon={reminders.sound ? 'volume' : 'volumeOff'} title="Play a sound"
              subtitle="Off keeps reminders silent — no sound, no vibration, no pop-up."
              right={<Toggle label="Reminder sound" checked={reminders.sound} onChange={sound => update({ sound })} />} />
            <Row icon="check" title="Skip if I’ve already practised"
              subtitle="No reminder on days you’ve already sat or breathed."
              right={<Toggle label="Skip if practised" checked={reminders.skipIfPracticed} onChange={skipIfPracticed => update({ skipIfPracticed })} />} />
          </RowGroup>

          {perm === 'denied' && (
            <p className="px-1 text-xs text-danger leading-relaxed">
              Notifications are blocked for Meditation. Turn them on in your device’s settings to receive reminders.
            </p>
          )}
          {platform === 'web' && (
            <p className="px-1 text-xs text-faint leading-relaxed">
              In a browser, reminders only arrive while the app is open. Install the Android or desktop app for reminders at any time.
            </p>
          )}
          <Button size="sm" variant="ghost" icon="bell" onClick={() => {
            notify.test(reminders.meditation.enabled ? 'meditation' : 'breathing');
            setTested(true);
          }}>
            {tested ? 'Sent — check your notifications' : 'Send a test reminder'}
          </Button>
          <p className="px-1 text-xs text-faint leading-relaxed">
            Reminders never arrive while you’re meditating on any of your devices.
          </p>
        </div>
      )}
    </section>
  );
};

export default RemindersSection;
