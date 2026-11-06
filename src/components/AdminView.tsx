import { useState, useEffect, useMemo, useRef, ChangeEvent } from 'react';
import { Grade, Category, AudioItem, BackupEntry } from '../types';
import { getGradesSignature, countValidLinks, normalizeGrades } from '../App';
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  History,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Download,
  Upload,
  X,
} from 'lucide-react';

interface AdminViewProps {
  grades: Grade[];
  backups: BackupEntry[];
  isSyncingServer: boolean;
  lastSyncedAt: number | null;
  serverError: string | null;
  onSave: (grades: Grade[]) => Promise<void>;
  onBack: () => void;
}

export default function AdminView({
  grades: initialGrades,
  backups,
  isSyncingServer,
  lastSyncedAt,
  serverError,
  onSave,
  onBack,
}: AdminViewProps) {
  const [grades, setGrades] = useState<Grade[]>(() => normalizeGrades(initialGrades, false));
  const [baselineSig, setBaselineSig] = useState<string>(() => getGradesSignature(initialGrades));
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Đã lưu thành công lên máy chủ!');
  const [saveErrorModal, setSaveErrorModal] = useState<string | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSig = useMemo(() => getGradesSignature(grades), [grades]);
  const isDirty = currentSig !== baselineSig;
  const totalActiveLinks = useMemo(() => countValidLinks(grades), [grades]);

  // Keep local state in sync with initialGrades from Firebase ONLY when user has no unsaved edits
  useEffect(() => {
    const incomingSig = getGradesSignature(initialGrades);
    if (!isDirty && incomingSig !== baselineSig) {
      setGrades(normalizeGrades(initialGrades, false));
      setBaselineSig(incomingSig);
    }
  }, [initialGrades, isDirty, baselineSig]);

  // Warn user before closing/refreshing browser tab if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleAudioChange = (
    gradeId: number,
    audioId: string,
    field: keyof AudioItem,
    value: string
  ) => {
    setGrades((prev) =>
      prev.map((g) => {
        if (g.id === gradeId) {
          const updatedAudios = g.audios.map((a) =>
            a.id === audioId ? { ...a, [field]: value } : a
          );
          return {
            ...g,
            title: updatedAudios[0]?.title || g.title,
            audioUrl: updatedAudios[0]?.url || '',
            audios: updatedAudios,
          };
        }
        return g;
      })
    );
  };

  const handleAddAudio = (gradeId: number) => {
    setGrades((prev) =>
      prev.map((g) => {
        if (g.id === gradeId) {
          return {
            ...g,
            audios: [
              ...g.audios,
              {
                id: `audio-${gradeId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                title: `Tiêu đề bài nghe khối ${gradeId} (${g.audios.length + 1})`,
                url: '',
              },
            ],
          };
        }
        return g;
      })
    );
  };

  const handleRemoveAudio = (gradeId: number, audioId: string) => {
    setGrades((prev) =>
      prev.map((g) => {
        if (g.id === gradeId) {
          if (g.audios.length <= 1) {
            // Keep 1 empty input row instead of leaving the grade with 0 rows
            const resetAudios = [
              {
                id: g.audios[0]?.id || `audio-${gradeId}-${Date.now()}`,
                title: `Tiêu đề bài nghe khối ${gradeId}`,
                url: '',
              },
            ];
            return {
              ...g,
              title: resetAudios[0].title,
              audioUrl: '',
              audios: resetAudios,
            };
          }
          const filtered = g.audios.filter((a) => a.id !== audioId);
          return {
            ...g,
            title: filtered[0]?.title || `Tiêu đề bài nghe khối ${gradeId}`,
            audioUrl: filtered[0]?.url || '',
            audios: filtered,
          };
        }
        return g;
      })
    );
  };

  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3500);
  };

  const handleSave = async (exitAfterSave = false) => {
    setIsSaving(true);
    setSaveErrorModal(null);
    try {
      const cleaned = normalizeGrades(grades, true);
      await onSave(cleaned);
      setGrades(cleaned);
      setBaselineSig(getGradesSignature(cleaned));
      triggerToast('Đã lưu và đồng bộ thành công lên máy chủ!');
      if (exitAfterSave) {
        setShowUnsavedModal(false);
        onBack();
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      setSaveErrorModal(
        error?.message ||
          'Không thể lưu dữ liệu lên máy chủ Firebase. Vui lòng kiểm tra kết nối mạng hoặc quyền ghi (Rules) trong Firebase Console.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackClick = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      onBack();
    }
  };

  const handleRestoreBackup = async (backup: BackupEntry) => {
    const restored = normalizeGrades(backup.grades, true);
    setGrades(restored);
    setShowBackupModal(false);
    setIsSaving(true);
    try {
      await onSave(restored);
      setBaselineSig(getGradesSignature(restored));
      triggerToast(
        `Đã khôi phục và lưu bản sao lưu (${backup.totalLinks} link) thành công!`
      );
    } catch (error: any) {
      // Even if cloud save fails, keep restored data in editor so user can see/export it
      setSaveErrorModal(
        `Đã nạp dữ liệu khôi phục vào màn hình nhưng chưa lưu được lên máy chủ: ${
          error?.message || 'Lỗi kết nối'
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const cleaned = normalizeGrades(grades, true);
    const payload = {
      exportedAt: new Date().toISOString(),
      totalLinks: countValidLinks(cleaned),
      grades: cleaned,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nshm-file-nghe-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        const importedGrades = Array.isArray(parsed) ? parsed : parsed.grades;
        if (!Array.isArray(importedGrades)) {
          setSaveErrorModal('File dự phòng không đúng định dạng.');
          return;
        }
        const normalized = normalizeGrades(importedGrades, true);
        setGrades(normalized);
        setShowBackupModal(false);
        triggerToast(
          `Đã nạp ${countValidLinks(normalized)} link từ file dự phòng. Hãy bấm "Lưu thay đổi" để áp dụng!`
        );
      } catch {
        setSaveErrorModal('Không thể đọc file JSON. Vui lòng kiểm tra lại file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatTime = (ts: number) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleString();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 relative">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2.5 z-50">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Sticky Top Header */}
        <div className="sticky top-2 z-30 flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 md:mb-8 bg-white/95 backdrop-blur p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
          <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
            <button
              onClick={handleBackClick}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              title="Quay lại trang chính"
            >
              <ArrowLeft size={20} className="text-slate-700 md:w-6 md:h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                Quản trị File Nghe
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-0.5 tabular-nums">
                <span>Đang có {totalActiveLinks} link file nghe</span>
                <span aria-hidden="true">·</span>
                {isSyncingServer ? (
                  <span>Đang đồng bộ máy chủ...</span>
                ) : serverError ? (
                  <span className="text-red-600 font-medium">
                    Lỗi kết nối máy chủ
                  </span>
                ) : lastSyncedAt ? (
                  <span>Đồng bộ lúc {formatTime(lastSyncedAt)}</span>
                ) : (
                  <span>Dữ liệu cục bộ</span>
                )}
                {isDirty && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-600 font-semibold">
                      Có thay đổi chưa lưu
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowBackupModal(true)}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <History size={17} />
              <span>Sao lưu & Khôi phục ({backups.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-70 whitespace-nowrap shrink-0 ${
                isDirty
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-sm'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save size={18} />
              <span>
                {isSaving
                  ? 'Đang lưu lên máy chủ...'
                  : isDirty
                  ? 'Lưu thay đổi ngay'
                  : 'Lưu thay đổi'}
              </span>
            </button>
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {isDirty && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-amber-900">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <span>
                Bạn vừa chỉnh sửa hoặc chèn link mới. Vui lòng bấm{' '}
                <strong>Lưu thay đổi ngay</strong> để ghi dữ liệu lên máy chủ.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition-colors whitespace-nowrap shrink-0"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu ngay'}
            </button>
          </div>
        )}

        {/* Grade Sections */}
        <div className="space-y-8">
          {(['PRIMARY', 'SECONDARY', 'HIGH'] as Category[]).map((cat) => {
            const catGrades = grades.filter((g) => g.category === cat);
            const catLabel =
              cat === 'PRIMARY'
                ? 'TIỂU HỌC (KHỐI 1 - KHỐI 5)'
                : cat === 'SECONDARY'
                ? 'THCS (KHỐI 6 - KHỐI 9)'
                : 'THPT (KHỐI 10 - KHỐI 12)';
            const catColor =
              cat === 'PRIMARY'
                ? 'text-blue-700'
                : cat === 'SECONDARY'
                ? 'text-emerald-700'
                : 'text-indigo-700';

            return (
              <div
                key={cat}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h2 className={`font-bold tracking-wide text-sm md:text-base ${catColor}`}>
                    {catLabel}
                  </h2>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {countValidLinks(catGrades)} link đã nhập
                  </span>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-200">
                        <th className="p-4 font-semibold text-slate-700 w-32 text-sm">
                          Khối
                        </th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">
                          Danh sách File Nghe (Tiêu đề & Đường dẫn MP3/WAV)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {catGrades.map((grade) => {
                        const activeGradeLinks = grade.audios.filter(
                          (a) => a.url && a.url.trim() !== ''
                        ).length;
                        return (
                          <tr
                            key={grade.id}
                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="p-4 align-top">
                              <div className="font-bold text-slate-900">
                                {grade.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 tabular-nums">
                                {activeGradeLinks > 0
                                  ? `${activeGradeLinks} link có sẵn`
                                  : 'Chưa có link'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-3">
                                {grade.audios.map((audio) => {
                                  const hasUrl = Boolean(audio.url && audio.url.trim());
                                  return (
                                    <div
                                      key={audio.id}
                                      className="flex items-start gap-3"
                                    >
                                      <div className="flex-1 grid grid-cols-2 gap-3">
                                        <input
                                          type="text"
                                          value={audio.title}
                                          onChange={(e) =>
                                            handleAudioChange(
                                              grade.id,
                                              audio.id,
                                              'title',
                                              e.target.value
                                            )
                                          }
                                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                          placeholder="Tiêu đề hiển thị (Màu đỏ)"
                                        />
                                        <input
                                          type="text"
                                          value={audio.url}
                                          onChange={(e) =>
                                            handleAudioChange(
                                              grade.id,
                                              audio.id,
                                              'url',
                                              e.target.value
                                            )
                                          }
                                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            hasUrl
                                              ? 'border-emerald-300 bg-emerald-50/30 text-slate-900'
                                              : 'border-slate-300 bg-white text-slate-800'
                                          }`}
                                          placeholder="Link File Audio (https://... .mp3 / .wav)"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveAudio(grade.id, audio.id)
                                        }
                                        className="p-2 mt-0.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                        title={
                                          grade.audios.length <= 1
                                            ? 'Xóa trắng dòng này'
                                            : 'Xóa file nghe này'
                                        }
                                      >
                                        <Minus size={18} />
                                      </button>
                                    </div>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => handleAddAudio(grade.id)}
                                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                  <Plus size={16} />
                                  <span>Thêm file nghe</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {catGrades.map((grade) => {
                    const activeGradeLinks = grade.audios.filter(
                      (a) => a.url && a.url.trim() !== ''
                    ).length;
                    return (
                      <div key={grade.id} className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-700 text-base">
                            {grade.name}
                          </span>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {activeGradeLinks > 0
                              ? `${activeGradeLinks} link có sẵn`
                              : 'Chưa có link'}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {grade.audios.map((audio, index) => (
                            <div
                              key={audio.id}
                              className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3 relative"
                            >
                              <div className="absolute top-2 right-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveAudio(grade.id, audio.id)
                                  }
                                  className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                                >
                                  <Minus size={16} />
                                </button>
                              </div>
                              <div className="space-y-1 pr-8">
                                <label className="text-xs font-semibold text-slate-600">
                                  Tiêu đề bài nghe {index + 1}
                                </label>
                                <input
                                  type="text"
                                  value={audio.title}
                                  onChange={(e) =>
                                    handleAudioChange(
                                      grade.id,
                                      audio.id,
                                      'title',
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Tiêu đề bài nghe"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600">
                                  Link Audio {index + 1}
                                </label>
                                <input
                                  type="text"
                                  value={audio.url}
                                  onChange={(e) =>
                                    handleAudioChange(
                                      grade.id,
                                      audio.id,
                                      'url',
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddAudio(grade.id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                          >
                            <Plus size={16} />
                            <span>Thêm file nghe</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Bạn có thay đổi chưa lưu!
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Các đường dẫn file nghe vừa chỉnh sửa sẽ bị mất nếu bạn thoát mà
                  không lưu lên máy chủ.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Ở lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  onBack();
                }}
                className="flex-1 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Thoát không lưu
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(true)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap disabled:opacity-70"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu và thoát'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Error Modal */}
      {saveErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  Không thể lưu dữ liệu lên máy chủ
                </h3>
                <p className="text-sm text-slate-600 mt-1 break-words">
                  {saveErrorModal}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Gợi ý: Bạn có thể tải file dự phòng về máy ngay bên dưới để không
                  bị mất các link vừa nhập, sau đó kiểm tra lại kết nối mạng hoặc
                  Rules trong Firebase Console.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                <Download size={16} />
                <span>Tải bản dự phòng</span>
              </button>
              <button
                type="button"
                onClick={() => setSaveErrorModal(null)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Lịch sử Sao lưu & Khôi phục File Nghe
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hệ thống tự động ghi lại các phiên bản có chứa link hợp lệ để bạn
                  khôi phục bất cứ lúc nào.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Export / Import Controls */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-600">
                Sao lưu thủ công ra tệp máy tính:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <Download size={14} />
                  <span>Xuất file dự phòng (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <Upload size={14} />
                  <span>Nhập từ file (.json)</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </div>
            </div>

            {/* Backup List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {backups.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Chưa có bản sao lưu tự động nào. Ngay khi bạn nhập link và bấm Lưu
                  thay đổi, bản sao lưu sẽ xuất hiện tại đây.
                </div>
              ) : (
                backups.map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 tabular-nums">
                        <span>{formatTime(b.timestamp)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-600">
                          {b.totalLinks} link file nghe
                        </span>
                        {idx === 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-600 text-xs font-semibold">
                              Mới nhất
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 break-words">
                        {b.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreBackup(b)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      <RotateCcw size={14} />
                      <span>Khôi phục bản này</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Text */}
      <div className="fixed bottom-2 right-4 z-40 text-slate-500 text-xs md:text-sm font-medium pointer-events-none">
        © Design by TuanTM
      </div>
    </div>
  );
}
