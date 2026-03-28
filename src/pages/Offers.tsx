import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    createOffer,
    deleteOffer,
    getOffers,
    updateOffer,
} from '../api/endpoints/offers';
import { getCompanies } from '../api/endpoints/companies';
import { getCategories } from '../api/endpoints/categories';
import { confirmDelete, showSuccess, showError } from '../utils/alerts';

type Offer = {
    id: number;
    title: string;
    description: string;
    is_active: number;
    image_path: string;
    company_id: number | null;
    company_name: string | null;
    category_id: number | null;
    category_name: string | null;
};

type Option = { id: number; name: string };

type OfferFormState = {
    title: string;
    description: string;
    is_active: number;
    company_id: string;
    category_id: string;
    imageFile: File | null;
    imagePreview: string;
};

const emptyForm: OfferFormState = {
    title: '',
    description: '',
    is_active: 1,
    company_id: '',
    category_id: '',
    imageFile: null,
    imagePreview: '',
};

const Offers: React.FC = () => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [companies, setCompanies] = useState<Option[]>([]);
    const [categories, setCategories] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formState, setFormState] = useState<OfferFormState>(emptyForm);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // UI states
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    
    // Filtering states
    const [filterType, setFilterType] = useState<string>('all'); 
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    const fetchOffers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: any = { page };
            if (filterType === 'by_company' && selectedCompanyId) {
                params.company_id = selectedCompanyId;
            } else if (filterType === 'public') {
                params.is_public = 1;
            }
            
            const { list, meta } = await getOffers(params);
            setOffers(list as Offer[]);
            if (meta) {
                setCurrentPage(meta.current_page);
                setTotalPages(meta.last_page);
            }
        } catch (error) {
            showError('Failed to fetch offers');
        } finally {
            setLoading(false);
        }
    }, [filterType, selectedCompanyId]);

    const fetchDependencies = async () => {
        try {
            const [compRes, catRes] = await Promise.all([getCompanies(), getCategories()]);
            setCompanies(compRes.list as Option[]);
            setCategories(catRes.list as Option[]);
        } catch (error) {
            console.error('Dependencies fetch error', error);
        }
    };

    useEffect(() => {
        fetchOffers(1);
        fetchDependencies();
    }, [fetchOffers]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: name === 'is_active' ? Number(value) : value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setFormState((prev) => ({
            ...prev,
            imageFile: file,
            imagePreview: URL.createObjectURL(file),
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!formState.title.trim()) {
            setErrors({ title: 'Title is required' });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('title', formState.title);
            formData.append('description', formState.description);
            formData.append('is_active', String(formState.is_active));
            if (formState.company_id) formData.append('company_id', formState.company_id);
            if (formState.category_id) formData.append('category_id', formState.category_id);
            if (formState.imageFile) formData.append('image', formState.imageFile);

            if (editingId === null) {
                await createOffer(formData);
                showSuccess('Offer Created');
            } else {
                await updateOffer(editingId, formData);
                showSuccess('Offer Updated');
            }
            setIsModalOpen(false);
            fetchOffers(currentPage);
        } catch (error) {
            showError('Submission Failed');
        }
    };

    const handleDelete = async (offer: Offer) => {
        const confirmed = await confirmDelete(`Delete "${offer.title}"?`);
        if (confirmed) {
            try {
                await deleteOffer(offer.id);
                showSuccess('Deleted successfully');
                fetchOffers(currentPage);
            } catch (error) {
                showError('Deletion failed');
            }
        }
    };

    const openEdit = (offer: Offer) => {
        setEditingId(offer.id);
        setFormState({
            title: offer.title || '',
            description: offer.description || '',
            is_active: offer.is_active,
            company_id: offer.company_id ? String(offer.company_id) : '',
            category_id: offer.category_id ? String(offer.category_id) : '',
            imageFile: null,
            imagePreview: offer.image_path || '',
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="crud-pagination">
                <button disabled={currentPage === 1} onClick={() => fetchOffers(currentPage - 1)}>Prev</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => fetchOffers(currentPage + 1)}>Next</button>
            </div>
        );
    };

    return (
        <section className="cyber-section-card">
            <div className="crud-page-header">
                <div>
                    <p className="cyber-page-kicker">Operations</p>
                    <h1 className="cyber-standalone-title">Offers</h1>
                </div>
                <button className="crud-add-button" onClick={() => { setEditingId(null); setFormState(emptyForm); setErrors({}); setIsModalOpen(true); }}>+ Create Offer</button>
            </div>

            <div className="crud-filters-row">
                <div className="filter-item">
                    <span>Filter:</span>
                    <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}>
                        <option value="all">All</option>
                        <option value="public">Public</option>
                        <option value="by_company">By Company</option>
                    </select>
                </div>
                {filterType === 'by_company' && (
                    <select value={selectedCompanyId} onChange={e => { setSelectedCompanyId(e.target.value); setCurrentPage(1); }}>
                        <option value="">-- Select Company --</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead>
                        <tr>
                            <th>Preview</th>
                            <th>Info</th>
                            <th>Status</th>
                            <th>Owner</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers.map((offer) => (
                            <tr key={offer.id}>
                                <td>
                                    {offer.image_path ? (
                                        <img src={offer.image_path} alt="" className="table-img-preview" onClick={() => setLightboxImage(offer.image_path)} />
                                    ) : <div className="table-img-placeholder">∅</div>}
                                </td>
                                <td>
                                    <div className="row-main-text">{offer.title}</div>
                                    <div className="row-sub-text">{offer.description?.substring(0,40)}...</div>
                                </td>
                                <td>
                                    <span className={`crud-status-badge ${offer.is_active ? 'crud-status-active' : 'crud-status-expired'}`}>
                                        {offer.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div className="row-tag">{offer.company_name || 'Global'}</div>
                                </td>
                                <td>
                                    <div className="crud-actions">
                                        <button className="crud-action-button" onClick={() => openEdit(offer)}>Edit</button>
                                        <button className="crud-action-button crud-action-danger" onClick={() => handleDelete(offer)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {renderPagination()}
            </div>

            {loading && <div className="crud-loading">Syncing...</div>}

            {isModalOpen && createPortal(
                <div className="crud-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="crud-modal-panel">
                        <div className="crud-modal-head">
                            <h2>{editingId ? 'Edit' : 'Create'} Offer</h2>
                            <button className="crud-modal-close" onClick={() => setIsModalOpen(false)}>X</button>
                        </div>
                        <form className="crud-form" onSubmit={handleSubmit}>
                            <label className="crud-field">
                                <span>Title</span>
                                <input name="title" value={formState.title} onChange={handleInputChange} className={errors.title ? 'error' : ''} />
                                {errors.title && <span className="field-error">{errors.title}</span>}
                            </label>
                            <label className="crud-field"><span>Description</span><textarea name="description" value={formState.description} onChange={handleInputChange} rows={2} /></label>
                            <div className="form-grid">
                                <label className="crud-field"><span>Status</span><select name="is_active" value={formState.is_active} onChange={handleInputChange}><option value={1}>Active</option><option value={0}>Inactive</option></select></label>
                                <label className="crud-field"><span>Company</span><select name="company_id" value={formState.company_id} onChange={handleInputChange}><option value="">None (Public)</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                            </div>
                            <div className="crud-field">
                                <span>Image</span>
                                <label className="upload-box">
                                    <input type="file" onChange={handleFileUpload} accept="image/*" hidden />
                                    {formState.imagePreview ? <img src={formState.imagePreview} alt="" /> : <span>Click to Upload</span>}
                                </label>
                            </div>
                            <div className="crud-modal-actions">
                                <button type="button" className="crud-action-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="crud-add-button">{editingId ? 'Save' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}

            {lightboxImage && createPortal(
                <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
                    <img src={lightboxImage} alt="" />
                </div>, document.body
            )}
        </section>
    );
};

export default Offers;