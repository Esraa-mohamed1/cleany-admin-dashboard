import axiosInstance from '../axios';

export const login = async (email, password) => {
    const response = await axiosInstance.post('auth/login', { email, password });
    return response.data;
};
