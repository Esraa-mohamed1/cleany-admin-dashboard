import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getBookings, deleteBooking } from '../api/endpoints/bookings';
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
    transaction_id: string;
    created_at: string;
};

type CompanyOption = { id: number; name: string };
type ToastType = 'success' | 'error';

const Bookings: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('success');
    
    // Deletion Modal state
    const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
    
    // Filtering states
    const [filterType, setFilterType] = useState<string>('all'); // all, by_company
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

    const fetchCompanies = async () => {
        try {
            const res = await getCompanies();
            setCompanies(res.list as CompanyOption[]);
        } catch (error) {
            console.error('Failed to fetch companies', error);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchCompanies();
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

    const confirmDelete = (booking: Booking) => {
        setDeleteTarget(booking);
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
                        >
                            X
                        </button>
                    </div>
                    <div className="crud-form" style={{marginTop: '10px', marginBottom: '20px'}}>
                        <p>Are you sure you want to delete booking <strong>#{deleteTarget.id}</strong> (User: {deleteTarget.user_name})?</p>
                        <p style={{fontSize: '13px', color: '#94a3b8', marginTop: '8px'}}>This action is irreversible.</p>
                    </div>
                    <div className="crud-modal-actions">
                        <button type="button" className="crud-action-button" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </button>
                        <button type="button" className="crud-add-button crud-action-danger" style={{background: '#ef4444', color: 'white', border: 'none'}} onClick={proceedDelete}>
                            Delete
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
                    <h1 className="cyber-standalone-title">Bookings</h1>
                </div>
            </div>

            {/* Two-step Filtering */}
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
                        <option value="all">All Bookings</option>
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
                            <th>ID</th>
                            <th>User</th>
                            <th>Company</th>
                            <th>Date / Time</th>
                            <th>Duration</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Staff</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map((b) => (
                            <tr key={b.id}>
                                <td>{b.id}</td>
                                <td>{b.user_name}</td>
                                <td>{b.company_name}</td>
                                <td>
                                    <div>{b.booking_date}</div>
                                    <div style={{fontSize: '11px', color: '#94a3b8'}}>{b.start_time} - {b.end_time}</div>
                                </td>
                                <td>{b.hours} hrs</td>
                                <td>
                                    <div>${b.total_price}</div>
                                    {Number(b.discount_applied) > 0 && (
                                        <div style={{fontSize: '11px', color: '#fb7185'}}>-${b.discount_applied} off</div>
                                    )}
                                </td>
                                <td>
                                    <span style={{textTransform: 'capitalize'}}
                                        className={`crud-status-badge ${
                                            b.status === 'confirmed' || b.status === 'completed'
                                                ? 'crud-status-active'
                                                : b.status === 'pending'
                                                ? 'crud-status-pending'
                                                : 'crud-status-expired'
                                        }`}
                                    >
                                        {b.status}
                                    </span>
                                </td>
                                <td>
                                    <span style={{fontSize: '12px', fontWeight: 700, color: b.payment_status === 'paid' ? '#4ade80' : '#fb7185'}}>
                                        {b.payment_status.toUpperCase()}
                                    </span>
                                    <div style={{fontSize: '10px', color: '#94a3b8'}}>{b.payment_method}</div>
                                </td>
                                <td>{b.staff_name || '-'}</td>
                                <td>
                                    <div className="crud-actions">
                                        <button
                                            type="button"
                                            className="crud-action-button crud-action-danger"
                                            onClick={() => confirmDelete(b)}
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

            {loading && <div className="crud-loading">Syncing bookings...</div>}
            {renderDeleteModal()}

            {toastMessage && (
                <div className={toastType === 'error' ? 'crud-toast-error' : 'crud-toast-success'}>
                    {toastMessage}
                </div>
            )}
        </section>
    );
};

export default Bookings;
