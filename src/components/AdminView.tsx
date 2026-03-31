import { useState } from 'react';
import { Grade } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

interface AdminViewProps {
  grades: Grade[];
  onSave: (grades: Grade[]) => void;
  onBack: () => void;
}

export default function AdminView({ grades: initialGrades, onSave, onBack }: AdminViewProps) {
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (id: number, field: keyof Grade, value: string) => {
    setGrades(grades.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleSave = () => {
    setIsSaving(true);
    onSave(grades);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Đã lưu thành công!
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Quản trị File Nghe</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            <Save size={20} />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-700 w-24">Khối</th>
                  <th className="p-4 font-semibold text-gray-700 w-1/3">Tiêu đề hiển thị (Màu đỏ)</th>
                  <th className="p-4 font-semibold text-gray-700">Link File Audio (MP3/WAV)</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{grade.name}</td>
                    <td className="p-4">
                      <input 
                        type="text" 
                        value={grade.title}
                        onChange={(e) => handleChange(grade.id, 'title', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VD: 25.11.ĐG03.IE.Listening Audio"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="text" 
                        value={grade.audioUrl}
                        onChange={(e) => handleChange(grade.id, 'audioUrl', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/audio.mp3"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
