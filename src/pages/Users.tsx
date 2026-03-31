import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createUser, deleteUser, getUsers, updateUser } from '../api/endpoints/users';
import { confirmDelete, showSuccess, showError } from '../utils/alerts';

type UserStatus = 'Active' | 'Inactive';
type User = { id: number; name: string; email: string; phone: string; role: string; status: UserStatus; };
type UserFormState = { name: string; email: string; phone: string; role: string; status: UserStatus; };

const emptyForm: UserFormState = { name: '', email: '', phone: '', role: 'User', status: 'Active', };

const Users: React.FC = () => {
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formState, setFormState] = useState<UserFormState>(emptyForm);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { list, meta } = await getUsers({ page });
            setData(list as User[]);
            setTotalPages(meta?.last_page || 1);
            setCurrentPage(meta?.current_page || 1);
        } catch (err) { showError('Sync failed'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(1); }, [fetchUsers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name || !formState.email) return;
        try {
            const payload = { ...formState, full_name: formState.name, is_active: formState.status === 'Active' };
            if (editingId) await updateUser(editingId, payload);
            else await createUser(payload);
            showSuccess(editingId ? 'User Updated' : 'User Created');
            setIsModalOpen(false);
            fetchUsers(currentPage);
        } catch (err) { showError('Save Failed'); }
    };

    const handleDelete = async (u: User) => {
        if (await confirmDelete(`Delete "${u.name}"?`)) {
            try {
                await deleteUser(u.id);
                showSuccess('User deleted');
                fetchUsers(currentPage);
            } catch (err) { showError('Failed'); }
        }
    };

    return (
        <section className="cyber-section-card">
            <div className="crud-page-header">
                <div><p className="cyber-page-kicker">Access Control</p><h1 className="cyber-standalone-title">Users</h1></div>
                <button className="crud-add-button" onClick={() => { setEditingId(null); setFormState(emptyForm); setIsModalOpen(true); }}>+ Create Account</button>
            </div>

            <div className="crud-table-wrap">
                <table className="crud-table">
                    <thead><tr><th>ID</th><th>User</th><th>Contact</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {data.map(u => (
                            <tr key={u.id}>
                                <td><span className="row-tag">#{u.id}</span></td>
                                <td><div className="row-main-text">{u.name}</div><div className="row-sub-text">{u.role}</div></td>
                                <td><div className="row-main-text">{u.email}</div><div className="row-sub-text">{u.phone}</div></td>
                                <td>{u.role}</td>
                                <td>
                                    <span className={`crud-status-badge ${u.status === 'Active' ? 'crud-status-active' : 'crud-status-inactive'}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="crud-actions">
                                        <button className="crud-action-button" onClick={() => { setEditingId(u.id); setFormState(u); setIsModalOpen(true); }}>Edit</button>
                                        <button className="crud-action-button crud-action-danger" onClick={() => handleDelete(u)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="crud-pagination">
                        <button disabled={currentPage === 1} onClick={() => fetchUsers(currentPage - 1)}>Prev</button>
                        <span>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => fetchUsers(currentPage + 1)}>Next</button>
                    </div>
                )}
            </div>
            {loading && <div className="crud-loading">Syncing...</div>}
            {isModalOpen && createPortal(
                <div className="crud-modal-overlay" onMouseDown={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="crud-modal-panel">
                        <div className="crud-modal-head"><h2>{editingId ? 'Modify' : 'New'} Account</h2><button className="crud-modal-close" onClick={() => setIsModalOpen(false)}>X</button></div>
                        <form className="crud-form" onSubmit={handleSubmit}>
                            <label className="crud-field"><span>Full Name</span><input name="name" value={formState.name} onChange={handleInputChange} required /></label>
                            <label className="crud-field"><span>Email Identity</span><input type="email" name="email" value={formState.email} onChange={handleInputChange} required /></label>
                            <div className="form-grid">
                                <label className="crud-field"><span>Phone</span><input name="phone" value={formState.phone} onChange={handleInputChange} /></label>
                                <label className="crud-field"><span>Role</span><select name="role" value={formState.role} onChange={handleInputChange}><option value="Admin">Admin</option><option value="Manager">Manager</option><option value="Staff">Staff</option><option value="User">User</option></select></label>
                            </div>
                            <label className="crud-field"><span>Status</span><select name="status" value={formState.status} onChange={handleInputChange}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
                            <div className="crud-modal-actions"><button type="button" className="crud-action-button" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="crud-add-button">Deploy Changes</button></div>
                        </form>
                    </div>
                </div>, document.body
            )}
        </section>
    );
};
export default Users;