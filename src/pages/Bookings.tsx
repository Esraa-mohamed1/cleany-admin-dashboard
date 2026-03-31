import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getBookings, deleteBooking, updateBooking, createBooking } from '../api/endpoints/bookings';
import { getCompanies } from '../api/endpoints/companies';
import { confirmDelete, showSuccess, showError } from '../utils/alerts';

type Booking = {
    id: number; user_id: number; user_name: string; company_id: number; company_name: string;
    service_id: number; service_name: string | null; booking_date: string; start_time: string;
    hours: number; end_time: string; unit_price: string; discount_applied: number; total_price: string;
    status: string; payment_status: string; payment_method: string; address: string; notes: string;
    staff_id: number | null; staff_name: string | null;
};

type Option = { id: number; name: string };
type BookingFormState = {
    user_id: string; company_id: string; service_id: string; booking_date: string; start_time: string;
    end_time: string; hours: string; unit_price: string; discount_applied: string; total_price: string;
    status: string; payment_status: string; payment_method: string; address: string; notes: string; staff_id: string;
};

const emptyForm: BookingFormState = {
    user_id: '', company_id: '', service_id: '1', booking_date: '', start_time: '',
    end_time: '', hours: '1', unit_price: '0', discount_applied: '0', total_price: '0',
    status: 'pending', payment_status: 'unpaid', payment_method: 'card', address: '',
    notes: '', staff_id: '',
};

const Bookings: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [companies, setCompanies] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formState, setFormState] = useState<BookingFormState>(emptyForm);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [filterType, setFilterType] = useState<string>('all'); 
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchBookings = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: any = { page };
            if (filterType === 'by_company' && selectedCompanyId) params.company_id = selectedCompanyId;
            const { list, meta } = await getBookings(params);
            setBookings(list as Booking[]);
            setTotalPages(meta?.last_page || 1);
            setCurrentPage(meta?.current_page || 1);
        } catch (error) {
            showError('Sync Failed');
        } finally {
            setLoading(false);
        }
    }, [filterType, selectedCompanyId]);

    useEffect(() => { fetchBookings(1); }, [fetchBookings]);

    useEffect(() => {
        getCompanies().then(res => setCompanies(res.list as Option[]));
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrs: any = {};
        if (!formState.booking_date) newErrs.booking_date = 'Required';
        if (!formState.address) newErrs.address = 'Required';
        if (Object.keys(newErrs).length > 0) return setErrors(newErrs);

        try {
            if (editingId) await updateBooking(editingId, formState);
            else await createBooking(formState);
            showSuccess(editingId ? 'Updated' : 'Created');
            setIsModalOpen(false);
            fetchBookings(currentPage);
        } catch (error: any) {
            if (error.response?.data?.error) {
                const msgs = Object.values(error.response.data.error).flat().join(' | ');
                showError(msgs);
            } else {
                showError(error.response?.data?.message || 'Failed');
            }
        }
    };

    const handleDelete = async (b: Booking) => {
        if (await confirmDelete(`Cancel Booking #${b.id}?`)) {
            try {
                await deleteBooking(b.id);
                showSuccess('Cancelled');
                fetchBookings(currentPage);
            } catch (error) { showError('Failed'); }
        }
    };

    const handleQuickConfirm = async (b: Booking) => {
        try {
            await updateBooking(b.id, { status: 'confirmed' });
            showSuccess('Confirmed');
            fetchBookings(currentPage);
        } catch (error) { showError('Failed'); }
    };

    return (
        <section className="cyber-section-card">
            <div className="crud-page-header">
                <div><p className="cyber-page-kicker">Ops Hub</p><h1 className="cyber-standalone-title">Bookings</h1></div>
            </div>

            <div className="crud-filters-row">
                <div className="filter-item">
                    <span>Source:</span>
                    <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}>
                        <option value="all">Global</option>
                        <option value="by_company">By Company</option>
                    </select>
                </div>
                {filterType === 'by_company' && (
                    <select value={selectedCompanyId} onChange={e => { setSelectedCompanyId(e.target.value); setCurrentPage(1); }}>
                        <option value="">-- Company --</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead><tr><th>ID</th><th>User</th><th>Company</th><th>Schedule</th><th>Pricing</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {bookings.map(b => (
                            <tr key={b.id}>
                                <td><span className="row-tag">#{b.id}</span></td>
                                <td><div className="row-main-text">{b.user_name}</div><div className="row-sub-text">{b.address.substring(0,20)}...</div></td>
                                <td>{b.company_name}</td>
                                <td><div className="row-main-text">{b.booking_date}</div><div className="row-sub-text">{b.start_time} ({b.hours}h)</div></td>
                                <td><div className="row-main-text">${b.total_price}</div></td>
                                <td>
                                    <span className={`crud-status-badge ${b.status === 'confirmed' || b.status === 'completed' ? 'crud-status-active' : 'crud-status-pending'}`}>
                                        {b.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="crud-actions">
                                        {b.status === 'pending' && <button className="crud-action-button crud-action-confirm" onClick={() => handleQuickConfirm(b)}>Confirm</button>}
                                        <button className="crud-action-button" onClick={() => { setEditingId(b.id); setFormState({
            user_id: String(b.user_id),
            company_id: String(b.company_id),
            service_id: String(b.service_id),
            booking_date: b.booking_date,
            start_time: b.start_time,
            end_time: b.end_time || '',
            hours: String(b.hours),
            unit_price: String(b.unit_price || 0),
            discount_applied: String(b.discount_applied || 0),
            total_price: String(b.total_price || 0),
            status: b.status,
            payment_status: b.payment_status,
            payment_method: b.payment_method,
            address: b.address,
            notes: b.notes,
            staff_id: b.staff_id ? String(b.staff_id) : '',
        }); setIsModalOpen(true); }}>Edit</button>
                                        <button className="crud-action-button crud-action-danger" onClick={() => handleDelete(b)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="crud-pagination">
                        <button disabled={currentPage === 1} onClick={() => fetchBookings(currentPage - 1)}>Prev</button>
                        <span>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => fetchBookings(currentPage + 1)}>Next</button>
                    </div>
                )}
            </div>
            {loading && <div className="crud-loading">Syncing...</div>}
            {isModalOpen && createPortal(
                <div className="crud-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="crud-modal-panel" style={{maxWidth: '640px'}}>
                        <div className="crud-modal-head"><h2>{editingId ? 'Edit' : 'New'} Booking</h2><button className="crud-modal-close" onClick={() => setIsModalOpen(false)}>X</button></div>
                        <form className="crud-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <label className="crud-field"><span>User ID</span><input type="number" name="user_id" value={formState.user_id} onChange={handleInputChange} required /></label>
                                <label className="crud-field"><span>Company</span><select name="company_id" value={formState.company_id} onChange={handleInputChange}>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                            </div>
                            <div className="form-grid">
                                <label className="crud-field"><span>Date</span><input type="date" name="booking_date" value={formState.booking_date} onChange={handleInputChange} /></label>
                                <label className="crud-field"><span>Start Time</span><input type="time" name="start_time" value={formState.start_time} onChange={handleInputChange} /></label>
                                <label className="crud-field"><span>End Time</span><input type="time" name="end_time" value={formState.end_time} onChange={handleInputChange} required /></label>
                            </div>
                            <div className="form-grid">
                                <label className="crud-field"><span>Unit Price</span><input type="number" step="0.01" name="unit_price" value={formState.unit_price} onChange={handleInputChange} required /></label>
                                <label className="crud-field"><span>Discount</span><input type="number" step="0.01" name="discount_applied" value={formState.discount_applied} onChange={handleInputChange} required /></label>
                                <label className="crud-field"><span>Total Price</span><input type="number" step="0.01" name="total_price" value={formState.total_price} onChange={handleInputChange} required /></label>
                            </div>
                            <div className="form-grid">
                                <label className="crud-field"><span>Payment Method</span><input name="payment_method" value={formState.payment_method} onChange={handleInputChange} placeholder="card, cash, wallet..." required /></label>
                                <label className="crud-field"><span>Status</span><select name="status" value={formState.status} onChange={handleInputChange}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option></select></label>
                            </div>
                            <label className="crud-field"><span>Address</span><input name="address" value={formState.address} onChange={handleInputChange} /></label>
                            <label className="crud-field"><span>Notes</span><input name="notes" value={formState.notes} onChange={handleInputChange} /></label>
                            <div className="crud-modal-actions"><button type="button" className="crud-action-button" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="crud-add-button">Save</button></div>
                        </form>
                    </div>
                </div>, document.body
            )}
        </section>
    );
};
export default Bookings;
