import { renderHook, waitFor } from '@testing-library/react';
import { useAppData } from '../useAppData';
import { describe, it, expect } from 'vitest';

describe('useAppData Hook', () => {
    it('should fetch initial data correctly', async () => {
        const { result } = renderHook(() => useAppData());

        // Initially loading should be true then false
        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Data should be populated from MSW handlers
        expect(result.current.students).toHaveLength(1);
        expect(result.current.students[0].name).toBe('Student 1');
        expect(result.current.stats.totalStudents).toBe(1);
    });

    it('should calculate financialAnalytics correctly', async () => {
        const { result } = renderHook(() => useAppData());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.financialAnalytics).toBeDefined();
        expect(result.current.financialAnalytics.forecast?.activeStudents).toBe(1);
        // 1 student * 35000 * 22 days = 770,000
        expect(result.current.financialAnalytics.forecast?.nextMonth).toBe(770000);
    });
});
