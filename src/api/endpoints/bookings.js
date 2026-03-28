import axiosInstance from '../axiosInstance';

export const getBookings = async (params = {}) => {
    const response = await axiosInstance.get('/bookings', { params });
    return {
        list: response.data.data,
        meta: response.data.meta
    };
};

export const deleteBooking = async (id) => {
    const response = await axiosInstance.delete(`/bookings/${id}`);
    return response.data;
};
