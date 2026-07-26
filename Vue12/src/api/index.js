import http from './http'

export const login = (data) => http.post('/auth/login', data)
export const getMe = () => http.get('/auth/me')
export const logout = () => http.post('/auth/logout')

export const getUsers = (params) => http.get('/users', { params })
export const createUser = (data) => http.post('/users', data)
export const updateUser = (id, data) => http.put(`/users/${id}`, data)
export const deleteUser = (id) => http.delete(`/users/${id}`)

export const getSales = (params) => http.get('/sales', { params })
export const createSale = (data) => http.post('/sales', data)
export const updateSale = (id, data) => http.put(`/sales/${id}`, data)
export const deleteSale = (id) => http.delete(`/sales/${id}`)
export const getOverview = () => http.get('/sales/stats/overview')
export const getByProvince = (params) => http.get('/sales/stats/by-province', { params })
export const getByBrand = (params) => http.get('/sales/stats/by-brand', { params })
export const getTrend = (params) => http.get('/sales/stats/trend', { params })
export const getByType = (params) => http.get('/sales/stats/by-type', { params })
export const getProvinceDetail = (params) => http.get('/sales/stats/province-brand', { params })
export const getProvinceMeta = (name) => http.get(`/sales/meta/province/${encodeURIComponent(name)}`)
export const getFilters = () => http.get('/sales/filters')
export const importSales = (rows) => http.post('/sales/import', { rows })
export const exportSales = (params) =>
  http.get('/sales/export', { params, responseType: 'blob' })

export const startTrain = (data) => http.post('/ml/train/start', data)
export const updateTrainParams = (id, data) => http.post(`/ml/train/${id}/params`, data)
export const stopTrain = (id) => http.post(`/ml/train/${id}/stop`)
export const getExperiments = () => http.get('/ml/experiments')
export const predict = (data) => http.post('/ml/predict', data)
export const predictUpload = (formData) =>
  http.post('/ml/predict/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const getPredictions = () => http.get('/ml/predictions')

export const getTheme = () => http.get('/settings/theme')
export const saveTheme = (data) => http.put('/settings/theme', data)
export const getDbConfig = () => http.get('/settings/db-config')
export const createDbConfig = (data) => http.post('/settings/db-config', data)
export const updateDbConfig = (id, data) => http.put(`/settings/db-config/${id}`, data)
export const deleteDbConfig = (id) => http.delete(`/settings/db-config/${id}`)
export const testDbConfig = (data) => http.post('/settings/db-config/test', data)
