import React, { useEffect, useState, useCallback } from 'react';
import { deleteTransaction, getTransactions } from '../api/endpoints/transactions';
import { confirmDelete, showSuccess, showError } from '../utils/alerts';

type Transaction = {
    id: number; user_id: number | null; user_name: string | null; transaction_id: string;
    order_id: number | null; amount: string; type: string; payment_method: string;
    status: string; notes: string | null; created_at?: string | null;
};

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTransactions = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { list, meta } = await getTransactions({ page });
            setTransactions(list as Transaction[]);
            setTotalPages(meta?.last_page || 1);
            setCurrentPage(meta?.current_page || 1);
        } catch (error) { showError('Failed to sync logs'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);

    const handleDelete = async (tx: Transaction) => {
        if (await confirmDelete(`Wipe Transaction #${tx.transaction_id || tx.id}?`)) {
            try {
                await deleteTransaction(tx.id);
                showSuccess('Purged Successfully');
                fetchTransactions(currentPage);
            } catch (error) { showError('Failed to delete'); }
        }
    };

    return (
        <section className="cyber-section-card">
            <div className="crud-page-header">
                <div><p className="cyber-page-kicker">Finance Ledger</p><h1 className="cyber-standalone-title">Transactions</h1></div>
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead><tr><th>ID</th><th>User Identity</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id}>
                                <td><span className="row-tag">#{tx.id}</span></td>
                                <td>
                                    <div className="row-main-text">{tx.user_name || 'Anonymous'}</div>
                                    <div className="row-sub-text">{tx.transaction_id || 'NO_ID'}</div>
                                </td>
                                <td><div className="row-main-text" style={{color: '#4ade80'}}>${tx.amount}</div></td>
                                <td><div className="row-tag">{tx.payment_method.toUpperCase()}</div></td>
                                <td>
                                    <span className={`crud-status-badge ${tx.status === 'success' || tx.status === 'completed' ? 'crud-status-active' : 'crud-status-pending'}`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="crud-actions">
                                        <button className="crud-action-button crud-action-danger" onClick={() => handleDelete(tx)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="crud-pagination">
                        <button disabled={currentPage === 1} onClick={() => fetchTransactions(currentPage - 1)}>Prev</button>
                        <span>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => fetchTransactions(currentPage + 1)}>Next</button>
                    </div>
                )}
            </div>
            {loading && <div className="crud-loading">Syncing...</div>}
        </section>
    );
};
export default Transactions;
