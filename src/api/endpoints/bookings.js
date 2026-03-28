import axiosInstance from '../axios';

export const getBookings = async (params = {}) => {
    const response = await axiosInstance.get('/bookings', { params });
    return {
        list: response.data.data,
        meta: response.data.meta
    };
};

export const createBooking = async (payload) => {
    const response = await axiosInstance.post('/bookings', payload);
    return response.data;
};

export const updateBooking = async (id, payload) => {
    const response = await axiosInstance.put(`/bookings/${id}`, payload);
    return response.data;
};

export const deleteBooking = async (id) => {
    const response = await axiosInstance.delete(`/bookings/${id}`);
    return response.data;
};
