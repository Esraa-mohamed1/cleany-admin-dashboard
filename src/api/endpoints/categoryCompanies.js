/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axiosInstance from '../axios';
import axios from 'axios';

const fallbackCategoryCompanies = [];

let fallbackMode = false;
let localCategoryCompaniesStore = [...fallbackCategoryCompanies];

const normalizeCategory = (item, index) => {
    const record = item && typeof item === 'object' ? item : {};
    const compName = record.company?.name || record.company_name || `Company ${record.company_id || ''}`;
    const catName = record.category?.name || record.category_name || `Category ${record.category_id || ''}`;
    return {
        id: record.id || record.category_company_id || record.pk || index + 1,
        company_id: record.company_id || '',
        category_id: record.category_id || '',
        region_id: record.region_id || '',
        company_name: compName,
        category_name: catName,
        name: record.name || `${compName} - ${catName}`,
    };
};

const extractCategoryCompaniesArray = (payload) => {
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
        if (Array.isArray(payload.category_companies)) {
            return payload.category_companies;
        }
        if (Array.isArray(payload.items)) {
            return payload.items;
        }
        if (nestedData && Array.isArray(nestedData.results)) {
            return nestedData.results;
        }
        if (nestedData && Array.isArray(nestedData.category_companies)) {
            return nestedData.category_companies;
        }
    }

    return [];
};

export const getCategoryCompanies = async () => {
    if (fallbackMode) {
        return {
            raw: { local: true },
            list: [...localCategoryCompaniesStore],
        };
    }

    try {
        const response = await axiosInstance.get('/category_companies');
        const list = extractCategoryCompaniesArray(response.data).map((item, index) =>
            normalizeCategory(item, index),
        );

        return {
            raw: response.data,
            list,
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return {
                raw: { local: true, reason: 'category-companies-endpoint-missing' },
                list: [...localCategoryCompaniesStore],
            };
        }
        throw error;
    }
};

export const createCategoryCompany = async (payload) => {
    if (fallbackMode) {
        const next = {
            id: localCategoryCompaniesStore.length
                ? Math.max(...localCategoryCompaniesStore.map((item) => item.id)) + 1
                : 1,
            name: payload.name,
        };
        localCategoryCompaniesStore = [...localCategoryCompaniesStore, next];
        return next;
    }

    try {
        return await axiosInstance.post('/category_companies', payload);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return createCategoryCompany(payload);
        }
        throw error;
    }
};

export const updateCategoryCompany = async (id, payload) => {
    if (fallbackMode) {
        localCategoryCompaniesStore = localCategoryCompaniesStore.map((item) =>
            item.id === id ? { ...item, ...payload, id } : item,
        );
        return;
    }

    try {
        return await axiosInstance.put(`/category_companies/${id}`, payload);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return updateCategoryCompany(id, payload);
        }
        throw error;
    }
};

export const deleteCategoryCompany = async (id) => {
    if (fallbackMode) {
        localCategoryCompaniesStore = localCategoryCompaniesStore.filter((item) => item.id !== id);
        return;
    }

    try {
        return await axiosInstance.delete(`/category_companies/${id}`);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return deleteCategoryCompany(id);
        }
        throw error;
    }
};
