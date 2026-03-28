/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axiosInstance from '../axios';

export const extractCategoriesArray = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === 'object') {
        const nestedData = payload.data && typeof payload.data === 'object' ? payload.data : null;

        if (Array.isArray(payload.data)) {
            return payload.data;
        }
        if (Array.isArray(payload.results)) {
            return payload.results;
        }
        if (Array.isArray(payload.categories)) {
            return payload.categories;
        }
        if (nestedData && Array.isArray(nestedData.results)) {
            return nestedData.results;
        }
        if (nestedData && Array.isArray(nestedData.categories)) {
            return nestedData.categories;
        }
    }

    return [];
};

export const getCategories = async () => {
    const response = await axiosInstance.get('/categories');
    return {
        raw: response.data,
        list: extractCategoriesArray(response.data),
    };
};

export const createCategory = async (payload) => {
    return axiosInstance.post('/categories', payload);
};

export const updateCategory = async (id, payload) => {
    return axiosInstance.put(`/categories/${id}`, payload);
};

export const deleteCategory = async (id) => {
    return axiosInstance.delete(`/categories/${id}`);
};
