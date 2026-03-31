import axiosInstance from '../axios';

export const login = async (email, password) => {
    const response = await axiosInstance.post('https://api.cleany.qa/api/v1/app/auth/login', { email, password });
    return response.data;
};
