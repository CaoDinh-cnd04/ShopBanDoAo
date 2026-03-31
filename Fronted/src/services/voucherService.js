import axios from 'axios';

import { getApiBaseUrl } from '../config/apiBase';

const API_URL = getApiBaseUrl();

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const voucherService = {
    // Get all available vouchers
    getAvailableVouchers: () =>
        axios.get(`${API_URL}/vouchers`, getAuthHeaders()),

    // Get my vouchers
    getMyVouchers: () =>
        axios.get(`${API_URL}/vouchers/my-vouchers`, getAuthHeaders()),

    // Collect voucher
    collectVoucher: (voucherCode) =>
        axios.post(`${API_URL}/vouchers/collect`, { voucherCode }, getAuthHeaders()),

    // Validate voucher
    validateVoucher: (voucherCode, orderAmount) =>
        axios.post(`${API_URL}/vouchers/validate`, { voucherCode, orderAmount }, getAuthHeaders()),

    // Apply voucher (in checkout)
    applyVoucher: (voucherCode) =>
        axios.post(`${API_URL}/vouchers/apply`, { voucherCode }, getAuthHeaders())
};

export default voucherService;
