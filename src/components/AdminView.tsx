import { useState } from 'react';
import { Grade, Category, AudioItem } from '../types';
import { ArrowLeft, Save, Plus, Minus } from 'lucide-react';

interface AdminViewProps {
  grades: Grade[];
  onSave: (grades: Grade[]) => void;
  onBack: () => void;
}

export default function AdminView({ grades: initialGrades, onSave, onBack }: AdminViewProps) {
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAudioChange = (gradeId: number, audioId: string, field: keyof AudioItem, value: string) => {
    setGrades(grades.map(g => {
      if (g.id === gradeId) {
        return {
          ...g,
          audios: g.audios.map(a => a.id === audioId ? { ...a, [field]: value } : a)
        };
      }
      return g;
    }));
  };

  const handleAddAudio = (gradeId: number) => {
    setGrades(grades.map(g => {
      if (g.id === gradeId) {
        return {
          ...g,
          audios: [...g.audios, { id: crypto.randomUUID(), title: '', url: '' }]
        };
      }
      return g;
    }));
  };

  const handleRemoveAudio = (gradeId: number, audioId: string) => {
    setGrades(grades.map(g => {
      if (g.id === gradeId) {
        return {
          ...g,
          audios: g.audios.filter(a => a.id !== audioId)
        };
      }
      return g;
    }));
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 md:mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 md:w-6 md:h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Quản trị File Nghe</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 w-full sm:w-auto"
          >
            <Save size={18} className="md:w-5 md:h-5" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {(['PRIMARY', 'SECONDARY', 'HIGH'] as Category[]).map((cat) => {
            const catGrades = grades.filter(g => g.category === cat);
            const catLabel = cat === 'PRIMARY' ? 'TIỂU HỌC' : cat === 'SECONDARY' ? 'THCS' : 'THPT';
            const catColor = cat === 'PRIMARY' ? 'text-blue-600' : cat === 'SECONDARY' ? 'text-green-600' : 'text-purple-600';

            return (
              <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className={`bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2`}>
                  <div className={`w-3 h-3 rounded-full ${cat === 'PRIMARY' ? 'bg-blue-600' : cat === 'SECONDARY' ? 'bg-green-600' : 'bg-purple-600'}`}></div>
                  <h2 className={`font-bold uppercase tracking-wider ${catColor}`}>{catLabel}</h2>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-4 font-semibold text-gray-700 w-24">Khối</th>
                        <th className="p-4 font-semibold text-gray-700">Danh sách File Nghe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catGrades.map((grade) => (
                        <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-medium text-gray-900 align-top">{grade.name}</td>
                          <td className="p-4">
                            <div className="space-y-3">
                              {grade.audios.map((audio) => (
                                <div key={audio.id} className="flex items-start gap-3">
                                  <div className="flex-1 grid grid-cols-2 gap-3">
                                    <input 
                                      type="text" 
                                      value={audio.title}
                                      onChange={(e) => handleAudioChange(grade.id, audio.id, 'title', e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Tiêu đề hiển thị (Màu đỏ)"
                                    />
                                    <input 
                                      type="text" 
                                      value={audio.url}
                                      onChange={(e) => handleAudioChange(grade.id, audio.id, 'url', e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Link File Audio (MP3/WAV)"
                                    />
                                  </div>
                                  <button 
                                    onClick={() => handleRemoveAudio(grade.id, audio.id)} 
                                    className="p-2 mt-0.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Xóa file này"
                                  >
                                    <Minus size={20} />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => handleAddAudio(grade.id)} 
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              >
                                <Plus size={18} /> Thêm file nghe
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {catGrades.map((grade) => (
                    <div key={grade.id} className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-600 text-lg">{grade.name}</span>
                      </div>
                      <div className="space-y-4">
                        {grade.audios.map((audio, index) => (
                          <div key={audio.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3 relative">
                            <div className="absolute top-2 right-2">
                              <button 
                                onClick={() => handleRemoveAudio(grade.id, audio.id)} 
                                className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                              >
                                <Minus size={18} />
                              </button>
                            </div>
                            <div className="space-y-1 pr-8">
                              <label className="text-xs font-semibold text-gray-500 uppercase">Tiêu đề {index + 1}</label>
                              <input 
                                type="text" 
                                value={audio.title}
                                onChange={(e) => handleAudioChange(grade.id, audio.id, 'title', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tiêu đề bài nghe"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-500 uppercase">Link Audio {index + 1}</label>
                              <input 
                                type="text" 
                                value={audio.url}
                                onChange={(e) => handleAudioChange(grade.id, audio.id, 'url', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => handleAddAudio(grade.id)} 
                          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                        >
                          <Plus size={18} /> Thêm file nghe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Text */}
      <div className="fixed bottom-2 right-4 z-50 text-white text-xs md:text-sm font-medium pointer-events-none drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
        © Design by TuanTM
      </div>
    </div>
  );
}
