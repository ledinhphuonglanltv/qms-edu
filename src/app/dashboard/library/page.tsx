'use client';

import { useState, useEffect } from 'react';
import { GRADES, EVALUATION_LEVELS } from '@/constants/roles';

interface EliteDocument {
  id: string;
  teacherId: string;
  teacherName: string;
  grade: string;
  weekNumber: number;
  fileName: string;
  url: string;
  rating: string;
  feedback: string;
  selectedAt: string;
}

export default function EliteLibraryPage() {
  const [library, setLibrary] = useState<EliteDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  useEffect(() => {
    // 1. Dữ liệu mẫu ban đầu cho Kho Học Liệu Vàng (Elite Library)
    const initialLibrary: EliteDocument[] = [
      {
        id: 'mock_1',
        teacherId: 't2',
        teacherName: 'Lê Thị Bình',
        grade: 'Khối 1',
        weekNumber: 2,
        fileName: 'KHBD_Tuan02_LeThiBinh_PhepCongTrongPhamVi10.docx',
        url: '#',
        rating: EVALUATION_LEVELS.XUAT_SAC,
        feedback: 'Thiết kế các hoạt động học cực kỳ sáng tạo, kích thích tư duy toán học cho học sinh tiểu học thông qua trò chơi.',
        selectedAt: '2026-09-15T09:00:00Z',
      },
      {
        id: 'mock_2',
        teacherId: 't5',
        teacherName: 'Hoàng Văn Hùng',
        grade: 'Khối 2',
        weekNumber: 1,
        fileName: 'KHBD_Tuan01_HoangVanHung_TuVungTiengAnhChuDeGiaDinh.docx',
        url: '#',
        rating: EVALUATION_LEVELS.TOT,
        feedback: 'Khai thác xuất sắc công nghệ thông tin và học liệu số thông qua slide bài giảng đẹp mắt.',
        selectedAt: '2026-09-16T14:30:00Z',
      },
    ];

    // 2. Đọc thêm từ localStorage các bài BGH đã chọn
    const stored = localStorage.getItem('qms_elite_library');
    if (stored) {
      setLibrary([...initialLibrary, ...JSON.parse(stored)]);
    } else {
      setLibrary(initialLibrary);
      localStorage.setItem('qms_elite_library', JSON.stringify(initialLibrary));
    }
  }, []);

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard';
  };

  // Lọc tài liệu theo tìm kiếm và bộ lọc Khối
  const filteredDocs = library.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || doc.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* HEADER: OLM Style */}
      <header className="relative z-10 bg-indigo-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shadow">
            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-gradient-to-tr from-blue-600 to-orange-500 text-xs font-black text-white">
              Q
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-none">QMS-EDU</h1>
            <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold mt-0.5">Kho Học Liệu Vàng</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-black text-white tracking-wider uppercase bg-orange-500 px-3 py-1 rounded-full shadow-sm">
            🏆 Mẫu Mực Sư Phạm
          </span>
        </div>
      </header>

      {/* SEARCH BAR & BACK ACTION */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Tìm kiếm và Lọc */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-2xl">
          <input
            type="text"
            placeholder="Tìm tài liệu, giáo án, tên giáo viên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
          />

          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-500 shadow-sm"
          >
            <option value="all">Tất cả Khối lớp</option>
            {GRADES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleBackToDashboard}
          className="w-full md:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-[0.98] shadow-sm text-center"
        >
          ← Quay lại Dashboard
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto space-y-6">
        
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800">DANH SÁCH GIÁO ÁN MẪU MỰC</h2>
          <p className="text-xs text-slate-500 font-medium">Kho học liệu được Ban Giám Hiệu bình xét và vinh danh qua các tuần học.</p>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="py-20 border border-dashed border-slate-300 rounded-2xl bg-white text-center shadow-sm space-y-3">
            <div className="text-5xl">📚</div>
            <h3 className="text-sm font-bold text-slate-700 uppercase">Kho học liệu trống</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Không tìm thấy tài liệu mẫu mực nào khớp với từ khóa tìm kiếm của Khầy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">
                      {doc.grade} • Tuần {doc.weekNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-bold text-[9px]">
                      {doc.rating}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 leading-snug break-all">
                    📄 {doc.fileName}
                  </h3>

                  <div className="text-[11px] text-slate-500 font-medium pt-1">
                    Tác giả: <strong>{doc.teacherName}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed italic">
                    "Góp ý vinh danh của BGH: {doc.feedback}"
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-medium">Bình chọn vào: {new Date(doc.selectedAt).toLocaleDateString('vi-VN')}</span>
                  <a
                    href={doc.url}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    📥 Tải xuống giáo án mẫu
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

    </div>
  );
}
