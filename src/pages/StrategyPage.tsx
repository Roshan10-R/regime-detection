import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { strategyApi } from '../api/client';

const INDICATORS = ['SMA20', 'SMA50', 'RSI14', 'BB_UPPER', 'BB_MIDDLE', 'BB_LOWER', 'PRICE'];
const CONDITIONS = ['crossover', 'crossunder', 'above', 'below', 'equals'];
const INDICATOR_VALUES = ['SMA20', 'SMA50', 'BB_UPPER', 'BB_MIDDLE', 'BB_LOWER'];

const emptyRule = () => ({ indicator: 'SMA20', condition: 'crossover', value: 'SMA50' as string | number });
const defaultForm = () => ({
  name: '', description: '', hypothesis: '', minTrades: 20, status: 'draft' as const,
  entryRules: [emptyRule()], exitRules: [emptyRule()],
  riskConfig: { stopLossPercent: 2, takeProfitPercent: 6, maxPositionSize: 10, maxDrawdownLimit: 20 }
});

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [form, setForm] = useState(defaultForm());
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = () => strategyApi.getAll().then(setStrategies);
  useEffect(() => { load(); }, []);

  const selectStrategy = (s: any) => {
    setSelected(s);
    setForm({
      name: s.name, description: s.description, hypothesis: s.hypothesis,
      minTrades: s.minTrades, status: s.status,
      entryRules: s.entryRules, exitRules: s.exitRules, riskConfig: s.riskConfig
    });
    setMsg(null);
  };

  const newStrategy = () => { setSelected(null); setForm(defaultForm()); setMsg(null); };

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      if (selected) {
        await strategyApi.update(selected.id, { ...form, status: 'active' });
      } else {
        await strategyApi.create({ ...form, status: 'draft' });
      }
      setMsg({ type: 'success', text: selected ? 'Strategy updated.' : 'Strategy created.' });
      await load();
    } catch (e: any) {
      const errors = e.response?.data?.errors;
      setMsg({ type: 'error', text: errors ? errors.join(', ') : 'Failed to save strategy.' });
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    await strategyApi.delete(id);
    setSelected(null); setForm(defaultForm());
    load();
  };

  const updateRule = (list: 'entryRules' | 'exitRules', idx: number, field: string, val: any) => {
    setForm(f => ({
      ...f,
      [list]: f[list].map((r: any, i: number) => i === idx ? { ...r, [field]: val } : r)
    }));
  };

  const addRule = (list: 'entryRules' | 'exitRules') => {
    setForm(f => ({ ...f, [list]: [...f[list], emptyRule()] }));
  };

  const removeRule = (list: 'entryRules' | 'exitRules', idx: number) => {
    setForm(f => ({ ...f, [list]: f[list].filter((_: any, i: number) => i !== idx) }));
  };

  const edgeBadge = (s: string) => {
    const map: Record<string, string> = { draft: 'tag-gray', active: 'tag-green', archived: 'tag-yellow' };
    return <span className={`tag ${map[s] || 'tag-gray'}`}>{s}</span>;
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar list */}
      <div style={{ width: 260, borderRight: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Strategies</div>
          <button className="btn btn-primary btn-sm" onClick={newStrategy}><Plus size={12} /> New</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {strategies.map(s => (
            <div key={s.id} onClick={() => selectStrategy(s)}
              style={{
                padding: '10px 12px', borderRadius: 5, cursor: 'pointer', marginBottom: 4,
                background: selected?.id === s.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                border: selected?.id === s.id ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
              }}>
              <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 4 }}>{s.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {edgeBadge(s.status)}
                <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>cx:{s.complexityScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{selected ? `Edit: ${selected.name}` : 'New Strategy'}</div>
              {selected && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>Complexity Score: {selected.complexityScore}/100</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {selected && <button className="btn btn-danger btn-sm" onClick={() => del(selected.id)}><Trash2 size={12} /> Delete</button>}
              <button className="btn btn-primary" disabled={saving} onClick={save}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Strategy'}
              </button>
            </div>
          </div>

          {msg && (
            <div className={`alert-box ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
              {msg.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
              {msg.text}
            </div>
          )}

          {/* Basic info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Basic Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label>Strategy Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. SMA Crossover Trend" />
              </div>
              <div>
                <label>Min Trades Required</label>
                <input className="input" type="number" value={form.minTrades} onChange={e => setForm(f => ({ ...f, minTrades: +e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the strategy logic..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label>Hypothesis</label>
              <textarea className="input" rows={2} value={form.hypothesis} onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))} placeholder="What market inefficiency does this exploit?" style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* Rules */}
          {(['entryRules', 'exitRules'] as const).map(list => (
            <div className="card" key={list} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>{list === 'entryRules' ? 'Entry Rules' : 'Exit Rules'}</div>
                <button className="btn btn-secondary btn-sm" onClick={() => addRule(list)}><Plus size={12} /> Add Rule</button>
              </div>
              {form[list].map((rule: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <select className="input" style={{ flex: 1 }} value={rule.indicator} onChange={e => updateRule(list, idx, 'indicator', e.target.value)}>
                    {INDICATORS.map(i => <option key={i}>{i}</option>)}
                  </select>
                  <select className="input" style={{ flex: 1 }} value={rule.condition} onChange={e => updateRule(list, idx, 'condition', e.target.value)}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input className="input" style={{ flex: 1 }} value={rule.value} onChange={e => {
                    const v = INDICATOR_VALUES.includes(e.target.value) ? e.target.value : isNaN(+e.target.value) ? e.target.value : +e.target.value;
                    updateRule(list, idx, 'value', v);
                  }} placeholder="Value or indicator" />
                  {form[list].length > 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => removeRule(list, idx)}><Trash2 size={12} /></button>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Risk Config */}
          <div className="card">
            <div className="section-title">Risk Management</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { key: 'stopLossPercent', label: 'Stop Loss %' },
                { key: 'takeProfitPercent', label: 'Take Profit %' },
                { key: 'maxPositionSize', label: 'Max Position Size %' },
                { key: 'maxDrawdownLimit', label: 'Max Drawdown Limit %' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label>{label}</label>
                  <input className="input" type="number" step="0.5" value={(form.riskConfig as any)[key]}
                    onChange={e => setForm(f => ({ ...f, riskConfig: { ...f.riskConfig, [key]: +e.target.value } }))} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
