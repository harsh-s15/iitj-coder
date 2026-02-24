import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export const login = async (username, password) => {
    const response = await api.post('/login', { username, password });
    return response.data;
};

export const logout = async () => {
    await api.post('/logout');
};

export const generateCredentials = async (email) => {
    const response = await api.post('/admin/generate-credentials', { email });
    return response.data;
};

export const fetchQuestions = async () => {
    const response = await api.get('/api/questions');
    return response.data;
};

export const createQuestion = async (questionData) => {
    const response = await api.post('/admin/questions', questionData);
    return response.data;
};

export const addTestCase = async (questionId, testCaseData) => {
    const response = await api.post(`/admin/questions/${questionId}/test-cases`, testCaseData);
    return response.data;
};

export const fetchSubmissions = async () => {
    const response = await api.get('/admin/submissions');
    return response.data;
};

export const fetchSessions = async () => {
    const response = await api.get('/admin/sessions');
    return response.data;
};

export default api;
