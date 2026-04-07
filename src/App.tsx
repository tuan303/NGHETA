/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import UserView from './components/UserView';
import AdminView from './components/AdminView';
import { Grade } from './types';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const DEFAULT_GRADES: Grade[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `KHỐI ${i + 1}`,
  title: `Tiêu đề bài nghe khối ${i + 1}`,
  audioUrl: '', // Default empty
}));

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    const docRef = doc(db, 'settings', 'grades');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().grades;
        setGrades(data);
        localStorage.setItem('english_audio_grades', JSON.stringify(data));
      } else {
        // Initialize if not exists
        setDoc(docRef, { grades: DEFAULT_GRADES }).catch(console.error);
        setGrades(DEFAULT_GRADES);
      }
    }, (error) => {
      console.error("Error fetching grades from Firebase:", error);
      // Fallback to local storage if Firebase fails
      const storedGrades = localStorage.getItem('english_audio_grades');
      if (storedGrades) {
        setGrades(JSON.parse(storedGrades));
      } else {
        setGrades(DEFAULT_GRADES);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveGrades = async (newGrades: Grade[]) => {
    // Optimistic update
    setGrades(newGrades);
    localStorage.setItem('english_audio_grades', JSON.stringify(newGrades));
    
    try {
      const docRef = doc(db, 'settings', 'grades');
      await setDoc(docRef, { grades: newGrades });
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      alert("Có lỗi xảy ra khi lưu dữ liệu lên máy chủ. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  if (grades.length === 0) return null; // Loading state

  const handleAdminClick = () => {
    setShowPinModal(true);
    setPinInput('');
    setPinError('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
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
        <AdminView grades={grades} onSave={handleSaveGrades} onBack={() => setIsAdmin(false)} />
      ) : (
        <UserView grades={grades} onAdminClick={handleAdminClick} />
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
