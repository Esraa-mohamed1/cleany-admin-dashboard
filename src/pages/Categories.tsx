import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { getCompanies } from '../api/endpoints/companies';
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
import { confirmDelete, showSuccess, showError } from '../utils/alerts';

type Company = { id: number; name: string; };
type Category = { id: number; name: string; icon?: string; image?: string; is_active?: boolean | number; };
type CategoryFormState = { name: string; is_active: boolean; iconPreview: string; iconFile: File | null; };
type CompanyCategory = { id: number; company_id: string | number; category_id: string | number; region_id?: string | number; company_name: string; category_name: string; };

const emptyForm: CategoryFormState = { name: '', is_active: true, iconPreview: '', iconFile: null, };

const Categories: React.FC = () => {
    const [data, setData] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyCategoriesLoading, setCompanyCategoriesLoading] = useState(true);
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

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCategories = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { list, meta } = await getCategories({ page });
            setData(list);
            setTotalPages(meta?.last_page || 1);
            setCurrentPage(meta?.current_page || 1);
        } catch (err) { showError('Failed to sync categories'); }
        finally { setLoading(false); }
    }, []);

    const fetchCompanyCategories = useCallback(async () => {
        setCompanyCategoriesLoading(true);
        try {
            const res = await getCategoryCompanies();
            setCompanyCategories(res.list as CompanyCategory[]);
        } catch (err) { console.error(err); }
        finally { setCompanyCategoriesLoading(false); }
    }, []);

    useEffect(() => {
        fetchCategories(1);
        fetchCompanyCategories();
        getCompanies().then(res => setCompanies(res.list as Company[]));
    }, [fetchCategories, fetchCompanyCategories]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setFormState(prev => ({ ...prev, iconFile: file, iconPreview: URL.createObjectURL(file) }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name.trim()) return;
        try {
            const formData = new FormData();
            formData.append('name', formState.name);
            formData.append('is_active', formState.is_active ? '1' : '0');
            if (formState.iconFile) formData.append('image', formState.iconFile);

            if (editingId) await updateCategory(editingId, formData);
            else await createCategory(formData);
            showSuccess(editingId ? 'Updated' : 'Created');
            setIsModalOpen(false);
            fetchCategories(currentPage);
        } catch (err) { showError('Validation Errors: Name, Active status, and Image are required'); }
    };

    const handleDelete = async (cat: Category) => {
        if (await confirmDelete(`Delete category "${cat.name}"?`)) {
            try {
                await deleteCategory(cat.id);
                showSuccess('Category removed');
                fetchCategories(currentPage);
            } catch (err) { showError('Deletion failed'); }
        }
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyCategoryCompanyId || !companyCategoryCategoryId) return;
        try {
            const payload = { 
                company_id: Number(companyCategoryCompanyId), 
                category_id: Number(companyCategoryCategoryId),
                region_id: companyCategoryRegionId ? Number(companyCategoryRegionId) : undefined 
            };
            if (editingCompanyCategoryId) await updateCategoryCompany(editingCompanyCategoryId, payload);
            else await createCategoryCompany(payload);
            showSuccess('Linked Successfully');
            setIsCompanyCategoryModalOpen(false);
            fetchCompanyCategories();
        } catch (err) { showError('Link Failed'); }
    };

    const handleDeleteLink = async (link: CompanyCategory) => {
        if (await confirmDelete('Remove company from category?')) {
            try {
                await deleteCategoryCompany(link.id);
                showSuccess('Link removed');
                fetchCompanyCategories();
            } catch (err) { showError('Failed to unlink'); }
        }
    };

    return (
        <section className="cyber-section-card">
            <div className="crud-page-header">
                <div><p className="cyber-page-kicker">Taxonomy</p><h1 className="cyber-standalone-title">Categories</h1></div>
                <button className="crud-add-button" onClick={() => { setEditingId(null); setFormState(emptyForm); setIsModalOpen(true); }}>+ Add Main Category</button>
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead><tr><th>ID</th><th>Visual</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {data.map(cat => (
                            <tr key={cat.id}>
                                <td><span className="row-tag">#{cat.id}</span></td>
                                <td>
                                    {(cat.image || cat.icon)?.startsWith('http') ? (
                                        <img className="table-img-preview" src={cat.image || cat.icon} alt="" onClick={() => (cat.image || cat.icon) && window.open(cat.image || cat.icon)} />
                                    ) : <span className="table-img-placeholder">{cat.icon || '🏷️'}</span>}
                                </td>
                                <td><div className="row-main-text">{cat.name}</div></td>
                                <td>
                                    <span className={`crud-status-badge ${cat.is_active ? 'crud-status-active' : 'crud-status-inactive'}`}>
                                        {cat.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </td>
                                <td>
                                    <div className="crud-actions">
                                        <button className="crud-action-button" onClick={() => { setEditingId(cat.id); setFormState({ name: cat.name, is_active: !!cat.is_active, iconPreview: cat.image || cat.icon || '', iconFile: null }); setIsModalOpen(true); }}>Edit</button>
                                        <button className="crud-action-button crud-action-danger" onClick={() => handleDelete(cat)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="crud-pagination">
                        <button disabled={currentPage === 1} onClick={() => fetchCategories(currentPage - 1)}>Prev</button>
                        <span>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => fetchCategories(currentPage + 1)}>Next</button>
                    </div>
                )}
            </div>

            <div className="crud-subsection">
                <div className="crud-page-header">
                    <div><p className="cyber-page-kicker">Linked Relations</p><h2 className="cyber-standalone-title">Company Assignments</h2></div>
                    <button className="crud-add-button" onClick={() => { setEditingCompanyCategoryId(null); setCompanyCategoryRegionId(''); setIsCompanyCategoryModalOpen(true); }}>+ Link Company with category</button>
                </div>
                <div className="crud-table-wrap">
                    <table className="crud-table">
                        <thead><tr><th>Company</th><th>Category</th><th>Region ID</th><th>Actions</th></tr></thead>
                        <tbody>
                            {companyCategories.map(link => (
                                <tr key={link.id}>
                                    <td><div className="row-main-text">{link.company_name}</div></td>
                                    <td><div className="row-tag">{link.category_name}</div></td>
                                    <td><span className="row-tag">#{link.region_id || 'N/A'}</span></td>
                                    <td>
                                        <div className="crud-actions">
                                            <button className="crud-action-button crud-action-danger" onClick={() => handleDeleteLink(link)}>Remove Link</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && createPortal(
                <div className="crud-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="crud-modal-panel">
                        <div className="crud-modal-head"><h2>{editingId ? 'Edit' : 'Create'} Category</h2><button className="crud-modal-close" onClick={() => setIsModalOpen(false)}>X</button></div>
                        <form className="crud-form" onSubmit={handleFormSubmit}>
                            <label className="crud-field"><span>Category Name</span><input value={formState.name} onChange={e => setFormState(p => ({ ...p, name: e.target.value }))} required /></label>
                            <label className="crud-field"><span>Visibility</span>
                                <select value={formState.is_active ? '1' : '0'} onChange={e => setFormState(p => ({ ...p, is_active: e.target.value === '1' }))}>
                                    <option value="1">Active (Visible)</option>
                                    <option value="0">Inactive (Hidden)</option>
                                </select>
                            </label>
                            <div className="crud-field">
                                <span>Category Image (Required)</span>
                                <label className="upload-box">
                                    <input type="file" onChange={handleFileUpload} accept="image/*" hidden required={!editingId} />
                                    {formState.iconPreview ? <img src={formState.iconPreview} alt="" /> : <span>Click to Upload Image</span>}
                                </label>
                            </div>
                            <div className="crud-modal-actions"><button type="button" className="crud-action-button" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="crud-add-button">Deploy Category</button></div>
                        </form>
                    </div>
                </div>, document.body
            )}

            {isCompanyCategoryModalOpen && createPortal(
                <div className="crud-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setIsCompanyCategoryModalOpen(false)}>
                    <div className="crud-modal-panel">
                        <div className="crud-modal-head"><h2>Link Company with category</h2><button className="crud-modal-close" onClick={() => setIsCompanyCategoryModalOpen(false)}>X</button></div>
                        <form className="crud-form" onSubmit={handleLinkSubmit}>
                            <label className="crud-field"><span>Target Company</span><select value={companyCategoryCompanyId} onChange={e => setCompanyCategoryCompanyId(e.target.value)} required><option value="">Select Company</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                            <label className="crud-field"><span>Target Category</span><select value={companyCategoryCategoryId} onChange={e => setCompanyCategoryCategoryId(e.target.value)} required><option value="">Select Category</option>{data.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                            <label className="crud-field"><span>Region Identifier (Optional)</span><input value={companyCategoryRegionId} onChange={e => setCompanyCategoryRegionId(e.target.value)} placeholder="Enter Region ID" /></label>
                            <div className="crud-modal-actions"><button type="button" className="crud-action-button" onClick={() => setIsCompanyCategoryModalOpen(false)}>Cancel</button><button type="submit" className="crud-add-button">Create Link</button></div>
                        </form>
                    </div>
                </div>, document.body
            )}
        </section>
    );
};
export default Categories;