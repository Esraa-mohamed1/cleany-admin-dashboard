import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cookies from 'js-cookie';
import { createCompany, deleteCompany, getCompanies, updateCompany } from '../api/endpoints/companies';
import { getCategoryCompanies } from '../api/endpoints/categoryCompanies';
import { confirmDelete, showSuccess, showError } from '../utils/alerts';

type CompanyStatus = 'Active' | 'Inactive';
type Company = { id: number; name: string; email: string; phone: string; status: CompanyStatus; description: string; categoryCompanyId?: number | null; categoryCompanyName?: string; };
type CompanyCategory = { id: number; name: string; };
type CompanyFormState = { name: string; email: string; phone: string; status: CompanyStatus; description: string; categoryCompanyId: string; logo: File | string | null; rating: string; is_verified: string; };

const emptyForm: CompanyFormState = { name: '', email: '', phone: '', status: 'Active', description: '', categoryCompanyId: '', logo: null, rating: '', is_verified: '1', };

const Companies: React.FC = () => {
    const [data, setData] = useState<Company[]>([]);
    const [companyCategories, setCompanyCategories] = useState<CompanyCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formState, setFormState] = useState<CompanyFormState>(emptyForm);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCompanies = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { list, meta } = await getCompanies({ page });
            setData(list as Company[]);
            setTotalPages(meta?.last_page || 1);
            setCurrentPage(meta?.current_page || 1);
        } catch (err) { showError('Sync failed'); }
        finally { setLoading(false); }
    }, []);

    const fetchCompanyCategories = useCallback(async () => {
        try {
            const { list } = await getCategoryCompanies();
            setCompanyCategories(list as CompanyCategory[]);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        fetchCompanies(1);
        fetchCompanyCategories();
    }, [fetchCompanies, fetchCompanyCategories]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(p => ({ ...p, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name } = e.target;
        const file = e.target.files?.[0] || null;
        setFormState(p => ({ ...p, [name]: file }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = new FormData();
            Object.entries(formState).forEach(([k, v]) => {
                if (k === 'categoryCompanyId') payload.append('category_company_id', String(v));
                else if (v !== null && v !== '') payload.append(k, v instanceof window.File ? v : String(v));
            });
            payload.append('admin_id', Cookies.get('admin_id') || '1');
            if (editingId) await updateCompany(editingId, payload);
            else await createCompany(payload);
            showSuccess(editingId ? 'Updated' : 'Added');
            setIsModalOpen(false);
            fetchCompanies(currentPage);
        } catch (err: any) {
            if (err.response?.data?.error) {
                const msgs = Object.values(err.response.data.error).flat().join(' | ');
                showError(msgs);
            } else {
                showError(err.response?.data?.message || 'Save Failed');
            }
        }
    };

    const handleDelete = async (comp: Company) => {
        if (await confirmDelete(`Wipe "${comp.name}"?`)) {
            try {
                await deleteCompany(comp.id);
                showSuccess('Purged');
                fetchCompanies(currentPage);
            } catch (err) { showError('Failed'); }
        }
    };

    return (
        <section className="cyber-section-card">
            <div className="crud-page-header">
                <div><p className="cyber-page-kicker">Managed Partners</p><h1 className="cyber-standalone-title">Companies</h1></div>
                <button className="crud-add-button" onClick={() => { setEditingId(null); setFormState(emptyForm); setIsModalOpen(true); }}>+ Onboard Company</button>
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead><tr><th>ID</th><th>Organization</th><th>Identity</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {data.map(comp => (
                            <tr key={comp.id}>
                                <td><span className="row-tag">#{comp.id}</span></td>
                                <td>
                                    <div className="row-main-text">{comp.name}</div>
                                    <div className="row-sub-text">{comp.phone}</div>
                                    <div className="row-sub-text" style={{ fontStyle: 'italic', marginTop: '4px' }}>{comp.description}</div>
                                </td>
                                <td><div className="row-main-text">{comp.email}</div></td>
                                <td><div className="row-tag">{comp.categoryCompanyName || 'General'}</div></td>
                                <td><span className={`crud-status-badge ${comp.status === 'Active' ? 'crud-status-active' : 'crud-status-inactive'}`}>{comp.status}</span></td>
                                <td>
                                    <div className="crud-actions">
                                        <button className="crud-action-button" onClick={() => { setEditingId(comp.id); setFormState({ ...comp, categoryCompanyId: comp.categoryCompanyId ? String(comp.categoryCompanyId) : '', logo: null, rating: '5', is_verified: '1' } as any); setIsModalOpen(true); }}>Edit</button>
                                        <button className="crud-action-button crud-action-danger" onClick={() => handleDelete(comp)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="crud-pagination">
                        <button disabled={currentPage === 1} onClick={() => fetchCompanies(currentPage - 1)}>Prev</button>
                        <span>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => fetchCompanies(currentPage + 1)}>Next</button>
                    </div>
                )}
            </div>
            {loading && <div className="crud-loading">Syncing Registry...</div>}

            {isModalOpen && createPortal(
                <div className="crud-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="crud-modal-panel">
                        <div className="crud-modal-head"><h2>{editingId ? 'Modify' : 'Onboard'} Partner</h2><button className="crud-modal-close" onClick={() => setIsModalOpen(false)}>X</button></div>
                        <form className="crud-form" onSubmit={handleSubmit}>
                            <label className="crud-field"><span>Full Legal Name</span><input name="name" value={formState.name} onChange={handleInputChange} required /></label>
                            <div className="form-grid">
                                <label className="crud-field"><span>Business Email</span><input type="email" name="email" value={formState.email} onChange={handleInputChange} required /></label>
                                <label className="crud-field"><span>Support Phone</span><input name="phone" value={formState.phone} onChange={handleInputChange} required /></label>
                            </div>
                            <div className="form-grid">
                                <label className="crud-field"><span>Logo (Image)</span><input type="file" className="crud-file-input" name="logo" onChange={handleFileChange} accept="image/*" required={!editingId} /></label>
                                <label className="crud-field"><span>Rating (0-5)</span><input type="number" step="0.1" name="rating" value={formState.rating} onChange={handleInputChange} required /></label>
                            </div>
                            <div className="form-grid">
                                <label className="crud-field"><span>Operational Status</span><select name="status" value={formState.status} onChange={handleInputChange} required><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
                                <label className="crud-field"><span>Service Stream</span><select name="categoryCompanyId" value={formState.categoryCompanyId} onChange={handleInputChange} required><option value="">Select Stream</option>{companyCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                            </div>
                            <label className="crud-field"><span>Is Verified?</span><select name="is_verified" value={formState.is_verified} onChange={handleInputChange} required><option value="1">Yes</option><option value="0">No</option></select></label>
                            <label className="crud-field"><span>Description Label</span><textarea name="description" value={formState.description} onChange={handleInputChange} className="description-styled" placeholder="Company mission or details..." required /></label>
                            <div className="crud-modal-actions"><button type="button" className="crud-action-button" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="crud-add-button">Deploy Registry</button></div>
                        </form>
                    </div>
                </div>, document.body
            )}
        </section>
    );
};
export default Companies;