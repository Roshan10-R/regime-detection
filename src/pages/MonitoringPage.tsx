import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Zap, RefreshCw, CheckCheck } from 'lucide-react';
import { monitoringApi } from '../api/client';

const ALERT_TYPE_COLORS: Record<string, string> = {
  pattern_match: 'tag-green',
  regime_change: 'tag-yellow',
  edge_decay: 'tag-red',
  drawdown_breach: 'tag-red',
};

const ALERT_TYPE_ICONS: Record<string, React.ReactNode> = {
  pattern_match: '🎯',
  regime_change: '🔄',
  edge_decay: '📉',
  drawdown_breach: '⚠️',
};

export default function MonitoringPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active');

  const loadAlerts = () => {
    monitoringApi.getAlerts().then(a => { setAlerts(a); setLoading(false); });
  };

  useEffect(() => { loadAlerts(); }, []);

  const generate = async () => {
    setGenerating(true);
    const r = await monitoringApi.generate();
    setLastGenerated(r);
    loadAlerts();
    setGenerating(false);
  };

  const acknowledge = async (id: string) => {
    await monitoringApi.acknowledge(id);
    loadAlerts();
  };

  const acknowledgeAll = async () => {
    const unacked = alerts.filter(a => !a.acknowledged);
    await Promise.all(unacked.map(a => monitoringApi.acknowledge(a.id)));
    loadAlerts();
  };

  const filtered = alerts.filter(a =>
    filter === 'all' ? true : filter === 'active' ? !a.acknowledged : a.acknowledged
  );

  const counts = {
    all: alerts.length,
    active: alerts.filter(a => !a.acknowledged).length,
    acknowledged: alerts.filter(a => a.acknowledged).length,
  };

  const ConfidenceBar = ({ value }: { value: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: 'var(--bg)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${value * 100}%`, background: value > 0.75 ? 'var(--green)' : value > 0.5 ? 'var(--yellow)' : 'var(--red)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', width: 36 }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>Live Monitoring</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Pattern similarity scanning · Regime compatibility checks · Edge decay tracking</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {counts.active > 0 && (
            <button className="btn btn-secondary" onClick={acknowledgeAll}><CheckCheck size={14} /> Acknowledge All</button>
          )}
          <button className="btn btn-primary" onClick={generate} disabled={generating}>
            {generating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Zap size={14} />}
            {generating ? 'Scanning...' : 'Generate Alerts'}
          </button>
        </div>
      </div>

      {/* Last scan info */}
      {lastGenerated && (
        <div className="alert-box alert-info" style={{ marginBottom: 16 }}>
          <RefreshCw size={14} />
          Scan complete: {lastGenerated.generated} alerts generated · Current regime: <strong>{lastGenerated.currentRegime?.split('_').join(' ')}</strong>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Pattern Matches', type: 'pattern_match', color: 'var(--green)' },
          { label: 'Regime Changes', type: 'regime_change', color: 'var(--yellow)' },
          { label: 'Edge Decays', type: 'edge_decay', color: 'var(--red)' },
          { label: 'Total Alerts', type: null, color: 'var(--accent)' },
        ].map(item => {
          const count = item.type ? alerts.filter(a => a.alertType === item.type).length : alerts.length;
          return (
            <div key={item.label} className="stat-card">
              <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--mono)', color: item.color }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg2)', padding: 4, borderRadius: 6, border: '1px solid var(--border)', width: 'fit-content' }}>
        {(['all', 'active', 'acknowledged'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '5px 16px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: filter === f ? 'var(--bg3)' : 'transparent',
              color: filter === f ? 'var(--text)' : 'var(--text2)',
              border: filter === f ? '1px solid var(--border2)' : '1px solid transparent',
            }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BellOff size={32} />
          {filter === 'active' ? 'No active alerts. Click "Generate Alerts" to scan patterns.' : 'No alerts found.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(alert => (
            <div key={alert.id} className="card" style={{ opacity: alert.acknowledged ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span>{ALERT_TYPE_ICONS[alert.alertType]}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{alert.patternName}</span>
                    <span className={`tag ${ALERT_TYPE_COLORS[alert.alertType]}`}>{alert.alertType.split('_').join(' ')}</span>
                    {alert.acknowledged && <span className="tag tag-gray">acknowledged</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>{alert.message}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, maxWidth: 200 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Confidence</div>
                      <ConfidenceBar value={alert.confidence} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Regime</div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{alert.regime?.split('_').join(' ')}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Timestamp</div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button className="btn btn-secondary btn-sm" style={{ marginLeft: 16, flexShrink: 0 }} onClick={() => acknowledge(alert.id)}>
                    <CheckCheck size={12} /> Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
