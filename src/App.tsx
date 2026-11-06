/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, useCallback } from 'react';
import UserView from './components/UserView';
import AdminView from './components/AdminView';
import { Grade, Category, BackupEntry } from './types';
import { doc, onSnapshot, setDoc, getDocFromServer, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const STORAGE_KEY = 'english_audio_grades';
const BACKUP_STORAGE_KEY = 'english_audio_backups';
const MAX_BACKUPS = 20;

export const getCategory = (id: number): Category => {
  if (id <= 5) return 'PRIMARY';
  if (id <= 9) return 'SECONDARY';
  return 'HIGH';
};

export const createDefaultGrades = (): Grade[] =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `KHỐI ${i + 1}`,
    title: `Tiêu đề bài nghe khối ${i + 1}`,
    audioUrl: '',
    category: getCategory(i + 1),
    audios: [{ id: `default-${i + 1}-1`, title: `Tiêu đề bài nghe khối ${i + 1}`, url: '' }],
  }));

export const countValidLinks = (gradesList: Grade[]): number => {
  if (!Array.isArray(gradesList)) return 0;
  return gradesList.reduce((acc, g) => {
    if (!Array.isArray(g.audios)) return acc;
    return acc + g.audios.filter((a) => a && typeof a.url === 'string' && a.url.trim() !== '').length;
  }, 0);
};

export const summarizeGradesLinks = (gradesList: Grade[]): string => {
  if (!Array.isArray(gradesList)) return 'Không có dữ liệu';
  const activeGrades = gradesList
    .map((g) => {
      const count = Array.isArray(g.audios)
        ? g.audios.filter((a) => a && typeof a.url === 'string' && a.url.trim() !== '').length
        : 0;
      return count > 0 ? `${g.name} (${count} link)` : null;
    })
    .filter(Boolean);
  return activeGrades.length > 0 ? activeGrades.join(', ') : 'Chưa có link nào';
};

export const getGradesSignature = (gradesList: Grade[]): string => {
  if (!Array.isArray(gradesList)) return '';
  return JSON.stringify(
    gradesList.map((g) => ({
      id: g.id,
      audios: (g.audios || []).map((a) => ({
        title: (a.title || '').trim(),
        url: (a.url || '').trim(),
      })),
    }))
  );
};

export const normalizeGrades = (rawGrades: Grade[] | undefined | null, cleanTrim = false): Grade[] => {
  const defaults = createDefaultGrades();
  if (!Array.isArray(rawGrades) || rawGrades.length === 0) {
    return defaults;
  }

  return defaults.map((defGrade) => {
    const found = rawGrades.find((g) => Number(g?.id) === defGrade.id);
    if (!found) return defGrade;

    let audios = Array.isArray(found.audios)
      ? found.audios.map((a, idx) => ({
          id: a?.id || `audio-${defGrade.id}-${idx}-${Date.now()}`,
          title: cleanTrim ? (a?.title ?? '').trim() : (a?.title ?? ''),
          url: cleanTrim ? (a?.url ?? '').trim() : (a?.url ?? ''),
        }))
      : [
          {
            id: `legacy-${defGrade.id}`,
            title: cleanTrim ? (found.title ?? defGrade.title).trim() : (found.title ?? defGrade.title),
            url: cleanTrim ? (found.audioUrl ?? '').trim() : (found.audioUrl ?? ''),
          },
        ];

    if (audios.length === 0) {
      audios = [
        {
          id: `empty-${defGrade.id}-${Date.now()}`,
          title: `Tiêu đề bài nghe khối ${defGrade.id}`,
          url: '',
        },
      ];
    }

    const primaryTitle = audios[0]?.title || `Tiêu đề bài nghe khối ${defGrade.id}`;
    const primaryUrl = audios[0]?.url || '';

    return {
      id: defGrade.id,
      name: found.name || defGrade.name,
      category: getCategory(defGrade.id),
      title: primaryTitle,
      audioUrl: primaryUrl,
      audios,
    };
  });
};

const loadLocalBackups = (): BackupEntry[] => {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalBackups = (backups: BackupEntry[]) => {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups.slice(0, MAX_BACKUPS)));
  } catch (e) {
    console.error('Failed to save backups to localStorage:', e);
  }
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [grades, setGrades] = useState<Grade[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return normalizeGrades(parsed, true);
      }
    } catch (e) {
      console.error('Error reading initial grades from localStorage:', e);
    }
    return createDefaultGrades();
  });
  const [backups, setBackups] = useState<BackupEntry[]>(() => loadLocalBackups());
  const [isSyncingServer, setIsSyncingServer] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const recordBackupSnapshot = useCallback(
    async (gradesSnapshot: Grade[], syncToCloud = false) => {
      const normalized = normalizeGrades(gradesSnapshot, true);
      const totalLinks = countValidLinks(normalized);
      if (totalLinks === 0) return;

      const newSig = getGradesSignature(normalized);
      const currentLocal = loadLocalBackups();

      if (currentLocal.length > 0 && getGradesSignature(currentLocal[0].grades) === newSig) {
        return;
      }

      const newEntry: BackupEntry = {
        id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        totalLinks,
        summary: summarizeGradesLinks(normalized),
        grades: normalized,
      };

      const updatedBackups = [newEntry, ...currentLocal].slice(0, MAX_BACKUPS);
      saveLocalBackups(updatedBackups);
      setBackups(updatedBackups);

      if (syncToCloud) {
        try {
          const backupDocRef = doc(db, 'settings', 'grades_backups');
          await setDoc(backupDocRef, {
            backups: updatedBackups.slice(0, 12),
            updatedAt: Date.now(),
          });
        } catch (err) {
          console.warn('Could not sync backup history to cloud:', err);
        }
      }
    },
    []
  );

  // Load cloud backups once on startup and merge with local backups
  useEffect(() => {
    const fetchCloudBackups = async () => {
      try {
        const backupDocRef = doc(db, 'settings', 'grades_backups');
        const snap = await getDoc(backupDocRef);
        if (snap.exists() && Array.isArray(snap.data()?.backups)) {
          const cloudBackups: BackupEntry[] = snap.data().backups;
          const localBackups = loadLocalBackups();
          const seenSigs = new Set<string>();
          const merged: BackupEntry[] = [];

          [...localBackups, ...cloudBackups]
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach((b) => {
              if (!b || !Array.isArray(b.grades)) return;
              const sig = getGradesSignature(b.grades);
              if (!seenSigs.has(sig) && countValidLinks(b.grades) > 0) {
                seenSigs.add(sig);
                merged.push({
                  ...b,
                  grades: normalizeGrades(b.grades, true),
                  totalLinks: countValidLinks(b.grades),
                  summary: b.summary || summarizeGradesLinks(b.grades),
                });
              }
            });

          const finalBackups = merged.slice(0, MAX_BACKUPS);
          saveLocalBackups(finalBackups);
          setBackups(finalBackups);
        }
      } catch (err) {
        console.warn('Could not fetch cloud backups:', err);
      }
    };

    fetchCloudBackups();
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'grades');

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        setIsSyncingServer(false);
        setServerError(null);

        if (docSnap.exists()) {
          const rawGrades = docSnap.data()?.grades;
          const serverGrades = normalizeGrades(rawGrades, true);
          const serverLinksCount = countValidLinks(serverGrades);

          // Protect against empty offline cache overwriting valid local data
          if (docSnap.metadata.fromCache && serverLinksCount === 0) {
            return;
          }

          // If server has valid links, automatically protect them in backup history
          if (serverLinksCount > 0) {
            recordBackupSnapshot(serverGrades, false);
          }

          setGrades(serverGrades);
          setLastSyncedAt(Date.now());
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverGrades));
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        } else {
          // CRITICAL FIX: Never automatically overwrite Firestore with DEFAULT_GRADES when docSnap doesn't exist!
          // Keep existing local data or backups intact.
          console.warn('Firestore document settings/grades does not exist yet. Preserving local state.');
        }
      },
      (error) => {
        console.error('Error fetching grades from Firebase:', error);
        setIsSyncingServer(false);
        setServerError(error.message || 'Không thể kết nối tới máy chủ Firebase');
      }
    );

    return () => unsubscribe();
  }, [recordBackupSnapshot]);

  const handleSaveGrades = async (newGrades: Grade[]) => {
    const cleanedGrades = normalizeGrades(newGrades, true);

    // Backup previous state before overwriting if it had links
    if (countValidLinks(grades) > 0) {
      await recordBackupSnapshot(grades, false);
    }

    const docRef = doc(db, 'settings', 'grades');
    await setDoc(docRef, {
      grades: cleanedGrades,
      updatedAt: Date.now(),
    });

    // Verify the write actually reached the Firebase server (not just queued offline)
    try {
      const serverSnap = await getDocFromServer(docRef);
      if (!serverSnap.exists()) {
        throw new Error('Máy chủ chưa xác nhận dữ liệu vừa lưu. Vui lòng kiểm tra kết nối mạng.');
      }
    } catch (verifyErr: any) {
      if (
        verifyErr?.code === 'unavailable' ||
        verifyErr?.message?.includes('offline')
      ) {
        throw new Error(
          'Thiết bị đang mất kết nối mạng tới máy chủ Firebase. Dữ liệu chưa được lưu lên máy chủ.'
        );
      }
      throw verifyErr;
    }

    setGrades(cleanedGrades);
    setLastSyncedAt(Date.now());
    setServerError(null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedGrades));

    // Also save new state to local & cloud backups
    await recordBackupSnapshot(cleanedGrades, true);
  };

  if (grades.length === 0) return null;

  const handleAdminClick = () => {
    setShowPinModal(true);
    setPinInput('');
    setPinError('');
  };

  const handlePinSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pinInput === '898989') {
      setIsAdmin(true);
      setShowPinModal(false);
    } else {
      setPinError('Mã PIN không đúng!');
    }
  };

  return (
    <div className="min-h-screen font-sans relative">
      {isAdmin ? (
        <AdminView
          grades={grades}
          backups={backups}
          isSyncingServer={isSyncingServer}
          lastSyncedAt={lastSyncedAt}
          serverError={serverError}
          onSave={handleSaveGrades}
          onBack={() => setIsAdmin(false)}
        />
      ) : (
        <UserView
          grades={grades}
          onAdminClick={handleAdminClick}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {/* Custom PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Nhập mã PIN quản trị</h3>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder="••••••"
                autoFocus
              />
              {pinError && <p className="text-red-500 text-sm text-center mb-4">{pinError}</p>}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
