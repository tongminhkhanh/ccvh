import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, ArrowUpRight } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export function AIChatPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const quickSuggestions = [
        '📊 Báo cáo hôm nay',
        '❓ Ai vắng nhiều nhất tháng này?',
        '💰 Tổng tiền ăn tháng này',
        '📝 Soạn báo cáo gửi phụ huynh',
    ];

    const fetchAppData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const month = today.substring(0, 7);
            const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

            const [studentsRes, statsRes, attendanceRes, reportsRes, paymentsRes] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/stats'),
                fetch(`/api/attendance/${today}`),
                fetch(`/api/reports?start=${sevenDaysAgo}&end=${today}`),
                fetch(`/api/payments?month=${month}`).catch(() => null),
            ]);

            const students = await studentsRes.json();
            const stats = await statsRes.json();
            const attendance = await attendanceRes.json();
            const reports = await reportsRes.json();
            let payments: any[] = [];
            if (paymentsRes && paymentsRes.ok) {
                const pData = await paymentsRes.json();
                payments = pData.payments || pData || [];
            }

            return `
DỮ LIỆU HỆ THỐNG CHẤM ĂN LỚP CÔ VIỆT HỒNG (cập nhật ${today}):

TỔNG QUAN HÔM NAY:
- Tổng số học sinh: ${stats.totalStudents}
- Có ăn hôm nay: ${stats.presentToday}
- Vắng hôm nay: ${stats.absentToday}

DANH SÁCH HỌC SINH:
${students.map((s: any) => `- ${s.name} (Mã: ${s.student_code}, Lớp: ${s.class_name})`).join('\n')}

ĐIỂM DANH HÔM NAY (${today}) - Những bạn CÓ ĂN:
${attendance.length > 0 ? attendance.map((a: any) => `- ${a.name}`).join('\n') : '(Chưa điểm danh hôm nay)'}

BÁO CÁO 7 NGÀY GẦN NHẤT:
${reports.map((r: any) => `- ${r.date}: Có ăn ${r.present}/${r.total} bạn`).join('\n')}

THANH TOÁN THÁNG ${month}:
${payments.length > 0 ? payments.map((p: any) => `- ${p.name}: ${p.total_meals} bữa, ${Number(p.amount).toLocaleString('vi-VN')}đ, ${p.paid ? 'Đã thu' : 'Chưa thu'}`).join('\n') : '(Chưa có dữ liệu thanh toán)'}
`.trim();
        } catch {
            return 'Không thể tải dữ liệu. Vui lòng thử lại.';
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const appData = await fetchAppData();
            const apiKey = (import.meta as any).env?.VITE_CLIPROXY_TOKEN || (process.env as any).VITE_CLIPROXY_TOKEN || '';
            const apiEndpoint = (import.meta as any).env?.VITE_CLIPROXY_API || (process.env as any).VITE_CLIPROXY_API || 'http://localhost:3000/v1';

            const systemPrompt = `Bạn là trợ lý AI của hệ thống chấm ăn "LunchPop" – lớp cô Việt Hồng.
Quy tắc:
- Trả lời bằng tiếng Việt, thân thiện, xưng "em" gọi "cô".
- TRÌNH BÀY KHOA HỌC, CHUYÊN NGHIỆP. TUYỆT ĐỐI KHÔNG sử dụng emoji hay biểu tượng cảm xúc.
- KHÔNG sử dụng ký tự hoa thị (*) để in đậm hay làm dấu đầu dòng. Hãy dùng dấu gạch ngang (-) hoặc số thứ tự (1. 2.) để liệt kê.
- KHÔNG sử dụng các ký tự đặc biệt lộn xộn.
- Nếu cô hỏi soạn tin nhắn gửi phụ huynh, hãy soạn sẵn đoạn văn bản chỉn chu, chuyên nghiệp để cô copy dán vào Zalo.
- Chỉ trả lời dựa trên DỮ LIỆU THẬT được cung cấp, không bịa số liệu.
- Nếu không có đủ dữ liệu, hãy báo cáo rõ.

${appData}`;

            const historyForAPI = messages.slice(-6).map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
            }));

            const response = await fetch(`${apiEndpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...historyForAPI,
                        { role: 'user', content: text.trim() },
                    ],
                    max_tokens: 1000,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();
            const aiText = data?.choices?.[0]?.message?.content || 'Xin lỗi, em không thể trả lời lúc này. Cô thử lại nhé!';

            setMessages((prev) => [...prev, { role: 'ai', content: aiText, timestamp: new Date() }]);
        } catch {
            setMessages((prev) => [...prev, { role: 'ai', content: '❌ Có lỗi kết nối. Cô thử lại nhé!', timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, idx: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        });
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center overflow-hidden border-2 border-white/50"
                style={{ background: 'linear-gradient(135deg, #3A86FF 0%, #6366f1 100%)' }}
                title="Trợ lý AI"
            >
                <img src="/chat-bot-icon.png" alt="AI Chat" className="w-10 h-10 rounded-full object-cover" />
            </button>

            {/* Chat Popup */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-4 z-[9999] w-[360px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
                        style={{ height: 'min(520px, calc(100vh - 140px))' }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center gap-3 px-4 py-3 border-b border-slate-100"
                            style={{ background: 'linear-gradient(135deg, #3A86FF 0%, #6366f1 100%)' }}
                        >
                            <img src="/chat-bot-icon.png" alt="" className="w-8 h-8 rounded-full border-2 border-white/30" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-white">Trợ lý cô Việt Hồng</h3>
                                <p className="text-[11px] text-blue-100">Hỏi bất kỳ điều gì về dữ liệu lớp</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                            {messages.length === 0 && (
                                <div className="text-center py-6">
                                    <img src="/chat-bot-icon.png" alt="" className="w-14 h-14 mx-auto mb-3 rounded-full opacity-80" />
                                    <p className="text-sm text-slate-500 mb-4">Xin chào cô! Em có thể giúp gì ạ? 😊</p>
                                    <div className="space-y-2">
                                        {quickSuggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendMessage(s)}
                                                className="block w-full text-left text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#3A86FF] text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                        {msg.role === 'ai' && (
                                            <button
                                                onClick={() => copyToClipboard(msg.content, i)}
                                                className="mt-1.5 text-[10px] text-slate-400 hover:text-blue-500 transition flex items-center gap-1"
                                            >
                                                {copiedIdx === i ? '✅ Đã copy!' : '📋 Copy'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage(input);
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi gì đó..."
                                    className="flex-1 text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 bg-[#3A86FF] text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
