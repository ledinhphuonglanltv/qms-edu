'use client';

import { useState, useEffect } from 'react';
import { FILE_TYPES, FILE_TYPE_LABELS, EVALUATION_LEVELS, EVALUATION_COLORS } from '@/constants/roles';
import { getCurrentWeek, getWeekDateRange, formatDate } from '@/utils/weekCalculator';

interface TeacherDashboardProps {
  user: {
    fullName: string;
    role: string;
    grade: string;
    status: string;
  };
  onLogout: () => void;
}

interface DemoFile {
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface DemoSubmission {
  weekNumber: number;
  submittedAt: string | null;
  teacherNote: string;
  leadStatus: 'pending' | 'verified' | 'incomplete';
  leadNote: string | null;
  bghRating: string | null;
  bghFeedback: string | null;
  files: DemoFile[];
}

export default function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const schoolStartDate = '2026-09-01'; // Ngày khai giảng giả định
  const currentWeek = getCurrentWeek(schoolStartDate);
  const totalWeeks = 35;

  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [teacherNote, setTeacherNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // File states cho 3 loại tài liệu
  const [files, setFiles] = useState<{ [key: string]: DemoFile | null }>({
    [FILE_TYPES.KHBD]: null,
    [FILE_TYPES.KHGD]: null,
    [FILE_TYPES.DCTD]: null,
  });

  // Lưu trữ các bản nộp tuần của giáo viên này
  const [submissions, setSubmissions] = useState<{ [key: number]: DemoSubmission }>({});

  useEffect(() => {
    // Khởi tạo một số dữ liệu demo cho giáo viên
    const initialSubmissions: { [key: number]: DemoSubmission } = {
      1: {
        weekNumber: 1,
        submittedAt: '2026-09-05T17:00:00Z',
        teacherNote: 'Gửi giáo án tuần 1 đầy đủ',
        leadStatus: 'verified',
        leadNote: 'Đã nhận đủ tài liệu tuần 1, trình bày khoa học.',
        bghRating: EVALUATION_LEVELS.TOT,
        bghFeedback: 'Giáo án soạn rất tốt, bám sát đối tượng học sinh.',
        files: [
          { name: `KHBD_Tuan01_${user.fullName.replace(/\s+/g, '')}.docx`, type: FILE_TYPES.KHBD, size: '245 KB', uploadedAt: '2026-09-05' },
          { name: `KHGD_Tuan01_${user.fullName.replace(/\s+/g, '')}.docx`, type: FILE_TYPES.KHGD, size: '120 KB', uploadedAt: '2026-09-05' },
          { name: `DCTD_Tuan01_${user.fullName.replace(/\s+/g, '')}.docx`, type: FILE_TYPES.DCTD, size: '98 KB', uploadedAt: '2026-09-05' },
        ]
      },
      2: {
        weekNumber: 2,
        submittedAt: '2026-09-12T08:30:00Z',
        teacherNote: 'Báo cáo tuần 2 bổ sung điều chỉnh tiết 3',
        leadStatus: 'verified',
        leadNote: 'Đã duyệt nộp đủ.',
        bghRating: EVALUATION_LEVELS.XUAT_SAC,
        bghFeedback: 'Phần điều chỉnh sau tiết dạy rất sâu sắc, đáng học tập.',
        files: [
          { name: `KHBD_Tuan02_${user.fullName.replace(/\s+/g, '')}.docx`, type: FILE_TYPES.KHBD, size: '250 KB', uploadedAt: '2026-09-12' },
          { name: `KHGD_Tuan02_${user.fullName.replace(/\s+/g, '')}.docx`, type: FILE_TYPES.KHGD, size: '115 KB', uploadedAt: '2026-09-12' },
          { name: `DCTD_Tuan02_${user.fullName.replace(/\s+/g, '')}.docx`, type: FILE_TYPES.DCTD, size: '102 KB', uploadedAt: '2026-09-12' },
        ]
      },
      3: {
        weekNumber: 3,
        submittedAt: null,
        teacherNote: '',
        leadStatus: 'incomplete',
        leadNote: null,
        bghRating: null,
        bghFeedback: null,
        files: []
      }
    };
    
    // Đọc thêm từ localStorage nếu GV đã nộp thử trong phiên này
    const stored = localStorage.getItem(`qms_submissions_${user.fullName}`);
    if (stored) {
      setSubmissions(JSON.parse(stored));
    } else {
      setSubmissions(initialSubmissions);
    }
  }, [user.fullName]);

  // Cập nhật form khi chọn tuần khác
  useEffect(() => {
    const sub = submissions[selectedWeek];
    if (sub) {
      setTeacherNote(sub.teacherNote || '');
      const fileMap = {
        [FILE_TYPES.KHBD]: sub.files.find(f => f.type === FILE_TYPES.KHBD) || null,
        [FILE_TYPES.KHGD]: sub.files.find(f => f.type === FILE_TYPES.KHGD) || null,
        [FILE_TYPES.DCTD]: sub.files.find(f => f.type === FILE_TYPES.DCTD) || null,
      };
      setFiles(fileMap);
    } else {
      setTeacherNote('');
      setFiles({
        [FILE_TYPES.KHBD]: null,
        [FILE_TYPES.KHGD]: null,
        [FILE_TYPES.DCTD]: null,
      });
    }
  }, [selectedWeek, submissions]);

  // Xử lý nộp file giả lập
  const handleFileUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Validate tên file mẫu quy chuẩn (KHBX_TuanXX_TenGiaoVien.docx)
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'docx' && fileExtension !== 'doc') {
      alert('Vui lòng chỉ nộp tài liệu định dạng Word (.doc hoặc .docx) theo quy định!');
      return;
    }

    const cleanName = user.fullName.replace(/\s+/g, '');
    const weekStr = String(selectedWeek).padStart(2, '0');
    let standardName = `${type}_Tuan${weekStr}_${cleanName}.docx`;

    setFiles(prev => ({
      ...prev,
      [type]: {
        name: standardName,
        type: type,
        size: `${Math.round(file.size / 1024)} KB`,
        uploadedAt: new Date().toISOString().split('T')[0]
      }
    }));
  };

  // Bấm nút xóa file đã chọn
  const handleRemoveFile = (type: string) => {
    setFiles(prev => ({
      ...prev,
      [type]: null
    }));
  };

  // Xác nhận nộp giáo án tuần
  const handleSendSubmission = () => {
    // Kiểm tra xem đã nộp ít nhất 1 file chưa
    const activeFiles = Object.values(files).filter(f => f !== null) as DemoFile[];
    if (activeFiles.length === 0) {
      alert('Thầy/Cô vui lòng tải lên ít nhất một tài liệu giảng dạy trước khi bấm Gửi!');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const uploadedFiles = Object.values(files).filter(f => f !== null) as DemoFile[];
      
      const newSubmission: DemoSubmission = {
        weekNumber: selectedWeek,
        submittedAt: new Date().toISOString(),
        teacherNote: teacherNote,
        leadStatus: 'pending', // Chờ duyệt lại sau khi nộp
        leadNote: null,
        bghRating: null,
        bghFeedback: null,
        files: uploadedFiles,
      };

      const updatedSubmissions = {
        ...submissions,
        [selectedWeek]: newSubmission,
      };

      setSubmissions(updatedSubmissions);
      localStorage.setItem(`qms_submissions_${user.fullName}`, JSON.stringify(updatedSubmissions));
      setIsSubmitting(false);
      setNotification(`Đã gửi báo cáo Tuần ${selectedWeek} thành công tới Khối trưởng!`);
      
      setTimeout(() => setNotification(null), 5000);
    }, 1200);
  };

  const selectedWeekSubmission = submissions[selectedWeek];
  const dateRange = getWeekDateRange(selectedWeek, schoolStartDate);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. TOP HEADER - Indigo Style */}
      <header className="relative z-10 bg-indigo-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shadow">
            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-gradient-to-tr from-blue-600 to-orange-500 text-xs font-black text-white">
              Q
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-none">QMS-EDU</h1>
            <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold mt-0.5">Giáo viên Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">Thầy/Cô: {user.fullName}</div>
            <div className="text-[10px] text-indigo-200 font-bold bg-indigo-800 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
              {user.grade}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500 bg-indigo-800/40 hover:bg-indigo-800 active:scale-[0.98] transition-all px-3 py-1.5 text-xs font-bold text-indigo-100 hover:text-white cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT (Sidebar chọn Tuần + Main Content) */}
      <div className="flex-grow flex flex-col md:flex-row">
        
        {/* SIDEBAR BÊN TRÁI: Chọn Tuần (dễ dùng, khoa học giống OLM) */}
        <aside className="w-full md:w-64 border-r border-slate-200 bg-white p-4 shrink-0 flex flex-col gap-3 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            Tuần dạy học (Năm học 2026-2027)
          </div>
          
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto max-h-[150px] md:max-h-[calc(100vh-180px)] pb-2 md:pb-0 pr-1">
            {Array.from({ length: totalWeeks }, (_, idx) => idx + 1).map((week) => {
              const sub = submissions[week];
              const isCurrent = week === currentWeek;
              const isSelected = week === selectedWeek;
              
              let statusBadge = '🔴'; // Chưa nộp
              if (sub) {
                if (sub.leadStatus === 'verified') statusBadge = '🟢'; // Đã duyệt
                else if (sub.submittedAt) statusBadge = '⏳'; // Đang chờ duyệt
                else if (sub.leadStatus === 'incomplete') statusBadge = '🟠'; // Cần bổ dung
              }

              return (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all shrink-0 shadow-sm ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{statusBadge}</span>
                    <span>Tuần {week}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-black text-[9px] border border-blue-200">
                        HIỆN TẠI
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CỘT CHÍNH: Form nộp & xem trạng thái duyệt của Tuần đã chọn */}
        <main className="flex-grow p-6 lg:p-10 max-w-4xl space-y-6">
          
          {/* Banner thông báo trạng thái nộp thành công */}
          {notification && (
            <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-700 font-medium animate-fade-in flex items-center gap-2 shadow-sm">
              <span>✅</span> {notification}
            </div>
          )}

          {/* 2.1 TRẠNG THÁI TUẦN CHỌN */}
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái báo cáo</div>
              <h2 className="text-2xl font-black text-slate-800">Tuần {selectedWeek}</h2>
              <p className="text-xs text-slate-500">
                Khoảng thời gian học: <strong>{formatDate(dateRange.start)}</strong> đến <strong>{formatDate(dateRange.end)}</strong>
              </p>
            </div>

            {/* Trạng thái duyệt của Khối Trưởng */}
            <div className="flex flex-col gap-1 items-start md:items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Kiểm duyệt Khối trưởng</span>
              {!selectedWeekSubmission?.submittedAt ? (
                <span className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-600 shadow-sm">
                  Chưa nộp báo cáo
                </span>
              ) : selectedWeekSubmission.leadStatus === 'pending' ? (
                <span className="px-3 py-1.5 text-xs font-bold rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-600 shadow-sm">
                  ⏳ Đã nộp - Chờ Khối trưởng duyệt
                </span>
              ) : selectedWeekSubmission.leadStatus === 'incomplete' ? (
                <span className="px-3 py-1.5 text-xs font-bold rounded-lg border border-orange-200 bg-orange-50 text-orange-600 shadow-sm animate-pulse">
                  ⚠️ Cần nộp lại hoặc nộp thiếu
                </span>
              ) : (
                <span className="px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
                  ✓ Khối trưởng đã duyệt nộp đủ
                </span>
              )}
            </div>
          </div>

          {/* 2.2 NHẬN XÉT CỦA BGH (RIÊNG TƯ TUYỆT ĐỐI) */}
          {selectedWeekSubmission?.bghRating && (
            <div className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 relative overflow-hidden space-y-3.5 shadow-sm">
              <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  🛡️ Nhận xét riêng tư từ Ban Giám Hiệu
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${EVALUATION_COLORS[selectedWeekSubmission.bghRating as keyof typeof EVALUATION_COLORS]}`}>
                  Đánh giá: {selectedWeekSubmission.bghRating}
                </span>
              </div>
              <p className="text-slate-700 text-sm italic leading-relaxed bg-white/50 p-3 rounded-lg border border-indigo-100/40">
                "{selectedWeekSubmission.bghFeedback || 'Không có nhận xét chi tiết.'}"
              </p>
              <div className="text-[10px] text-slate-400">
                Chỉ Thầy/Cô và Ban Giám Hiệu có thể xem kết quả đánh giá thi đua này.
              </div>
            </div>
          )}

          {/* 2.3 PHẢN HỒI YÊU CẦU BỔ SUNG CỦA KHỐI TRƯỞNG */}
          {selectedWeekSubmission?.leadStatus === 'incomplete' && selectedWeekSubmission.leadNote && (
            <div className="p-6 rounded-2xl border border-orange-200 bg-orange-50/40 relative overflow-hidden space-y-2 shadow-sm">
              <div className="absolute top-0 inset-x-0 h-1 bg-orange-500"></div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
                💬 Ghi chú từ Khối Trưởng (Yêu cầu bổ sung):
              </span>
              <p className="text-slate-700 text-sm font-medium bg-white/60 p-3 rounded-lg border border-orange-100/50">
                "{selectedWeekSubmission.leadNote}"
              </p>
            </div>
          )}

          {/* 2.4 CỔNG TẢI LÊN TÀI LIỆU WORD */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Học liệu & Báo cáo Tuần nộp
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(FILE_TYPE_LABELS).map((type) => {
                const file = files[type];
                
                return (
                  <div key={type} className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400 transition-all flex flex-col justify-between min-h-[170px] shadow-sm relative group">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">
                          {type}
                        </span>
                        {file && (
                          <span className="text-[10px] text-slate-400 font-semibold">{file.size}</span>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">
                        {FILE_TYPE_LABELS[type as keyof typeof FILE_TYPE_LABELS]}
                      </h4>
                      
                      {file ? (
                        <div className="text-[10px] text-slate-500 leading-snug break-all font-medium mt-2">
                          📄 {file.name}
                          <div className="text-[9px] text-slate-400 mt-1">Nộp lúc: {file.uploadedAt}</div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          Chưa tải tài liệu lên. Quy chuẩn tên file: <code className="text-indigo-600 block mt-1">{type}_Tuan{String(selectedWeek).padStart(2, '0')}_{[user.fullName.replace(/\s+/g, '')]}.docx</code>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {file ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(type)}
                          className="w-full py-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Xóa & Nộp lại
                        </button>
                      ) : (
                        <label className="w-full block text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-bold cursor-pointer transition-colors">
                          Tải file Word lên
                          <input
                            type="file"
                            accept=".doc,.docx"
                            onChange={(e) => handleFileUpload(type, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2.5 GHI CHÚ BÁO CÁO CỦA GIÁO VIÊN */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Ý kiến / Ghi chú của Giáo viên gửi kèm
            </label>
            <textarea
              rows={3}
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="Nhập ghi chú gửi kèm báo cáo tuần (ví dụ: xin bổ sung tiết 2 do đi công tác, gửi kèm điều chỉnh...)"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* NÚT GỬI BÁO CÁO CHÍNH THỨC */}
          <div className="pt-4 border-t border-slate-200/80 flex justify-end">
            <button
              onClick={handleSendSubmission}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-orange-500 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-600/10"
            >
              {isSubmitting ? 'Đang tải và gửi báo cáo...' : `Báo cáo nộp chính thức Tuần ${selectedWeek}`}
            </button>
          </div>

        </main>
      </div>

    </div>
  );
}
