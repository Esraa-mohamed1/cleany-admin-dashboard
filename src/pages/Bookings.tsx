import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getBookings, deleteBooking, updateBooking, createBooking } from '../api/endpoints/bookings';
import { getCompanies } from '../api/endpoints/companies';

type Booking = {
    id: number;
    user_id: number;
    user_name: string;
    company_id: number;
    company_name: string;
    service_id: number;
    service_name: string | null;
    booking_date: string;
    start_time: string;
    hours: number;
    end_time: string;
    unit_price: string;
    discount_applied: number;
    total_price: string;
    status: string;
    payment_status: string;
    payment_method: string;
    address: string;
    notes: string;
    staff_id: number | null;
    staff_name: string | null;
};

type Option = { id: number; name: string };
type ToastType = 'success' | 'error';

type BookingFormState = {
    user_id: string;
    company_id: string;
    service_id: string;
    booking_date: string;
    start_time: string;
    hours: string;
    status: string;
    payment_status: string;
    payment_method: string;
    address: string;
    notes: string;
    staff_id: string;
};

const emptyForm: BookingFormState = {
    user_id: '',
    company_id: '',
    service_id: '1',
    booking_date: '',
    start_time: '',
    hours: '1',
    status: 'pending',
    payment_status: 'unpaid',
    payment_method: 'cash',
    address: '',
    notes: '',
    staff_id: '',
};

const Bookings: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [companies, setCompanies] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('success');
    
    // CRUD Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formState, setFormState] = useState<BookingFormState>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Filtering states
    const [filterType, setFilterType] = useState<string>('all'); 
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    
    const toastTimerRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await getBookings();
            setBookings(res.list as Booking[]);
        } catch (error) {
            showToast('Failed to fetch bookings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDependencies = async () => {
        try {
            const res = await getCompanies();
            setCompanies(res.list as Option[]);
        } catch (error) {
            console.error('Failed to fetch companies', error);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchDependencies();
    }, []);

    const filteredBookings = useMemo(() => {
        if (filterType === 'all') return bookings;
        if (filterType === 'by_company' && selectedCompanyId) {
            return bookings.filter(b => String(b.company_id) === selectedCompanyId);
        }
        return bookings;
    }, [bookings, filterType, selectedCompanyId]);

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

    const openEditModal = (b: Booking) => {
        setEditingId(b.id);
        setFormState({
            user_id: String(b.user_id),
            company_id: String(b.company_id),
            service_id: String(b.service_id),
            booking_date: b.booking_date,
            start_time: b.start_time,
            hours: String(b.hours),
            status: b.status,
            payment_status: b.payment_status,
            payment_method: b.payment_method,
            address: b.address,
            notes: b.notes,
            staff_id: b.staff_id ? String(b.staff_id) : '',
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleQuickConfirm = async (booking: Booking) => {
        try {
            await updateBooking(booking.id, { status: 'confirmed' });
            showToast('Booking confirmed!');
            await fetchBookings();
        } catch (error) {
            showToast('Confirmation failed', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};
        if (!formState.booking_date) newErrors.booking_date = 'Date is required';
        if (!formState.start_time) newErrors.start_time = 'Time is required';
        if (!formState.address) newErrors.address = 'Address is required';
        if (!formState.company_id) newErrors.company_id = 'Company is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            if (editingId === null) {
                await createBooking(formState);
                showToast('Booking created successfully');
            } else {
                await updateBooking(editingId, formState);
                showToast('Booking updated successfully');
            }
            setIsModalOpen(false);
            await fetchBookings();
        } catch (error) {
            showToast('Operation failed', 'error');
        }
    };

    const proceedDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteBooking(deleteTarget.id);
            showToast('Booking deleted successfully');
            await fetchBookings();
        } catch (error) {
            showToast('Deletion failed', 'error');
        } finally {
            setDeleteTarget(null);
        }
    };

    // Portal components
    const renderModal = () => {
        if (!isModalOpen) return null;
        const modalTitle = editingId ? 'Edit Booking' : 'Add New Booking';

        return createPortal(
            <div className="crud-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                <div className="crud-modal-panel" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className="crud-modal-head">
                        <h2>{modalTitle}</h2>
                        <button type="button" className="crud-modal-close" onClick={() => setIsModalOpen(false)}>X</button>
                    </div>
                    <form className="crud-form" onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <label className="crud-field">
                                <span>Company</span>
                                <select name="company_id" value={formState.company_id} onChange={handleInputChange} style={{borderColor: errors.company_id ? '#ef4444' : ''}}>
                                    <option value="">Select Company</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {errors.company_id && <span className="field-error">{errors.company_id}</span>}
                            </label>
                            <label className="crud-field">
                                <span>User (Name or ID)</span>
                                <input name="user_id" value={formState.user_id} onChange={handleInputChange} placeholder="e.g. 1" />
                            </label>
                            <label className="crud-field">
                                <span>Date</span>
                                <input type="date" name="booking_date" value={formState.booking_date} onChange={handleInputChange} style={{borderColor: errors.booking_date ? '#ef4444' : ''}} />
                                {errors.booking_date && <span className="field-error">{errors.booking_date}</span>}
                            </label>
                            <label className="crud-field">
                                <span>Time</span>
                                <input type="time" name="start_time" value={formState.start_time} onChange={handleInputChange} step="1" />
                            </label>
                            <label className="crud-field">
                                <span>Duration (Hours)</span>
                                <input type="number" name="hours" value={formState.hours} onChange={handleInputChange} min="1" />
                            </label>
                            <label className="crud-field">
                                <span>Status</span>
                                <select name="status" value={formState.status} onChange={handleInputChange}>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </label>
                            <label className="crud-field">
                                <span>Payment Status</span>
                                <select name="payment_status" value={formState.payment_status} onChange={handleInputChange}>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </label>
                            <label className="crud-field">
                                <span>Payment Method</span>
                                <select name="payment_method" value={formState.payment_method} onChange={handleInputChange}>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="payment">Online Payment</option>
                                </select>
                            </label>
                        </div>

                        <label className="crud-field">
                            <span>Address</span>
                            <input name="address" value={formState.address} onChange={handleInputChange} placeholder="Full address" style={{borderColor: errors.address ? '#ef4444' : ''}} />
                        </label>

                        <label className="crud-field">
                            <span>Notes</span>
                            <textarea name="notes" value={formState.notes} onChange={handleInputChange} rows={2} style={{background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px'}} />
                        </label>

                        <div className="crud-modal-actions">
                            <button type="button" className="crud-action-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="crud-add-button">{editingId ? 'Update Booking' : 'Create Booking'}</button>
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
            <div className="crud-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setDeleteTarget(null)}>
                <div className="crud-modal-panel">
                    <div className="crud-modal-head">
                        <h2 style={{color: '#ef4444'}}>Confirm Deletion</h2>
                        <button type="button" className="crud-modal-close" onClick={() => setDeleteTarget(null)}>X</button>
                    </div>
                    <div className="crud-form" style={{marginTop: '10px', marginBottom: '20px'}}>
                        <p>Are you sure you want to delete booking <strong>&quot;#{deleteTarget.id}&quot;</strong>?</p>
                        <p style={{fontSize: '13px', color: '#94a3b8', marginTop: '8px'}}>This is irreversible.</p>
                    </div>
                    <div className="crud-modal-actions">
                        <button type="button" className="crud-action-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
                        <button type="button" className="crud-add-button crud-action-danger" style={{background: '#ef4444', color: 'white', border: 'none'}} onClick={proceedDelete}>Delete</button>
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
                    <h1 className="cyber-standalone-title">Bookings</h1>
                </div>
                <button type="button" className="crud-add-button" onClick={openAddModal}>Add New Booking</button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>FILTER BY:</span>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: 'inherit', borderRadius: '8px', cursor: 'pointer' }}>
                        <option value="all">All Bookings</option>
                        <option value="by_company">Specific Company</option>
                    </select>
                </div>
                {filterType === 'by_company' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: 'inherit', borderRadius: '8px', cursor: 'pointer' }}>
                            <option value="">-- Choose Company --</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Company</th>
                            <th>Schedule</th>
                            <th>Pricing</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map(b => (
                            <tr key={b.id}>
                                <td>{b.id}</td>
                                <td>{b.user_name}</td>
                                <td>{b.company_name}</td>
                                <td>
                                    <div>{b.booking_date}</div>
                                    <div style={{fontSize: '11px', color: '#94a3b8'}}>{b.start_time} ({b.hours}h)</div>
                                </td>
                                <td>
                                    <div>${b.total_price}</div>
                                    {Number(b.discount_applied) > 0 && <div style={{fontSize: '11px', color: '#fb7185'}}>-${b.discount_applied}</div>}
                                </td>
                                <td>
                                    <span style={{textTransform: 'capitalize'}} className={`crud-status-badge ${b.status === 'confirmed' || b.status === 'completed' ? 'crud-status-active' : b.status === 'pending' ? 'crud-status-pending' : 'crud-status-expired'}`}>
                                        {b.status}
                                    </span>
                                </td>
                                <td>
                                    <span style={{fontSize: '12px', fontWeight: 700, color: b.payment_status === 'paid' ? '#4ade80' : '#fb7185'}}>{b.payment_status.toUpperCase()}</span>
                                    <div style={{fontSize: '10px', color: '#94a3b8'}}>{b.payment_method}</div>
                                </td>
                                <td>
                                    <div className="crud-actions">
                                        {b.status === 'pending' && (
                                            <button type="button" className="crud-action-button" style={{color: '#4ade80'}} onClick={() => handleQuickConfirm(b)}>Confirm</button>
                                        )}
                                        <button type="button" className="crud-action-button" onClick={() => openEditModal(b)}>Edit</button>
                                        <button type="button" className="crud-action-button crud-action-danger" onClick={() => setDeleteTarget(b)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {loading && <div className="crud-loading">Syncing data...</div>}
            {renderModal()}
            {renderDeleteModal()}
            {toastMessage && <div className={toastType === 'error' ? 'crud-toast-error' : 'crud-toast-success'}>{toastMessage}</div>}
        </section>
    );
};

export default Bookings;
