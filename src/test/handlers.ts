import { http, HttpResponse } from 'msw';

export const handlers = [
    http.get('/api/students', () => {
        return HttpResponse.json([
            { id: 1, name: 'Student 1', student_code: 'S1', class_name: '1A', balance: 100000, active: 1 }
        ]);
    }),
    http.get('/api/stats', () => {
        return HttpResponse.json({ totalStudents: 1, presentToday: 0, absentToday: 1 });
    }),
    http.get('/api/attendance/:date', () => {
        return HttpResponse.json([]);
    }),
    http.get('/api/reports', () => {
        return HttpResponse.json([]);
    }),
    http.get('/api/payments', () => {
        return HttpResponse.json({ payments: [], stats: {} });
    })
];
