/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axiosInstance from '../axios';
import axios from 'axios';

const fallbackCompanies = [
    { id: 1, name: 'Nova Dynamics', email: 'hello@novadynamics.com', phone: '+1 415 630 2211', status: 'Active' },
    { id: 2, name: 'Blue Harbor', email: 'support@blueharbor.io', phone: '+1 646 821 1987', status: 'Inactive' },
    { id: 3, name: 'Axis Retail Labs', email: 'contact@axisretail.dev', phone: '+1 503 411 4458', status: 'Active' },
    { id: 4, name: 'GreenRoute LLC', email: 'team@greenroute.app', phone: '+1 212 900 7878', status: 'Active' },
];

let fallbackMode = false;
let localCompaniesStore = [...fallbackCompanies];

const normalizeStatus = (value) => {
    if (typeof value === 'boolean') {
        return value ? 'Active' : 'Inactive';
    }
    if (typeof value === 'string') {
        const normalized = value.toLowerCase();
        if (normalized === 'active' || normalized === '1' || normalized === 'true') {
            return 'Active';
        }
    }
    if (typeof value === 'number' && value === 1) {
        return 'Active';
    }
    return 'Inactive';
};

const readText = (value, fallback = '-') => {
    return typeof value === 'string' && value.trim() ? value : fallback;
};

const toCompany = (item, index) => {
    const record = item && typeof item === 'object' ? item : {};
    const nestedCategory =
        record.category_company && typeof record.category_company === 'object'
            ? record.category_company
            : null;

    return {
        id: record.id || record.company_id || record.pk || index + 1,
        name: readText(record.name ?? record.company_name ?? record.title),
        email: readText(record.email ?? record.company_email ?? record.mail),
        phone: readText(record.phone ?? record.phone_number ?? record.mobile),
        status: normalizeStatus(record.status ?? record.is_active ?? record.active),
        categoryCompanyId:
            record.category_company_id ||
            record.category_company ||
            (nestedCategory ? nestedCategory.id : null) ||
            null,
        categoryCompanyName:
            readText(
                record.category_company_name ||
                    record.category_name ||
                    (nestedCategory ? nestedCategory.name : null),
                'Unassigned',
            ),
    };
};

export const extractCompaniesArray = (payload) => {
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
        if (Array.isArray(payload.companies)) {
            return payload.companies;
        }
        if (Array.isArray(payload.items)) {
            return payload.items;
        }
        if (nestedData && Array.isArray(nestedData.results)) {
            return nestedData.results;
        }
        if (nestedData && Array.isArray(nestedData.companies)) {
            return nestedData.companies;
        }
        if (nestedData && Array.isArray(nestedData.items)) {
            return nestedData.items;
        }
    }

    return [];
};

export const getCompanies = async (params = {}) => {
    if (fallbackMode) {
        return {
            list: [...localCompaniesStore],
            meta: { current_page: 1, last_page: 1, total: localCompaniesStore.length },
        };
    }

    try {
        const response = await axiosInstance.get('/companies', { params });
        const rawList = extractCompaniesArray(response.data);
        return {
            list: rawList.map((item, index) => toCompany(item, index)),
            meta: response.data.meta,
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return {
                raw: { local: true, reason: 'companies-endpoint-missing' },
                list: [...localCompaniesStore],
            };
        }
        throw error;
    }
};

export const createCompany = async (payload) => {
    if (fallbackMode) {
        const next = {
            ...payload,
            id: localCompaniesStore.length
                ? Math.max(...localCompaniesStore.map((company) => company.id)) + 1
                : 1,
        };
        localCompaniesStore = [...localCompaniesStore, next];
        return next;
    }

    try {
        return await axiosInstance.post('/companies', payload);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return createCompany(payload);
        }
        throw error;
    }
};

export const updateCompany = async (id, payload) => {
    if (fallbackMode) {
        localCompaniesStore = localCompaniesStore.map((company) =>
            company.id === id ? { ...company, ...payload, id } : company,
        );
        return;
    }

    try {
        return await axiosInstance.put(`/companies/${id}`, payload);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return updateCompany(id, payload);
        }
        throw error;
    }
};

export const deleteCompany = async (id) => {
    if (fallbackMode) {
        localCompaniesStore = localCompaniesStore.filter((company) => company.id !== id);
        return;
    }

    try {
        return await axiosInstance.delete(`/companies/${id}`);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return deleteCompany(id);
        }
        throw error;
    }
};
