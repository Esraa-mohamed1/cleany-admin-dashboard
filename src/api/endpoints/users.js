/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import axiosInstance from '../axios';
import axios from 'axios';

const fallbackUsers = [
    {
        id: 1,
        name: 'Ava Cooper',
        email: 'ava.cooper@cleany.io',
        phone: '+1 415 222 1456',
        role: 'Admin',
        status: 'Active',
    },
    {
        id: 2,
        name: 'Liam Stone',
        email: 'liam.stone@cleany.io',
        phone: '+1 646 100 4891',
        role: 'Manager',
        status: 'Active',
    },
    {
        id: 3,
        name: 'Noah Patel',
        email: 'noah.patel@cleany.io',
        phone: '+1 503 771 9080',
        role: 'Support',
        status: 'Inactive',
    },
];

let fallbackMode = false;
let localUsersStore = [...fallbackUsers];

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

const toUser = (item, index) => {
    const record = item && typeof item === 'object' ? item : {};

    return {
        id: record.id || record.user_id || record.pk || index + 1,
        name: readText(record.name ?? record.full_name ?? record.username ?? record.title),
        email: readText(record.email ?? record.mail ?? record.user_email),
        phone: readText(record.phone ?? record.mobile ?? record.phone_number),
        role: readText(record.role ?? record.user_role, 'User'),
        status: normalizeStatus(record.status ?? record.is_active ?? record.active),
    };
};

const extractUsersArray = (payload) => {
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
        if (Array.isArray(payload.users)) {
            return payload.users;
        }
        if (Array.isArray(payload.items)) {
            return payload.items;
        }
        if (nestedData && Array.isArray(nestedData.results)) {
            return nestedData.results;
        }
        if (nestedData && Array.isArray(nestedData.users)) {
            return nestedData.users;
        }
        if (nestedData && Array.isArray(nestedData.items)) {
            return nestedData.items;
        }
    }

    return [];
};

export const getUsers = async () => {
    if (fallbackMode) {
        return {
            raw: { local: true },
            list: [...localUsersStore],
        };
    }

    try {
        const response = await axiosInstance.get('/users');
        const rawList = extractUsersArray(response.data);
        return {
            raw: response.data,
            list: rawList.map((item, index) => toUser(item, index)),
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return {
                raw: { local: true, reason: 'users-endpoint-missing' },
                list: [...localUsersStore],
            };
        }
        throw error;
    }
};

export const createUser = async (payload) => {
    if (fallbackMode) {
        const next = {
            ...payload,
            id: localUsersStore.length ? Math.max(...localUsersStore.map((user) => user.id)) + 1 : 1,
        };
        localUsersStore = [...localUsersStore, next];
        return next;
    }

    try {
        return await axiosInstance.post('/users', payload);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return createUser(payload);
        }
        throw error;
    }
};

export const updateUser = async (id, payload) => {
    if (fallbackMode) {
        localUsersStore = localUsersStore.map((user) =>
            user.id === id ? { ...user, ...payload, id } : user,
        );
        return;
    }

    try {
        return await axiosInstance.put(`/users/${id}`, payload);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return updateUser(id, payload);
        }
        throw error;
    }
};

export const deleteUser = async (id) => {
    if (fallbackMode) {
        localUsersStore = localUsersStore.filter((user) => user.id !== id);
        return;
    }

    try {
        return await axiosInstance.delete(`/users/${id}`);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            fallbackMode = true;
            return deleteUser(id);
        }
        throw error;
    }
};
