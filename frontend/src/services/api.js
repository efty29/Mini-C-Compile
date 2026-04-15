import axios from 'axios';

// Make sure this URL is correct
const API_BASE_URL = 'http://localhost:3000/api';

export const compileCode = async (code) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/compile`, { code });
        return response.data;
    } catch (error) {
        console.error('API Error Details:', error);
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        throw error;
    }
};

export const getCompilerInfo = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/info`);
        return response.data;
    } catch (error) {
        console.error('Error fetching info:', error);
        throw error;
    }
};