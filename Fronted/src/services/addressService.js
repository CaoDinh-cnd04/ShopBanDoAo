import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const addressService = {
    // Get all addresses
    getAddresses: () => axios.get(`${API_URL}/addresses`, getAuthHeaders()),

    // Create new address
    createAddress: (data) => axios.post(`${API_URL}/addresses`, data, getAuthHeaders()),

    // Update address
    updateAddress: (id, data) => axios.put(`${API_URL}/addresses/${id}`, data, getAuthHeaders()),

    // Delete address
    deleteAddress: (id) => axios.delete(`${API_URL}/addresses/${id}`, getAuthHeaders()),

    // Set default address (helper method)
    setDefaultAddress: (id) => {
        return axios.put(`${API_URL}/addresses/${id}`, { isDefault: true }, getAuthHeaders());
    }
};

export default addressService;
