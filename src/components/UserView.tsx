import { useState, useRef, useEffect } from 'react';
import { Grade, Category } from '../types';
import { Settings, ChevronDown, ArrowLeft, GraduationCap, School, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserViewProps {
  grades: Grade[];
  onAdminClick: () => void;
  selectedCategory: Category | null;
  onSelectCategory: (category: Category | null) => void;
}

const CATEGORY_INFO = {
  PRIMARY: { label: 'TIỂU HỌC', icon: GraduationCap, color: 'bg-[#ffad00]' },
  SECONDARY: { label: 'THCS', icon: School, color: 'bg-[#2da037]' },
  HIGH: { label: 'THPT', icon: Library, color: 'bg-[#23328c]' },
};

export default function UserView({ grades, onAdminClick, selectedCategory, onSelectCategory }: UserViewProps) {
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredGrades = grades.filter(g => g.category === selectedCategory);
  const selectedGrade = filteredGrades.find((g) => g.id === selectedGradeId) || filteredGrades[0];

  // Reset selected grade when category changes
  useEffect(() => {
    if (selectedCategory) {
      setSelectedGradeId(filteredGrades[0]?.id || null);
    } else {
      setSelectedGradeId(null);
    }
  }, [selectedCategory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col items-center pt-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 bg-teal-800">
        <img 
          src="https://hoangmaistarschool.edu.vn/thongtin/truong.jpg" 
          alt="Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-teal-900/40"></div>
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Admin Button */}
      <button 
        onClick={onAdminClick}
        className="absolute top-2 right-2 md:top-4 md:right-4 z-50 p-2 text-white/50 hover:text-white transition-colors"
        title="Quản trị"
      >
        <Settings size={20} className="md:w-6 md:h-6" />
      </button>

      {/* Logo */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-50">
        <img 
          src="https://hoangmaistarschool.edu.vn/thongtin/logo.svg" 
          alt="Ngôi Sao Hoàng Mai Logo" 
          className="h-12 md:h-24 w-auto drop-shadow-lg"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center h-full flex-1">
        {/* Main Title */}
        <div className="bg-red-600 text-white px-6 md:px-12 py-3 rounded-xl shadow-lg border-2 border-red-700 mt-4 md:mt-8 mb-4 text-center">
          <h1 className="text-xl md:text-3xl font-bold uppercase tracking-wide leading-tight">NSHM - HỆ THỐNG NGHE TIẾNG ANH ONLINE</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full pb-20">
          <AnimatePresence mode="wait">
            {!selectedCategory ? (
              <motion.div 
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {(Object.entries(CATEGORY_INFO) as [Category, typeof CATEGORY_INFO.PRIMARY][]).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => onSelectCategory(key)}
                    className={`${info.color} hover:scale-105 transition-transform p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-white border-4 border-white/20 group`}
                  >
                    <info.icon size={64} className="group-hover:animate-bounce" />
                    <span className="text-2xl md:text-3xl font-black tracking-widest">{info.label}</span>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="grades"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center"
              >
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => onSelectCategory(null)}
                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors flex items-center gap-2 pr-4"
                  >
                    <ArrowLeft size={24} />
                    <span className="font-bold uppercase">Quay lại</span>
                  </button>
                  <div className={`${CATEGORY_INFO[selectedCategory].color} text-white px-6 py-2 rounded-full font-black text-xl shadow-lg border-2 border-white/30`}>
                    {CATEGORY_INFO[selectedCategory].label}
                  </div>
                </div>

                {/* Subtitle */}
                <h2 className="text-white text-base md:text-xl font-medium mb-8 md:mb-12 uppercase tracking-wider relative inline-block text-center px-2">
                  Thầy/Cô vui lòng chọn file nghe theo đúng khối
                  <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-white/70"></span>
                </h2>

                {/* Main Card */}
                <div className="bg-white/20 backdrop-blur-sm border-2 border-yellow-400 rounded-2xl p-4 md:p-10 w-full max-w-2xl flex flex-col items-center shadow-2xl">
                  
                  {/* Dropdown Button */}
                  <div className="relative w-full max-w-[280px] mb-6 md:mb-8" ref={dropdownRef}>
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-[#008033] hover:bg-[#006629] text-white text-xl md:text-[29px] font-bold py-3 md:py-4 px-6 rounded-xl shadow-md flex items-center justify-center transition-colors border border-green-800"
                    >
                      {selectedGrade?.name || 'Chọn khối'}
                      <ChevronDown className="absolute right-4" size={24} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto border border-gray-200">
                        {filteredGrades.map((grade) => (
                          <button
                            key={grade.id}
                            onClick={() => {
                              setSelectedGradeId(grade.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-center py-3 px-4 text-lg md:text-[23px] font-semibold hover:bg-gray-100 transition-colors ${selectedGradeId === grade.id ? 'bg-green-50 text-green-700' : 'text-gray-800'}`}
                          >
                            {grade.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audio Title */}
                  <h3 className="text-red-600 text-lg md:text-2xl font-bold mb-6 text-center px-2">
                    {selectedGrade?.title || "Chưa có tiêu đề"}
                  </h3>

                  {/* Audio Player Container */}
                  <div className="bg-[#ff8c42] w-full max-w-md p-4 rounded-xl shadow-inner border border-orange-600 flex justify-center">
                    {selectedGrade?.audioUrl ? (
                      <audio 
                        key={selectedGrade.audioUrl}
                        controls 
                        className="w-full h-12"
                        controlsList="nodownload"
                      >
                        <source src={selectedGrade.audioUrl} type="audio/mpeg" />
                        Trình duyệt của bạn không hỗ trợ thẻ audio.
                      </audio>
                    ) : (
                      <div className="text-white font-medium py-2">Chưa có file nghe cho khối này</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-2 right-4 z-50 text-white text-xs md:text-sm font-medium pointer-events-none drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
        © Design by TuanTM
      </div>
    </div>
  );
}
