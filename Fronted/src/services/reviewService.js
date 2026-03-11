import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// ==================== PRODUCT REVIEWS ====================
export const reviewService = {
    // Get reviews for a product
    getProductReviews: (productId, params) =>
        axios.get(`${API_URL}/reviews/products/${productId}`, { params }),

    // Create product review
    createProductReview: (productId, data) =>
        axios.post(`${API_URL}/reviews/products/${productId}`, data, getAuthHeaders()),

    // Update product review
    updateProductReview: (reviewId, data) =>
        axios.put(`${API_URL}/reviews/products/${reviewId}`, data, getAuthHeaders()),

    // Delete product review
    deleteProductReview: (reviewId) =>
        axios.delete(`${API_URL}/reviews/products/${reviewId}`, getAuthHeaders()),

    // Get court reviews
    getCourtReviews: (courtId, params) =>
        axios.get(`${API_URL}/reviews/courts/${courtId}`, { params }),

    // Create court review
    createCourtReview: (courtId, data) =>
        axios.post(`${API_URL}/reviews/courts/${courtId}`, data, getAuthHeaders()),

    // Get my reviews
    getMyReviews: () =>
        axios.get(`${API_URL}/reviews/my-reviews`, getAuthHeaders())
};

export default reviewService;
