import axiosInstance from '../axios';

export const getOffers = async () => {
    const response = await axiosInstance.get('/offers');
    return {
        list: response.data.data,
        meta: response.data.meta,
    };
};

export const createOffer = async (payload) => {
    const response = await axiosInstance.post('/offers', payload);
    return response.data;
};

export const updateOffer = async (id, payload) => {
    // some APIs accept POST with _method=PUT for multipart/form-data
    if (payload instanceof FormData) {
        payload.append('_method', 'PUT');
        const response = await axiosInstance.post(`/offers/${id}`, payload);
        return response.data;
    } else {
         const response = await axiosInstance.put(`/offers/${id}`, payload);
         return response.data;
    }
};

export const deleteOffer = async (id) => {
    const response = await axiosInstance.delete(`/offers/${id}`);
    return response.data;
};
