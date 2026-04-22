/**
 * pages/BrokerPage.tsx
 * Drop into: frontend/src/pages/BrokerPage.tsx
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, Send, XCircle, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';

export default function BrokerPage() {
  const [status, setStatus]       = useState<any>(null);
  const [account, setAccount]     = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders]       = useState<any[]>([]);
  const [localOrders, setLocal]   = useState<any[]>([]);
  const [patterns, setPatterns]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [orderForm, setOrderForm] = useState({
    symbol: 'AAPL', side: 'buy', qty: 1,
    orderType: 'market', strategyId: '', source: 'manual',
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]               = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [st, acc, pos, ord, loc, pat] = await Promise.all([
        axios.get('/api/broker/status'),
        axios.get('/api/broker/account').catch(() => ({ data: null })),
        axios.get('/api/broker/positions').catch(() => ({ data: [] })),
        axios.get('/api/broker/orders?status=all&limit=20').catch(() => ({ data: [] })),
        axios.get('/api/broker/orders/local').catch(() => ({ data: [] })),
        axios.get('/api/pattern?edgeState=validated').catch(() => ({ data: [] })),
      ]);
      setStatus(st.data);
      setAccount(acc.data);
      setPositions(pos.data);
      setOrders(ord.data);
      setLocal(loc.data);
      setPatterns(pat.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const submitOrder = async () => {
    setSubmitting(true); setMsg(null);
    try {
      await axios.post('/api/broker/orders', orderForm);
      setMsg({ type: 'success', text: `Order submitted: ${orderForm.side.toUpperCase()} ${orderForm.qty} ${orderForm.symbol}` });
      loadAll();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Order failed' });
    } finally { setSubmitting(false); }
  };

  const tradePattern = async (patternId: string) => {
    try {
      await axios.post('/api/broker/orders/from-pattern', { patternId, side: 'buy' });
      setMsg({ type: 'success', text: 'Pattern signal order submitted' });
      loadAll();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' });
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      await axios.delete(`/api/broker/orders/${id}`);
      loadAll();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Cancel failed' });
    }
  };

  const isConnected = status?.ok;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>Broker — Alpaca Paper Trading</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>All orders execute on paper trading account. No real money involved.</div>
        </div>
        <button className="btn btn-secondary" onClick={loadAll} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Connection status */}
      <div className={`alert-box ${isConnected ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
        {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
        <div>
          <div style={{ fontWeight: 500 }}>{isConnected ? 'Connected to Alpaca Paper Trading' : 'Not connected to Alpaca'}</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{status?.message}</div>
        </div>
      </div>

      {msg && (
        <div className={`alert-box ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Account summary */}
        {account && (
          <div className="card">
            <div className="section-title">Paper Account</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Portfolio Value', value: `$${parseFloat(account.portfolio_value || 0).toLocaleString()}` },
                { label: 'Equity',          value: `$${parseFloat(account.equity || 0).toLocaleString()}` },
                { label: 'Cash',            value: `$${parseFloat(account.cash || 0).toLocaleString()}` },
                { label: 'Buying Power',    value: `$${parseFloat(account.buying_power || 0).toLocaleString()}` },
              ].map(item => (
                <div key={item.label} style={{ padding: '8px 10px', background: 'var(--bg3)', borderRadius: 5, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual order form */}
        <div className="card">
          <div className="section-title">Submit Order</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label>Symbol</label>
              <input className="input" value={orderForm.symbol}
                onChange={e => setOrderForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label>Side</label>
              <select className="input" value={orderForm.side}
                onChange={e => setOrderForm(f => ({ ...f, side: e.target.value }))}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div>
              <label>Quantity</label>
              <input className="input" type="number" min={1} value={orderForm.qty}
                onChange={e => setOrderForm(f => ({ ...f, qty: +e.target.value }))} />
            </div>
            <div>
              <label>Order Type</label>
              <select className="input" value={orderForm.orderType}
                onChange={e => setOrderForm(f => ({ ...f, orderType: e.target.value }))}>
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={submitOrder} disabled={submitting || !isConnected}>
            {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
            {submitting ? 'Submitting...' : 'Submit Order'}
          </button>
        </div>
      </div>

      {/* Open Positions */}
      {positions.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Open Positions ({positions.length})</div>
          <table>
            <thead>
              <tr><th>Symbol</th><th>Qty</th><th>Avg Entry</th><th>Current</th><th>Market Value</th><th>Unrealised P&L</th></tr>
            </thead>
            <tbody>
              {positions.map((p: any) => {
                const upl = parseFloat(p.unrealized_pl || 0);
                return (
                  <tr key={p.symbol}>
                    <td style={{ fontWeight: 600 }} className="mono">{p.symbol}</td>
                    <td className="mono">{p.qty}</td>
                    <td className="mono">${parseFloat(p.avg_entry_price).toFixed(2)}</td>
                    <td className="mono">${parseFloat(p.current_price).toFixed(2)}</td>
                    <td className="mono">${parseFloat(p.market_value).toLocaleString()}</td>
                    <td className={upl >= 0 ? 'positive' : 'negative'}>
                      <span className="mono">${upl.toFixed(2)} ({parseFloat(p.unrealized_plpc || 0).toFixed(2)}%)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Validated patterns - trade from signal */}
      {patterns.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Validated Patterns — Trade from Signal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {patterns.slice(0, 5).map((p: any) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 5, border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    Win rate: {p.winRate}% · Sharpe: {p.rollingSharpe} · Regime: {p.regime?.split('_').join(' ')}
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => tradePattern(p.id)} disabled={!isConnected}>
                  <Send size={12} /> Trade
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="card">
        <div className="section-title">Recent Orders (Local DB)</div>
        {localOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>No orders submitted yet.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Symbol</th><th>Side</th><th>Qty</th><th>Type</th><th>Status</th><th>Filled At</th><th>Source</th><th>Action</th></tr>
            </thead>
            <tbody>
              {localOrders.map((o: any) => (
                <tr key={o.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{o.symbol}</td>
                  <td><span className={`tag ${o.side === 'buy' ? 'tag-green' : 'tag-red'}`}>{o.side}</span></td>
                  <td className="mono">{o.qty}</td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{o.order_type}</td>
                  <td><span className={`tag ${o.status === 'filled' ? 'tag-green' : o.status === 'failed' ? 'tag-red' : 'tag-blue'}`}>{o.status}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{o.filled_price ? `$${parseFloat(o.filled_price).toFixed(2)}` : '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--text3)' }}>{o.source}</td>
                  <td>
                    {o.status === 'accepted' || o.status === 'pending' ? (
                      <button className="btn btn-danger btn-sm" onClick={() => cancelOrder(o.broker_order_id)}>
                        <XCircle size={11} /> Cancel
                      </button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
