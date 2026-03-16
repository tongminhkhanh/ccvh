export const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
    } catch {
        return dateStr;
    }
};
