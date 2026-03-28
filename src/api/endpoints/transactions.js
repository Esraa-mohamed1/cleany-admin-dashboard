import axiosInstance from '../axios';

export const getTransactions = async () => {
    const response = await axiosInstance.get('/transactions');
    return {
        list: response.data.data,
        meta: response.data.meta,
    };
};

export const createTransaction = async (payload) => {
    const response = await axiosInstance.post('/transactions', payload);
    return response.data;
};

export const updateTransaction = async (id, payload) => {
    const response = await axiosInstance.put(`/transactions/${id}`, payload);
    return response.data;
};

export const deleteTransaction = async (id) => {
    const response = await axiosInstance.delete(`/transactions/${id}`);
    return response.data;
};
