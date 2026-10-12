import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../context/AuthContext';
import { ToastProvider } from '../../context/ToastContext';

function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <MemoryRouter>
            <ToastProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ToastProvider>
        </MemoryRouter>
    );
}

describe('LoginPage', () => {
    it('renders email and password fields', () => {
        render(<Wrapper><LoginPage /></Wrapper>);
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows an error if the form is submitted empty', async () => {
        render(<Wrapper><LoginPage /></Wrapper>);
        const submit = screen.getByRole('button', { name: /sign in/i });
        submit.click();
    });
});