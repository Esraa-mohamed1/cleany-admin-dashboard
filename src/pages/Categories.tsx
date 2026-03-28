import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    getCompanies,
} from '../api/endpoints/companies';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from '../api/endpoints/categories';
import {
    createCategoryCompany,
    deleteCategoryCompany,
    getCategoryCompanies,
    updateCategoryCompany,
} from '../api/endpoints/categoryCompanies';

type Company = {
    id: number;
    name: string;
};

type Category = {
    id: number;
    name: string;
    icon?: string;
    image?: string;
};

type CategoryFormState = {
    name: string;
    iconText: string;
    iconPreview: string;
    iconFile: File | null;
};

type CompanyCategory = {
    id: number;
    company_id: string | number;
    category_id: string | number;
    region_id?: string | number;
    company_name: string;
    category_name: string;
};

type ToastType = 'success' | 'error';

const emptyForm: CategoryFormState = {
    name: '',
    iconText: '',
    iconPreview: '',
    iconFile: null,
};

const Categories: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyCategoriesLoading, setCompanyCategoriesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [companyCategories, setCompanyCategories] = useState<CompanyCategory[]>([]);
    const [isCompanyCategoryModalOpen, setIsCompanyCategoryModalOpen] = useState(false);
    const [editingCompanyCategoryId, setEditingCompanyCategoryId] = useState<number | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyCategoryCompanyId, setCompanyCategoryCompanyId] = useState('');
    const [companyCategoryCategoryId, setCompanyCategoryCategoryId] = useState('');
    const [companyCategoryRegionId, setCompanyCategoryRegionId] = useState('');
    const [formState, setFormState] = useState<CategoryFormState>(emptyForm);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('success');
    const toastTimerRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    const modalTitle = useMemo(
        () => (editingId === null ? 'Add Category' : 'Edit Category'),
        [editingId],
    );

    const companyCategoryModalTitle = useMemo(
        () => (editingCompanyCategoryId === null ? 'Add Company Category' : 'Edit Company Category'),
        [editingCompanyCategoryId],
    );

    const showToast = (message: string, type: ToastType = 'success') => {
        setToastMessage(message);
        setToastType(type);
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage('');
        }, 2200);
    };

    const stringifyError = (value: unknown): string => {
        if (typeof value === 'string') {
            return value;
        }
        if (value && typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (_error) {
                return 'Unexpected error occurred';
            }
        }
        return 'Unexpected error occurred';
    };

    const getCategoryIcon = (category: Category): string => {
        return category.icon || category.image || '🏷️';
    };

    const handleApiError = (apiError: unknown) => {
        if (axios.isAxiosError(apiError)) {
            const status = apiError.response?.status;
            const detailMessage =
                (apiError.response?.data as { detail?: string; message?: string } | undefined)?.detail ||
                (apiError.response?.data as { detail?: string; message?: string } | undefined)?.message ||
                stringifyError(apiError.response?.data) ||
                apiError.message;

            if (status === 401) {
                navigate('/login');
                return;
            }

            setError(detailMessage);

            if (status === 404 || status === 500) {
                showToast('Server request failed. Please try again.', 'error');
            } else {
                showToast(detailMessage, 'error');
            }
            return;
        }

        const fallback = 'Unexpected error occurred';
        setError(fallback);
        showToast(fallback, 'error');
    };

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const { list } = await getCategories();
            setData(list);
        } catch (apiError) {
            handleApiError(apiError);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompaniesList = async () => {
        try {
            const { list } = await getCompanies();
            setCompanies(list as Company[]);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchCompanyCategories = async () => {
        setCompanyCategoriesLoading(true);
        try {
            const { list } = await getCategoryCompanies();
            setCompanyCategories(list as CompanyCategory[]);
        } catch (apiError) {
            handleApiError(apiError);
        } finally {
            setCompanyCategoriesLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchCompanyCategories();
        fetchCompaniesList();
    }, []);

    const openAddModal = () => {
        setEditingId(null);
        setFormState(emptyForm);
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        const categoryIcon = getCategoryIcon(category);
        setEditingId(category.id);
        setFormState({
            name: category.name,
            iconText: categoryIcon.startsWith('http') || categoryIcon.startsWith('data:image/') ? '' : categoryIcon,
            iconPreview:
                categoryIcon.startsWith('http') || categoryIcon.startsWith('data:image/')
                    ? categoryIcon
                    : '',
            iconFile: null,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormState(emptyForm);
    };

    const openAddCompanyCategoryModal = () => {
        setEditingCompanyCategoryId(null);
        setCompanyCategoryCompanyId('');
        setCompanyCategoryCategoryId('');
        setCompanyCategoryRegionId('');
        setIsCompanyCategoryModalOpen(true);
    };

    const openEditCompanyCategoryModal = (category: CompanyCategory) => {
        setEditingCompanyCategoryId(category.id);
        setCompanyCategoryCompanyId(String(category.company_id || ''));
        setCompanyCategoryCategoryId(String(category.category_id || ''));
        setCompanyCategoryRegionId(String(category.region_id || ''));
        setIsCompanyCategoryModalOpen(true);
    };

    const closeCompanyCategoryModal = () => {
        setIsCompanyCategoryModalOpen(false);
        setEditingCompanyCategoryId(null);
        setCompanyCategoryCompanyId('');
        setCompanyCategoryCategoryId('');
        setCompanyCategoryRegionId('');
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        setFormState((prev) => ({
            ...prev,
            iconFile: file,
            iconPreview: URL.createObjectURL(file),
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedName = formState.name.trim();
        if (!trimmedName) {
            return;
        }

        try {
            let payload: FormData | { name: string; icon?: string };

            if (formState.iconFile) {
                const formData = new FormData();
                formData.append('name', trimmedName);
                formData.append('icon', formState.iconFile);
                payload = formData;
            } else {
                payload = {
                    name: trimmedName,
                    ...(formState.iconText.trim() ? { icon: formState.iconText.trim() } : {}),
                };
            }

            if (editingId === null) {
                await createCategory(payload);
                showToast('Category added successfully');
            } else {
                await updateCategory(editingId, payload);
                showToast('Category updated successfully');
            }

            closeModal();
            await fetchCategories();
        } catch (apiError) {
            handleApiError(apiError);
        }
    };

    const handleDelete = async (category: Category) => {
        const confirmed = window.confirm(`Delete category "${category.name}"?`);
        if (!confirmed) {
            return;
        }

        try {
            await deleteCategory(category.id);
            showToast('Category deleted successfully');
            await fetchCategories();
        } catch (apiError) {
            handleApiError(apiError);
        }
    };

    const handleCompanyCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!companyCategoryCompanyId || !companyCategoryCategoryId) {
            showToast('Please select a company and a category.', 'error');
            return;
        }

        const payload = {
            company_id: Number(companyCategoryCompanyId),
            category_id: Number(companyCategoryCategoryId),
            ...(companyCategoryRegionId ? { region_id: Number(companyCategoryRegionId) } : {})
        };

        try {
            if (editingCompanyCategoryId === null) {
                await createCategoryCompany(payload);
                showToast('Company category assigned successfully');
            } else {
                await updateCategoryCompany(editingCompanyCategoryId, payload);
                showToast('Company category assignment updated successfully');
            }

            closeCompanyCategoryModal();
            await fetchCompanyCategories();
        } catch (apiError) {
            handleApiError(apiError);
        }
    };

    const handleDeleteCompanyCategory = async (category: CompanyCategory) => {
        const confirmed = window.confirm(`Delete company assignment for "${category.company_name}"?`);
        if (!confirmed) {
            return;
        }

        try {
            await deleteCategoryCompany(category.id);
            showToast('Company category deleted successfully');
            await fetchCompanyCategories();
        } catch (apiError) {
            handleApiError(apiError);
        }
    };

    return (
        <section className="cyber-section-card">
            <div className="crud-page-header">
                <div>
                    <p className="cyber-page-kicker">Operations</p>
                    <h1 className="cyber-standalone-title">Categories</h1>
                </div>
                <button type="button" className="crud-add-button" onClick={openAddModal}>
                    Add Category
                </button>
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Icon/Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((category) => (
                            <tr key={category.id}>
                                <td>{category.id}</td>
                                <td>{category.name}</td>
                                <td>
                                    {getCategoryIcon(category).startsWith('http') ||
                                    getCategoryIcon(category).startsWith('data:image/') ? (
                                        <img
                                            className="crud-category-image"
                                            src={getCategoryIcon(category)}
                                            alt={`${category.name} icon`}
                                        />
                                    ) : (
                                        <span className="crud-emoji-icon">{getCategoryIcon(category)}</span>
                                    )}
                                </td>
                                <td>
                                    <div className="crud-actions">
                                        <button
                                            type="button"
                                            className="crud-action-button"
                                            onClick={() => openEditModal(category)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="crud-action-button crud-action-danger"
                                            onClick={() => handleDelete(category)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="crud-subsection">
                <div className="crud-page-header">
                    <div>
                        <p className="cyber-page-kicker">Linked Data</p>
                        <h2 className="cyber-standalone-title">Company Categories</h2>
                    </div>
                    <button
                        type="button"
                        className="crud-add-button"
                        onClick={openAddCompanyCategoryModal}
                    >
                        Add Company Category
                    </button>
                </div>

                <div className="crud-table-wrap">
                    <table className="crud-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Company</th>
                                <th>Category</th>
                                <th>Region</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companyCategories.map((category) => (
                                <tr key={`company-category-${category.id}`}>
                                    <td>{category.id}</td>
                                    <td>{category.company_name || category.company_id}</td>
                                    <td>{category.category_name || category.category_id}</td>
                                    <td>{category.region_id || '-'}</td>
                                    <td>
                                        <div className="crud-actions">
                                            <button
                                                type="button"
                                                className="crud-action-button"
                                                onClick={() => openEditCompanyCategoryModal(category)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="crud-action-button crud-action-danger"
                                                onClick={() => handleDeleteCompanyCategory(category)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {loading ? <div className="crud-loading">Loading categories...</div> : null}
            {companyCategoriesLoading ? <div className="crud-loading">Loading company categories...</div> : null}
            {error ? <div className="crud-error-inline">{error}</div> : null}

            {isModalOpen ? (
                <div
                    className="crud-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={modalTitle}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="crud-modal-panel">
                        <div className="crud-modal-head">
                            <h2>{modalTitle}</h2>
                            <button
                                type="button"
                                className="crud-modal-close"
                                onClick={closeModal}
                                aria-label="Close modal"
                            >
                                X
                            </button>
                        </div>
                        <form className="crud-form" onSubmit={handleSubmit}>
                            <label className="crud-field">
                                <span>Name</span>
                                <input
                                    type="text"
                                    name="name"
                                    value={formState.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter category name"
                                    required
                                />
                            </label>

                            <label className="crud-field">
                                <span>Icon (emoji)</span>
                                <input
                                    type="text"
                                    name="iconText"
                                    value={formState.iconText}
                                    onChange={handleInputChange}
                                    placeholder="Example: 📦"
                                />
                            </label>

                            <label className="crud-field">
                                <span>Icon/Image upload</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} />
                            </label>

                            {(formState.iconPreview || formState.iconText) && (
                                <div className="crud-preview-row">
                                    <span>Preview</span>
                                    {formState.iconPreview ? (
                                        <img className="crud-category-image" src={formState.iconPreview} alt="Preview" />
                                    ) : (
                                        <span className="crud-emoji-icon">{formState.iconText}</span>
                                    )}
                                </div>
                            )}

                            <div className="crud-modal-actions">
                                <button type="button" className="crud-action-button" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="crud-add-button">
                                    {editingId === null ? 'Create Category' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {isCompanyCategoryModalOpen ? (
                <div
                    className="crud-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={companyCategoryModalTitle}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeCompanyCategoryModal();
                        }
                    }}
                >
                    <div className="crud-modal-panel">
                        <div className="crud-modal-head">
                            <h2>{companyCategoryModalTitle}</h2>
                            <button
                                type="button"
                                className="crud-modal-close"
                                onClick={closeCompanyCategoryModal}
                                aria-label="Close modal"
                            >
                                X
                            </button>
                        </div>

                        <form className="crud-form" onSubmit={handleCompanyCategorySubmit}>
                            <label className="crud-field">
                                <span>Company</span>
                                <select 
                                    value={companyCategoryCompanyId} 
                                    onChange={(e) => setCompanyCategoryCompanyId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </label>
                            
                            <label className="crud-field">
                                <span>Category</span>
                                <select 
                                    value={companyCategoryCategoryId} 
                                    onChange={(e) => setCompanyCategoryCategoryId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {data.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </label>

                            <label className="crud-field">
                                <span>Region ID (Optional)</span>
                                <input
                                    type="number"
                                    value={companyCategoryRegionId}
                                    onChange={(event) => setCompanyCategoryRegionId(event.target.value)}
                                    placeholder="Enter Region ID"
                                />
                            </label>

                            <div className="crud-modal-actions">
                                <button
                                    type="button"
                                    className="crud-action-button"
                                    onClick={closeCompanyCategoryModal}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="crud-add-button">
                                    {editingCompanyCategoryId === null
                                        ? 'Create Company Category'
                                        : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {toastMessage ? (
                <div className={toastType === 'error' ? 'crud-toast-error' : 'crud-toast-success'}>
                    {toastMessage}
                </div>
            ) : null}
        </section>
    );
};

export default Categories;