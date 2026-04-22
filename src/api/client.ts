import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const strategyApi = {
  getAll:   ()             => api.get('/strategy').then(r => r.data),
  get:      (id: string)  => api.get(`/strategy/${id}`).then(r => r.data),
  create:   (data: any)   => api.post('/strategy', data).then(r => r.data),
  update:   (id: string, data: any) => api.put(`/strategy/${id}`, data).then(r => r.data),
  delete:   (id: string)  => api.delete(`/strategy/${id}`).then(r => r.data),
};

export const backtestApi = {
  getAll:        ()             => api.get('/backtest').then(r => r.data),
  get:           (id: string)  => api.get(`/backtest/${id}`).then(r => r.data),
  getByStrategy: (sid: string) => api.get(`/backtest/strategy/${sid}`).then(r => r.data),
  run:           (config: any) => api.post('/backtest/run', config).then(r => r.data),
  getSymbols:    ()            => api.get('/backtest/meta/symbols').then(r => r.data),
  getCache:      ()            => api.get('/backtest/meta/cache').then(r => r.data),
  clearCache:    (symbol?: string) => api.delete('/backtest/meta/cache', { params: { symbol } }).then(r => r.data),
};

export const regimeApi = {
  detect: (params: { symbol?: string; startDate?: string; endDate?: string; synthetic?: string }) =>
    api.get('/regime/detect', { params }).then(r => r.data),
};

export const patternApi = {
  getAll:     (filters?: { regime?: string; edgeState?: string; asset?: string }) =>
    api.get('/pattern', { params: filters }).then(r => r.data),
  get:        (id: string) => api.get(`/pattern/${id}`).then(r => r.data),
  getSimilar: (id: string) => api.get(`/pattern/${id}/similar`).then(r => r.data),
};

export const monitoringApi = {
  getAlerts:   (acknowledged?: boolean) =>
    api.get('/monitoring/alerts', { params: acknowledged !== undefined ? { acknowledged } : {} }).then(r => r.data),
  getCount:    () => api.get('/monitoring/alerts/count').then(r => r.data),
  generate:    () => api.post('/monitoring/generate').then(r => r.data),
  acknowledge: (id: string) => api.patch(`/monitoring/alerts/${id}/acknowledge`).then(r => r.data),
};

export const walkforwardApi = {
  run:          (config: any)       => api.post('/walkforward/run', config).then(r => r.data),
  getByStrategy:(strategyId: string) => api.get(`/walkforward/strategy/${strategyId}`).then(r => r.data),
  get:          (id: string)        => api.get(`/walkforward/${id}`).then(r => r.data),
};

export const portfolioApi = {
  run:     (config: any) => api.post('/portfolio/run', config).then(r => r.data),
  getRuns: ()            => api.get('/portfolio/runs').then(r => r.data),
  getRun:  (id: string)  => api.get(`/portfolio/runs/${id}`).then(r => r.data),
};

export const brokerApi = {
  getStatus:     ()              => api.get('/broker/status').then(r => r.data),
  getAccount:    ()              => api.get('/broker/account').then(r => r.data),
  getPositions:  ()              => api.get('/broker/positions').then(r => r.data),
  getOrders:     (status = 'all', limit = 50) =>
    api.get('/broker/orders', { params: { status, limit } }).then(r => r.data),
  getLocalOrders:()              => api.get('/broker/orders/local').then(r => r.data),
  submitOrder:   (order: any)    => api.post('/broker/orders', order).then(r => r.data),
  tradePattern:  (patternId: string, side = 'buy') =>
    api.post('/broker/orders/from-pattern', { patternId, side }).then(r => r.data),
  cancelOrder:   (id: string)    => api.delete(`/broker/orders/${id}`).then(r => r.data),
  closePosition: (symbol: string) => api.delete(`/broker/positions/${symbol}`).then(r => r.data),
};

export const hmmApi = {
  fit:       (params: any)        => api.post('/hmm/fit', params).then(r => r.data),
  getModels: ()                   => api.get('/hmm/models').then(r => r.data),
  getModel:  (symbol: string)     => api.get(`/hmm/models/${symbol}`).then(r => r.data),
};
