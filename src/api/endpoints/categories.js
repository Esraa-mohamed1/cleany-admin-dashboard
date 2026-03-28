import axiosInstance from '../axios';

export const extractCategoriesArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.results)) return payload.results;
        if (Array.isArray(payload.categories)) return payload.categories;
        if (Array.isArray(payload.items)) return payload.items;
        
        const nestedData = payload.data && typeof payload.data === 'object' ? payload.data : null;
        if (nestedData && Array.isArray(nestedData.results)) return nestedData.results;
        if (nestedData && Array.isArray(nestedData.categories)) return nestedData.categories;
        if (nestedData && Array.isArray(nestedData.items)) return nestedData.items;
    }
    return [];
};

export const getCategories = async (params = {}) => {
    const response = await axiosInstance.get('/categories', { params });
    return {
        list: extractCategoriesArray(response.data),
        meta: response.data.meta,
    };
};

export const createCategory = async (payload) => {
    return await axiosInstance.post('/categories', payload);
};

export const updateCategory = async (id, payload) => {
    return await axiosInstance.put(`/categories/${id}`, payload);
};

export const deleteCategory = async (id) => {
    return await axiosInstance.delete(`/categories/${id}`);
};
