import Swal from 'sweetalert2';

// Standard SweetAlert2 without react-content (which depends on React 18)
// This fixes the 'react-dom/client' not found error in React 17 projects.

export const confirmDelete = async (title: string, text = "This action cannot be undone!") => {
    const result = await Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: 'rgba(255,255,255,0.05)',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        background: '#131325',
        color: '#f8fafc',
        customClass: {
            popup: 'cyber-swal-popup',
            confirmButton: 'cyber-swal-confirm',
            cancelButton: 'cyber-swal-cancel'
        }
    });

    return result.isConfirmed;
};

export const showSuccess = (title: string, text?: string) => {
    Swal.fire({
        title,
        text,
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        background: '#131325',
        color: '#f8fafc',
        customClass: {
            popup: 'cyber-swal-popup'
        }
    });
};

export const showError = (title: string, text?: string) => {
    Swal.fire({
        title,
        text,
        icon: 'error',
        background: '#131325',
        color: '#f8fafc',
        customClass: {
            popup: 'cyber-swal-popup'
        }
    });
};

export default Swal;
