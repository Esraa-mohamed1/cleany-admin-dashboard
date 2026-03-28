import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    deleteTransaction,
    getTransactions,
} from '../api/endpoints/transactions';

type Transaction = {
    id: number;
    user_id: number | null;
    user_name: string | null;
    transaction_id: string;
    order_id: number | null;
    amount: string;
    type: string;
    payment_method: string;
    status: string;
    notes: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type ToastType = 'success' | 'error';

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
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

    const fetchTransactions = async () => {
        try {
            const { list } = await getTransactions();
            setTransactions(list as Transaction[]);
        } catch (error) {
            showToast('Failed to fetch transactions', 'error');
        }
    };

    useEffect(() => {
        fetchTransactions();
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

    const confirmDelete = (tx: Transaction) => {
        setDeleteTarget(tx);
    };

    const proceedDelete = async () => {
        if (!deleteTarget) return;

        try {
            await deleteTransaction(deleteTarget.id);
            showToast('Transaction deleted successfully');
            await fetchTransactions();
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
                            aria-label="Close modal"
                        >
                            X
                        </button>
                    </div>
                    <div className="crud-form" style={{marginTop: '10px', marginBottom: '20px'}}>
                        <p>Are you sure you want to delete transaction <strong>&quot;{deleteTarget.transaction_id || deleteTarget.id}&quot;</strong>?</p>
                        <p style={{fontSize: '13px', color: '#94a3b8', marginTop: '8px'}}>This action cannot be undone.</p>
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
                    <h1 className="cyber-standalone-title">Transactions</h1>
                </div>
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User Name</th>
                            <th>User ID</th>
                            <th>TXN ID</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id}>
                                <td>{tx.id}</td>
                                <td>{tx.user_name || '-'}</td>
                                <td>{tx.user_id || '-'}</td>
                                <td>{tx.transaction_id || '-'}</td>
                                <td>${tx.amount}</td>
                                <td style={{textTransform: 'capitalize'}}>{tx.type}</td>
                                <td style={{textTransform: 'capitalize'}}>{tx.payment_method}</td>
                                <td>
                                    <span
                                        className={`crud-status-badge ${
                                            tx.status === 'success' || tx.status === 'completed'
                                                ? 'crud-status-active'
                                                : tx.status === 'failed' || tx.status === 'cancelled'
                                                ? 'crud-status-expired'
                                                : 'crud-status-pending'
                                        }`}
                                    >
                                        {tx.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="crud-actions">
                                        <button
                                            type="button"
                                            className="crud-action-button crud-action-danger"
                                            onClick={() => confirmDelete(tx)}
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

            {renderDeleteModal()}

            {toastMessage ? (
                <div className={toastType === 'error' ? 'crud-toast-error' : 'crud-toast-success'}>
                    {toastMessage}
                </div>
            ) : null}
        </section>
    );
};

export default Transactions;
