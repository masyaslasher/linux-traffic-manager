import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Workflow,
  Zap,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StoredAlertEvent, StoredAutomationRule } from '../types';

interface AutomationPageProps {
  rules: StoredAutomationRule[];
  alerts: StoredAlertEvent[];
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  onDeleteRule: (ruleId: string) => void;
  onSaveRule: (rule: StoredAutomationRule) => void;
  onAcknowledgeAlert: (alertId: number) => void;
  onClearAlerts: () => void;
}

export const AutomationPage: React.FC<AutomationPageProps> = ({
  rules,
  alerts,
  onToggleRule,
  onDeleteRule,
  onSaveRule,
  onAcknowledgeAlert,
  onClearAlerts,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newTriggerType, setNewTriggerType] = useState('download_above');
  const [newThreshold, setNewThreshold] = useState('50');
  const [newActionType, setNewActionType] = useState('notify');
  const [newCooldown, setNewCooldown] = useState('120');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const id = `rule_${Date.now()}`;
    let conditionJson = '{}';

    if (newTriggerType === 'download_above' || newTriggerType === 'upload_above') {
      const bps = parseFloat(newThreshold) * 1024 * 1024;
      conditionJson = JSON.stringify({ threshold_bps: bps });
    } else if (newTriggerType === 'total_traffic_above') {
      const bytes = parseFloat(newThreshold) * 1024 * 1024 * 1024;
      conditionJson = JSON.stringify({ threshold_bytes: bytes });
    } else if (newTriggerType === 'high_latency') {
      conditionJson = JSON.stringify({ threshold_ms: parseFloat(newThreshold) });
    }

    const rule: StoredAutomationRule = {
      id,
      name: newRuleName,
      description: newRuleDesc || `Automatically trigger ${newActionType} on ${newTriggerType}`,
      enabled: true,
      trigger_type: newTriggerType,
      condition_json: conditionJson,
      action_type: newActionType,
      action_params_json: JSON.stringify({ severity: 'warning' }),
      cooldown_secs: parseInt(newCooldown, 10) || 120,
      last_triggered_ts: 0,
      trigger_count: 0,
    };

    onSaveRule(rule);
    setIsCreating(false);
    setNewRuleName('');
    setNewRuleDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-surface p-4 border border-border rounded-lg">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Workflow className="w-4 h-4 text-primary" />
            Automation & Rule Engine
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Configure condition-driven network alerts, monitoring profiles, and reactive safety scripts.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {isCreating ? 'Cancel' : 'New Rule'}
        </Button>
      </div>

      {/* New Rule Modal/Form */}
      {isCreating && (
        <Card title="Rule Builder" subtitle="Define WHEN / IF / THEN automation logic">
          <form onSubmit={handleCreateRule} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Heavy Steam Download Notice"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-surface-secondary border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Optional brief description"
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  className="w-full bg-surface-secondary border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-surface-secondary/50 rounded-lg border border-border">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                  1. WHEN (Trigger)
                </label>
                <select
                  value={newTriggerType}
                  onChange={(e) => setNewTriggerType(e.target.value)}
                  className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
                >
                  <option value="download_above">Download Speed &gt;</option>
                  <option value="upload_above">Upload Speed &gt;</option>
                  <option value="total_traffic_above">Daily Transferred Data &gt;</option>
                  <option value="connection_lost">Network Interface DOWN</option>
                  <option value="high_latency">Ping Latency &gt;</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                  2. IF (Threshold)
                </label>
                <input
                  type="number"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  placeholder="50"
                  className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none"
                />
                <span className="text-[10px] text-text-dim mt-0.5 block">
                  {newTriggerType.includes('speed')
                    ? 'Value in MB/s'
                    : newTriggerType.includes('traffic')
                    ? 'Value in GB'
                    : newTriggerType.includes('latency')
                    ? 'Value in ms'
                    : 'N/A'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                  3. THEN (Action)
                </label>
                <select
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value)}
                  className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
                >
                  <option value="notify">Push Notification</option>
                  <option value="log">Log to Alert History</option>
                  <option value="run_diagnostic">Execute Diagnostic Probe</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Cooldown (Seconds)
                </label>
                <input
                  type="number"
                  value={newCooldown}
                  onChange={(e) => setNewCooldown(e.target.value)}
                  placeholder="120"
                  className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none"
                />
                <span className="text-[10px] text-text-dim mt-0.5 block">
                  Prevents alert flooding
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Enable Rule
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-surface border rounded-lg p-4 transition-colors flex flex-col justify-between ${
              rule.enabled ? 'border-border' : 'border-border/40 opacity-70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1.5 rounded-md ${
                      rule.enabled
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-secondary text-text-dim'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-semibold text-text-primary">{rule.name}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => onToggleRule(rule.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white" />
                </label>
              </div>

              <p className="text-xs text-text-muted mt-2">{rule.description}</p>

              {/* Rule logic tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border">
                  WHEN: {rule.trigger_type}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-secondary text-primary border border-border">
                  THEN: {rule.action_type}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-secondary text-text-dim border border-border">
                  Cooldown: {rule.cooldown_secs}s
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-[11px] text-text-dim">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Fired: {rule.trigger_count} times
              </span>
              <button
                onClick={() => onDeleteRule(rule.id)}
                className="text-text-dim hover:text-error transition-colors p-1"
                title="Delete rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Event History Table */}
      <Card
        title="Event & Alert Log"
        subtitle="Recent system and automation rule triggers"
        action={
          alerts.length > 0 && (
            <Button variant="secondary" size="sm" onClick={onClearAlerts}>
              Clear All Logs
            </Button>
          )
        }
      >
        <div className="overflow-x-auto mt-2">
          {alerts.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Event / Rule</th>
                  <th className="pb-2 font-medium">Details</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {alerts.map((alert) => (
                  <tr
                    key={alert.id || alert.timestamp}
                    className={`hover:bg-surface-secondary/50 ${
                      alert.acknowledged ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-2.5 text-text-dim">
                      {new Date(alert.timestamp * 1000).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-sans font-semibold ${
                          alert.severity === 'critical'
                            ? 'bg-error/15 text-error'
                            : alert.severity === 'warning'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-2.5 font-sans font-semibold text-text-primary">
                      {alert.title}
                    </td>
                    <td className="py-2.5 text-text-secondary truncate max-w-xs font-sans">
                      {alert.message}
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      {!alert.acknowledged ? (
                        <button
                          onClick={() => alert.id && onAcknowledgeAlert(alert.id)}
                          className="px-2 py-1 rounded bg-surface-secondary hover:bg-surface text-text-primary border border-border text-[11px]"
                        >
                          Ack
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-dim flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-xs text-text-muted">
              No alert events triggered yet. Network conditions are peaceful.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
