import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import LineChart from '../LineChart';

describe('LineChart', () => {
    it('renders without crashing with empty data', () => {
        const { container } = render(<LineChart points={[]} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders points with valid data', () => {
        const { container } = render(
            <LineChart points={[
                { x: '2024-01-01', y: 3 },
                { x: '2024-01-08', y: 4 },
                { x: '2024-01-15', y: null },
            ]} />
        );
        expect(container.querySelectorAll('circle').length).toBe(2);
    });
});