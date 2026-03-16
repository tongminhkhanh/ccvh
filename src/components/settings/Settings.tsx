import React from 'react';
import { Wallet, HelpCircle, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { AppConfig } from '../../types';

interface SettingsProps {
    config: AppConfig;
    setConfig: (c: AppConfig) => void;
    handleSaveSettings: (updates: Partial<AppConfig>) => void;
}

export function Settings({ config, setConfig, handleSaveSettings }: SettingsProps) {
    return (
        <div className="space-y-6">
            {/* Fees Configuration */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-amber-600" />
                    Cấu hình các khoản phí
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Đơn giá 1 bữa ăn (VNĐ)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={config.mealPrice}
                                    onChange={(e) => handleSaveSettings({ mealPrice: Number(e.target.value) })}
                                    className="w-full p-3 bg-[#F1F5F9] border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#3A86FF] text-lg font-bold text-slate-900"
                                />
                                <span className="text-sm text-slate-500 whitespace-nowrap">đ/bữa</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phí trực trưa (VNĐ/ngày)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    value={config.supervisionFee}
                                    onChange={(e) => handleSaveSettings({ supervisionFee: Number(e.target.value) })}
                                    className="w-full p-3 bg-[#F1F5F9] border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#3A86FF] text-lg font-bold text-slate-900"
                                />
                                <span className="text-sm text-slate-500 whitespace-nowrap">đ/ngày</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phí công nấu (VNĐ/tháng cố định)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={config.cookingFee}
                                    onChange={(e) => handleSaveSettings({ cookingFee: Number(e.target.value) })}
                                    className="w-full p-3 bg-[#F1F5F9] border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#3A86FF] text-lg font-bold text-slate-900"
                                />
                                <span className="text-sm text-slate-500 whitespace-nowrap">đ/tháng</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 h-full">
                            <h4 className="font-bold text-[#3A86FF] mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5" />
                                Cách tính tiền hàng tháng
                            </h4>
                            <ul className="space-y-4 text-sm text-slate-600">
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#3A86FF] flex items-center justify-center flex-shrink-0 font-bold text-[10px]">1</div>
                                    <p>Mỗi ngày học sinh <strong>Vắng mặt</strong>, hệ thống tự động cộng dồn hoàn trả: <strong>{(config.mealPrice + config.supervisionFee).toLocaleString('vi-VN')}đ</strong>.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#3A86FF] flex items-center justify-center flex-shrink-0 font-bold text-[10px]">2</div>
                                    <p>Phí <strong>Công nấu</strong> ({(config.cookingFee).toLocaleString('vi-VN')}đ) là cố định hàng tháng.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-[#3A86FF] flex items-center justify-center flex-shrink-0 font-bold text-[10px]">3</div>
                                    <p>Nộp tháng tới = (Dự tính tháng tới) - (Dư tháng này).</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* UI Configuration */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-slate-600" />
                    Cấu hình giao diện
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Màu trạng thái "Có mặt"</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={config.colors.present}
                                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, present: e.target.value } })}
                                className="h-10 w-20 rounded cursor-pointer"
                            />
                            <div className="flex-1 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between"
                                style={{ backgroundColor: `${config.colors.present}15`, borderColor: `${config.colors.present}40` }}
                            >
                                <span className="font-bold" style={{ color: config.colors.present }}>Nguyễn Văn A</span>
                                <CheckCircle2 className="w-6 h-6" style={{ color: config.colors.present }} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setConfig({ mealPrice: 35000, supervisionFee: 5000, cookingFee: 150000, colors: { present: '#10b981', excused: '#f59e0b' } })}
                            className="text-sm text-slate-500 hover:text-[#3A86FF] underline"
                        >
                            Khôi phục mặc định
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
