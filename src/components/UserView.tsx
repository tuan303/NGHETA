import { useState, useRef, useEffect } from 'react';
import { Grade } from '../types';
import { Settings, ChevronDown } from 'lucide-react';

interface UserViewProps {
  grades: Grade[];
  onAdminClick: () => void;
}

export default function UserView({ grades, onAdminClick }: UserViewProps) {
  const [selectedGradeId, setSelectedGradeId] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedGrade = grades.find((g) => g.id === selectedGradeId) || grades[0];

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
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-teal-900/40"></div>
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Admin Button (Hidden in plain sight, top right) */}
      <button 
        onClick={onAdminClick}
        className="absolute top-4 right-4 z-50 p-2 text-white/50 hover:text-white transition-colors"
        title="Quản trị"
      >
        <Settings size={24} />
      </button>

      {/* Logo - Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <img 
          src="https://hoangmaistarschool.edu.vn/thongtin/logo.svg" 
          alt="Ngôi Sao Hoàng Mai Logo" 
          className="h-16 md:h-24 w-auto drop-shadow-lg"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center">
        {/* Main Title */}
        <div className="bg-red-600 text-white px-12 py-3 rounded-xl shadow-lg border-2 border-red-700 mb-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide">NSHM - HỆ THỐNG NGHE TIẾNG ANH ONLINE</h1>
        </div>

        {/* Subtitle */}
        <h2 className="text-white text-lg md:text-xl font-medium mb-12 uppercase tracking-wider relative inline-block">
          Thầy/Cô vui lòng chọn file nghe theo đúng khối
          <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-white/70"></span>
        </h2>

        {/* Main Card */}
        <div className="bg-white/20 backdrop-blur-sm border-2 border-yellow-400 rounded-2xl p-6 md:p-10 w-full max-w-2xl flex flex-col items-center shadow-2xl">
          
          {/* Dropdown Button */}
          <div className="relative w-full max-w-[224px] mb-8" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#008033] hover:bg-[#006629] text-white text-[29px] font-bold py-4 px-6 rounded-xl shadow-md flex items-center justify-center transition-colors border border-green-800"
            >
              {selectedGrade.name}
              <ChevronDown className="absolute right-4" size={28} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto border border-gray-200">
                {grades.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => {
                      setSelectedGradeId(grade.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-center py-3 px-4 text-[23px] font-semibold hover:bg-gray-100 transition-colors ${selectedGradeId === grade.id ? 'bg-green-50 text-green-700' : 'text-gray-800'}`}
                  >
                    {grade.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Audio Title */}
          <h3 className="text-red-600 text-xl md:text-2xl font-bold mb-6 text-center">
            {selectedGrade.title || "Chưa có tiêu đề"}
          </h3>

          {/* Audio Player Container */}
          <div className="bg-[#ff8c42] w-full max-w-md p-4 rounded-xl shadow-inner border border-orange-600 flex justify-center">
            {selectedGrade.audioUrl ? (
              <audio 
                key={selectedGrade.audioUrl} // Force re-render when URL changes
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
      </div>
    </div>
  );
}
