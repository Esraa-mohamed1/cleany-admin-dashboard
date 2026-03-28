import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    createOffer,
    deleteOffer,
    getOffers,
    updateOffer,
} from '../api/endpoints/offers';
import { getCompanies } from '../api/endpoints/companies';
import { getCategories } from '../api/endpoints/categories';

type Offer = {
    id: number;
    title: string;
    description: string;
    is_active: number;
    image_path?: string;
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

type ToastType = 'success' | 'error';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formState, setFormState] = useState<OfferFormState>(emptyForm);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('success');
    
    // Custom delete modal and validation states
    const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    // Improved Filter states
    const [filterType, setFilterType] = useState<string>('all'); // all, public, by_company
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    
    const filteredOffers = useMemo(() => {
        if (filterType === 'all') return offers;
        if (filterType === 'public') return offers.filter(o => !o.company_id);
        if (filterType === 'by_company' && selectedCompanyId) {
            return offers.filter(o => o.company_id && String(o.company_id) === selectedCompanyId);
        }
        return offers; // Fallback
    }, [offers, filterType, selectedCompanyId]);

    const toastTimerRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    const modalTitle = useMemo(() => (editingId === null ? 'Add Offer' : 'Edit Offer'), [editingId]);

    const fetchOffers = async () => {
        try {
            const { list } = await getOffers();
            setOffers(list as Offer[]);
        } catch (error) {
            showToast('Failed to fetch offers', 'error');
        }
    };

    const fetchDependencies = async () => {
        try {
            const [compRes, catRes] = await Promise.all([getCompanies(), getCategories()]);
            setCompanies(compRes.list as Option[]);
            setCategories(catRes.list as Option[]);
        } catch (error) {
            console.error('Failed to fetch dependencies', error);
        }
    };

    useEffect(() => {
        fetchOffers();
        fetchDependencies();
    }, []);

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

    const openAddModal = () => {
        setEditingId(null);
        setFormState(emptyForm);
        setErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (offer: Offer) => {
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

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormState(emptyForm);
        setErrors({});
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: name === 'is_active' ? Number(value) : value }));
        // Clear error when typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        setFormState((prev) => ({
            ...prev,
            imageFile: file,
            imagePreview: URL.createObjectURL(file),
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Custom Bootstrap-like Validation
        const newErrors: { [key: string]: string } = {};
        if (!formState.title || formState.title.trim() === '') {
            newErrors.title = 'Title field is required';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return; // Stop submission
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
                showToast('Offer added successfully');
            } else {
                await updateOffer(editingId, formData);
                showToast('Offer updated successfully');
            }

            closeModal();
            await fetchOffers();
        } catch (error) {
            showToast('Submission failed', 'error');
        }
    };

    // Trigger delete confirmation modal
    const confirmDelete = (offer: Offer) => {
        setDeleteTarget(offer);
    };

    const proceedDelete = async () => {
        if (!deleteTarget) return;

        try {
            await deleteOffer(deleteTarget.id);
            showToast('Offer deleted successfully');
            await fetchOffers();
        } catch (error) {
            showToast('Deletion failed', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    // Modal renders securely via createPortal to float above absolutely everything, including navbar
    const renderModal = () => {
        if (!isModalOpen) return null;

        return createPortal(
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
                <div className="crud-modal-panel" style={{maxHeight:'90vh', overflowY:'auto'}}>
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
                    <form className="crud-form" onSubmit={handleSubmit} noValidate>
                        <label className="crud-field">
                            <span>Title <span style={{color: 'red'}}>*</span></span>
                            <input
                                type="text"
                                name="title"
                                value={formState.title}
                                onChange={handleInputChange}
                                placeholder="Offer title"
                                style={{ borderColor: errors.title ? 'red' : undefined }}
                            />
                            {errors.title && <small style={{color: 'red', marginTop: '4px'}}>{errors.title}</small>}
                        </label>

                        <label className="crud-field">
                            <span>Description</span>
                            <textarea
                                name="description"
                                value={formState.description}
                                onChange={handleInputChange}
                                placeholder="Description"
                                rows={3}
                            />
                        </label>

                        <label className="crud-field">
                            <span>Status</span>
                            <select name="is_active" value={formState.is_active} onChange={handleInputChange}>
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </select>
                        </label>

                        <label className="crud-field">
                            <span>Company (Optional)</span>
                            <select name="company_id" value={formState.company_id} onChange={handleInputChange}>
                                <option value="">-- No Company --</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>

                        <label className="crud-field">
                            <span>Category (Optional)</span>
                            <select name="category_id" value={formState.category_id} onChange={handleInputChange}>
                                <option value="">-- No Category --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </label>

                        <div className="crud-field">
                            <span>Image Upload</span>
                            <label style={{ 
                                border: '2px dashed #007bff',
                                borderRadius: '8px', 
                                padding: '20px', 
                                textAlign: 'center', 
                                cursor: 'pointer',
                                display: 'block',
                                background: formState.imagePreview ? 'transparent' : '#f8f9fa'
                            }}>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileUpload} 
                                    style={{ display: 'none' }}
                                />
                                {formState.imagePreview ? (
                                    <img 
                                        src={formState.imagePreview} 
                                        alt="Preview" 
                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                                    />
                                ) : (
                                    <span style={{ color: '#007bff', fontWeight: 'bold' }}>+ Click here to upload image</span>
                                )}
                            </label>
                        </div>

                        <div className="crud-modal-actions">
                            <button type="button" className="crud-action-button" onClick={closeModal}>
                                Cancel
                            </button>
                            <button type="submit" className="crud-add-button">
                                {editingId === null ? 'Create Offer' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>,
            document.body
        );
    };

    const renderDeleteModal = () => {
        if (!deleteTarget) return null;

        return createPortal(
            <div
                className="crud-modal-overlay"
                role="dialog"
                aria-modal="true"
                aria-label="Confirm Deletion"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <div className="crud-modal-panel">
                    <div className="crud-modal-head">
                        <h2 style={{color: '#ef4444'}}>Confirm Deletion</h2>
                        <button
                            type="button"
                            className="crud-modal-close"
                            onClick={() => setDeleteTarget(null)}
                            aria-label="Close modal"
                        >
                            X
                        </button>
                    </div>
                    <div className="crud-form" style={{marginTop: '10px', marginBottom: '20px'}}>
                        <p>Are you sure you want to delete the offer <strong>&quot;{deleteTarget.title}&quot;</strong>?</p>
                        <p style={{fontSize: '13px', color: '#94a3b8', marginTop: '8px'}}>This action cannot be undone.</p>
                    </div>
                    <div className="crud-modal-actions">
                        <button type="button" className="crud-action-button" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </button>
                        <button type="button" className="crud-add-button crud-action-danger" style={{background: '#ef4444', color: 'white', border: 'none'}} onClick={proceedDelete}>
                            Delete Offer
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <section className="cyber-section-card">
            <div className="crud-page-header">
                <div>
                    <p className="cyber-page-kicker">Operations</p>
                    <h1 className="cyber-standalone-title">Offers</h1>
                </div>
                <button type="button" className="crud-add-button" onClick={openAddModal}>
                    Add Offer
                </button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>FILTER BY:</span>
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: 'inherit',
                            borderRadius: '8px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Offers</option>
                        <option value="public">Public Offers (No Company)</option>
                        <option value="by_company">Specific Company</option>
                    </select>
                </div>

                {filterType === 'by_company' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>SELECT COMPANY:</span>
                        <select 
                            value={selectedCompanyId} 
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'inherit',
                                borderRadius: '8px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">-- Choose Company --</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Company</th>
                            <th>Category</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOffers.map((offer) => (
                            <tr key={offer.id}>
                                <td>
                                    {offer.image_path && (
                                        <img src={offer.image_path} alt="Offer" style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}} />
                                    )}
                                </td>
                                <td>{offer.title}</td>
                                <td>{offer.description && offer.description.substring(0, 30)}...</td>
                                <td>
                                    <span
                                        className={`crud-status-badge ${
                                            offer.is_active
                                                ? 'crud-status-active'
                                                : 'crud-status-expired'
                                        }`}
                                    >
                                        {offer.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>{offer.company_name}</td>
                                <td>{offer.category_name}</td>
                                <td>
                                    <div className="crud-actions">
                                        <button
                                            type="button"
                                            className="crud-action-button"
                                            onClick={() => openEditModal(offer)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="crud-action-button crud-action-danger"
                                            onClick={() => confirmDelete(offer)}
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

            {renderModal()}
            {renderDeleteModal()}

            {toastMessage ? (
                <div className={toastType === 'error' ? 'crud-toast-error' : 'crud-toast-success'}>
                    {toastMessage}
                </div>
            ) : null}
        </section>
    );
};

export default Offers;