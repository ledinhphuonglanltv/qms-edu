'use client';

import { useState, useEffect } from 'react';
import { FILE_TYPES, FILE_TYPE_LABELS, EVALUATION_LEVELS, EVALUATION_COLORS } from '@/constants/roles';
import { getCurrentWeek, getWeekDateRange, formatDate } from '@/utils/weekCalculator';
import { supabase } from '@/services/supabaseClient';

interface LeadDashboardProps {
  user: {
    fullName: string;
    role: string;
    grade: string;
    status: string;
    id?: string;
  };
  onLogout: () => void;
}

interface TeacherFileStatus {
  fileName: string;
  fileType: string;
  uploadedAt: string;
  url: string;
}

interface DemoSubmission {
  teacherId: string;
  submittedAt: string | null;
  teacherNote: string | null;
  leadStatus: 'pending' | 'verified' | 'incomplete';
  leadNote: string | null;
  bghRating: string | null;
  bghFeedback: string | null;
  files: TeacherFileStatus[];
}

interface TeacherData {
  id: string;
  fullName: string;
  email: string;
  driveFolder: string;
}

export default function LeadDashboard({ user, onLogout }: LeadDashboardProps) {
  const schoolStartDate = '2026-09-01';
  const currentWeek = getCurrentWeek(schoolStartDate);
  const totalWeeks = 35;

  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // SMTP Log để hiển thị quá trình gửi Gmail
  const [smtpLog, setSmtpLog] = useState<string | null>(null);

  // Danh sách Giáo viên giả lập thuộc Khối (Grade) của Khối Trưởng
  const [teachers, setTeachers] = useState<TeacherData[]>([]);

  // Dữ liệu báo cáo của các giáo viên
  const [submissions, setSubmissions] = useState<{ [key: string]: DemoSubmission }>({});

  useEffect(() => {
    // 1. Khởi tạo danh sách giáo viên thuộc khối
    const gradeSuffix = user.grade || 'Khối 1';
    const mockTeachers: TeacherData[] = [
      { id: 't1', fullName: 'Nguyễn Văn An', email: 'ledinhphuonglanltv@gmail.com', driveFolder: `Drive/QMS-EDU/${gradeSuffix}/NguyenVanAn` },
      { id: 't2', fullName: 'Lê Thị Bình', email: 'binh.lt@school.edu.vn', driveFolder: `Drive/QMS-EDU/${gradeSuffix}/LeThiBinh` },
      { id: 't3', fullName: 'Phạm Hồng Sơn', email: 'son.ph@school.edu.vn', driveFolder: `Drive/QMS-EDU/${gradeSuffix}/PhamHongSon` },
      { id: 't4', fullName: 'Trần Thị Diệu', email: 'dieu.tt@school.edu.vn', driveFolder: `Drive/QMS-EDU/${gradeSuffix}/TranThiDieu` },
    ];
    setTeachers(mockTeachers);

    // 2. Khởi tạo dữ liệu nộp bài demo của các giáo viên
    const storageKey = `qms_lead_submissions_w${selectedWeek}_${gradeSuffix}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setSubmissions(JSON.parse(stored));
    } else {
      const initialSubmissions: { [key: string]: DemoSubmission } = {
        't1': {
          teacherId: 't1',
          submittedAt: '2026-09-12T08:30:00Z',
          teacherNote: 'Gửi giáo án tuần này đầy đủ, phần điều chỉnh đã cập nhật',
          leadStatus: 'pending',
          leadNote: null,
          bghRating: null,
          bghFeedback: null,
          files: [
            { fileName: `KHBD_Tuan${String(selectedWeek).padStart(2, '0')}_NguyenVanAn.docx`, fileType: FILE_TYPES.KHBD, uploadedAt: '2026-09-12', url: '#' },
            { fileName: `KHGD_Tuan${String(selectedWeek).padStart(2, '0')}_NguyenVanAn.docx`, fileType: FILE_TYPES.KHGD, uploadedAt: '2026-09-12', url: '#' },
          ] // Thiếu DCTD
        },
        't2': {
          teacherId: 't2',
          submittedAt: '2026-09-11T16:45:00Z',
          teacherNote: 'Nộp đủ 3 file',
          leadStatus: 'verified',
          leadNote: 'Đã duyệt báo cáo đầy đủ, đúng hạn.',
          bghRating: EVALUATION_LEVELS.TOT,
          bghFeedback: 'Thực hiện tốt.',
          files: [
            { fileName: `KHBD_Tuan${String(selectedWeek).padStart(2, '0')}_LeThiBinh.docx`, fileType: FILE_TYPES.KHBD, uploadedAt: '2026-09-11', url: '#' },
            { fileName: `KHGD_Tuan${String(selectedWeek).padStart(2, '0')}_LeThiBinh.docx`, fileType: FILE_TYPES.KHGD, uploadedAt: '2026-09-11', url: '#' },
            { fileName: `DCTD_Tuan${String(selectedWeek).padStart(2, '0')}_LeThiBinh.docx`, fileType: FILE_TYPES.DCTD, uploadedAt: '2026-09-11', url: '#' },
          ]
        },
        't3': {
          teacherId: 't3',
          submittedAt: null,
          teacherNote: null,
          leadStatus: 'incomplete',
          leadNote: null,
          bghRating: null,
          bghFeedback: null,
          files: []
        },
        't4': {
          teacherId: 't4',
          submittedAt: '2026-09-12T09:00:00Z',
          teacherNote: 'Gửi tổ chuyên môn kiểm tra',
          leadStatus: 'pending',
          leadNote: null,
          bghRating: null,
          bghFeedback: null,
          files: [
            { fileName: `KHBD_Tuan${String(selectedWeek).padStart(2, '0')}_TranThiDieu.docx`, fileType: FILE_TYPES.KHBD, uploadedAt: '2026-09-12', url: '#' },
            { fileName: `KHGD_Tuan${String(selectedWeek).padStart(2, '0')}_TranThiDieu.docx`, fileType: FILE_TYPES.KHGD, uploadedAt: '2026-09-12', url: '#' },
            { fileName: `DCTD_Tuan${String(selectedWeek).padStart(2, '0')}_TranThiDieu.docx`, fileType: FILE_TYPES.DCTD, uploadedAt: '2026-09-12', url: '#' },
          ]
        }
      };
      setSubmissions(initialSubmissions);
      localStorage.setItem(storageKey, JSON.stringify(initialSubmissions));
    }
  }, [selectedWeek, user.grade]);

  // Nút Quét Google Drive (Drive API Scan Simulation)
  const handleScanDrive = (teacherId: string, teacherName: string) => {
    setScanningId(teacherId);
    
    setTimeout(() => {
      setScanningId(null);
      const currentSub = submissions[teacherId];
      const cleanName = teacherName.replace(/\s+/g, '');
      
      let updatedFiles = [...(currentSub?.files || [])];
      
      // Giả lập phát hiện file DCTD nếu là An (t1) nộp thiếu
      if (teacherId === 't1' && !updatedFiles.some(f => f.fileType === FILE_TYPES.DCTD)) {
        updatedFiles.push({
          fileName: `DCTD_Tuan${String(selectedWeek).padStart(2, '0')}_${cleanName}.docx`,
          fileType: FILE_TYPES.DCTD,
          uploadedAt: new Date().toISOString().split('T')[0],
          url: '#',
        });
      }
      
      const newSub: DemoSubmission = {
        ...currentSub,
        submittedAt: currentSub?.submittedAt || (updatedFiles.length > 0 ? new Date().toISOString() : null),
        files: updatedFiles,
      };

      const newSubmissions = {
        ...submissions,
        [teacherId]: newSub,
      };

      setSubmissions(newSubmissions);
      const gradeSuffix = user.grade || 'Khối 1';
      localStorage.setItem(`qms_lead_submissions_w${selectedWeek}_${gradeSuffix}`, JSON.stringify(newSubmissions));
      
      alert(`[Drive API] Quét thành công thư mục giáo viên ${teacherName}. Phát hiện: ${updatedFiles.length} file.`);
    }, 1500);
  };

  const handleVerifyClick = (teacher: TeacherData) => {
    setSelectedTeacher(teacher);
    const sub = submissions[teacher.id];
    setVerificationNote(sub?.leadNote || '');
  };

  // Xác nhận nộp đủ và gửi email SMTP
  const submitVerification = async (status: 'verified' | 'incomplete') => {
    if (!selectedTeacher) return;
    setIsSubmitting(true);
    setSmtpLog(null);

    const sub = submissions[selectedTeacher.id];
    
    // Kiểm tra xem có đang chạy trên tài khoản thật có ID không
    const isReal = 'id' in user && !!user.id;

    if (isReal) {
      try {
        // 1. Gọi API gửi mail SMTP thật ở server-side
        const emailResponse = await fetch('/api/mail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacherEmail: selectedTeacher.email,
            teacherName: selectedTeacher.fullName,
            weekNumber: selectedWeek,
            grade: user.grade,
            leadName: user.fullName,
            status: status,
            note: verificationNote,
          }),
        });

        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          throw new Error(emailResult.error || 'Lỗi gửi email.');
        }

        // 2. Lưu trạng thái nộp bài vào cơ sở dữ liệu Supabase thật
        const { error } = await supabase.from('submissions').upsert({
          teacher_id: selectedTeacher.id,
          week_number: selectedWeek,
          school_year: '2026-2027',
          lead_status: status,
          lead_note: verificationNote,
          lead_verified_at: new Date().toISOString(),
          lead_id: (user as any).id,
        });

        if (error) throw error;

        // Cập nhật giao diện
        const updatedSub: DemoSubmission = {
          ...sub,
          leadStatus: status,
          leadNote: verificationNote,
        };

        setSubmissions(prev => ({
          ...prev,
          [selectedTeacher.id]: updatedSub,
        }));

        setSuccessMsg(`Đã duyệt và gửi email thông báo thật thành công tới Thầy/Cô ${selectedTeacher.fullName}!`);
      } catch (err: any) {
        console.error('Lỗi duyệt báo cáo:', err);
        alert(`Duyệt thất bại: ${err.message || 'Lỗi kết nối mạng.'}`);
      } finally {
        setIsSubmitting(false);
        setSelectedTeacher(null);
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } else {
      // Chế độ dùng thử (Demo Mode)
      setTimeout(() => {
        const updatedSub: DemoSubmission = {
          ...sub,
          leadStatus: status,
          leadNote: verificationNote,
        };

        const newSubmissions = {
          ...submissions,
          [selectedTeacher.id]: updatedSub,
        };

        setSubmissions(newSubmissions);
        const gradeSuffix = user.grade || 'Khối 1';
        localStorage.setItem(`qms_lead_submissions_w${selectedWeek}_${gradeSuffix}`, JSON.stringify(newSubmissions));

        const titlePrefix = status === 'verified' ? '[QMS-EDU] Xác nhận' : '[QMS-EDU] Yêu cầu bổ sung';
        setSmtpLog(`
[SMTP Server] Connecting to smtp.gmail.com:587...
[SMTP Server] Authenticating as school.admin@school.edu.vn...
[SMTP Mail] Sending mail to: ${selectedTeacher.email}
[SMTP Mail] Subject: ${titlePrefix} hoàn thành nộp tài liệu tuần ${selectedWeek}
[SMTP Mail] Body HTML: Gửi giáo viên ${selectedTeacher.fullName}. Nhận xét: "${verificationNote || 'Không có'}"
[SMTP Server] Mail sent successfully! Message-ID: <${Math.random().toString(36).substring(7)}@gmail.com>
        `.trim());

        setTimeout(() => {
          setIsSubmitting(false);
          setSelectedTeacher(null);
          setSmtpLog(null);
          setSuccessMsg(`Đã xác nhận trạng thái báo cáo tuần ${selectedWeek} cho giáo viên ${selectedTeacher.fullName}!`);
          setTimeout(() => setSuccessMsg(null), 5000);
        }, 1500);

      }, 1000);
    }
  };

  const dateRange = getWeekDateRange(selectedWeek, schoolStartDate);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* HEADER - OLM Style */}
      <header className="relative z-10 bg-indigo-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shadow">
            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-gradient-to-tr from-blue-600 to-orange-500 text-xs font-black text-white">
              Q
            </div>
          </div>
          <div>
            <div className="text-sm font-black text-white leading-none">QMS-EDU</div>
            <div className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold mt-0.5">Khối trưởng Workspace</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">Khối trưởng: {user.fullName}</div>
            <div className="text-[10px] text-indigo-200 font-bold bg-indigo-800 px-2.5 py-0.5 rounded-full inline-block mt-0.5 shadow-sm">
              Quản lý: {user.grade}
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

      {/* SUB HEADER - TAB / WEEK SELECTOR */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Chọn Tuần kiểm duyệt:</label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          >
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Tuần {w}</option>
            ))}
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Lịch học tuần {selectedWeek}: <span className="text-indigo-600">{formatDate(dateRange.start)}</span> đến <span className="text-indigo-600">{formatDate(dateRange.end)}</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-6 space-y-6 max-w-7xl w-full mx-auto">
        
        {/* Banner Success */}
        {successMsg && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-700 font-bold animate-fade-in shadow-sm">
            ✅ {successMsg}
          </div>
        )}

        {/* DANH SÁCH GIÁO VIÊN VÀ BÁO CÁO CỦA HỌ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Theo dõi và Duyệt giáo án {user.grade} (Tuần {selectedWeek})
            </h2>
            <span className="text-[10px] text-slate-400 font-bold">Tổng số giáo viên: {teachers.length}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {teachers.map((teacher) => {
              const sub = submissions[teacher.id];
              const isScanning = scanningId === teacher.id;

              return (
                <div key={teacher.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-sm transition-all flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                  
                  {/* Cột 1: Thông tin giáo viên & Ghi chú nộp */}
                  <div className="space-y-2 lg:max-w-sm w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👩‍🏫</span>
                      <div>
                        <h3 className="font-bold text-slate-800 leading-tight">{teacher.fullName}</h3>
                        <span className="text-[10px] text-slate-400 font-medium">{teacher.email}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pl-7 space-y-1">
                      <div>📁 <strong>Thư mục Drive:</strong> <code className="text-indigo-600 text-[10px]">{teacher.driveFolder}</code></div>
                      {sub?.submittedAt ? (
                        <div className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 italic">
                          "Gửi kèm: {sub.teacherNote || 'Không ghi chú'}"
                        </div>
                      ) : (
                        <div className="text-slate-400 italic mt-1">Chưa bấm xác nhận đã nộp trên App</div>
                      )}
                    </div>
                  </div>

                  {/* Cột 2: Các file hiện có (Được quét từ Google Drive) */}
                  <div className="flex-grow w-full lg:max-w-md">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tài liệu đã quét trên Drive</div>
                    
                    {!sub || sub.files.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Thư mục Drive trống. Giáo viên chưa tải tài liệu lên.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {sub.files.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50 text-[11px]">
                            <span className="text-slate-700 font-medium truncate max-w-[250px]">📄 {file.fileName}</span>
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">{file.fileType}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cột 3: Trạng thái & Tác vụ kiểm duyệt */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto items-stretch lg:items-end justify-between self-stretch">
                    
                    {/* Badge trạng thái */}
                    <div className="text-right">
                      {!sub?.submittedAt ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">Chưa nộp bài</span>
                      ) : sub.leadStatus === 'pending' ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200 animate-pulse">Chờ kiểm duyệt</span>
                      ) : sub.leadStatus === 'incomplete' ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-orange-50 text-orange-600 border border-orange-200">Cần bổ sung</span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">✓ Đã duyệt nộp đủ</span>
                      )}
                    </div>

                    {/* Nút tác vụ */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleScanDrive(teacher.id, teacher.fullName)}
                        disabled={isScanning}
                        className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        {isScanning ? '🔄 Đang quét...' : '🔍 Quét Drive'}
                      </button>

                      <button
                        onClick={() => handleVerifyClick(teacher)}
                        disabled={!sub?.submittedAt}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        ⚖️ Duyệt & Gửi mail
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* POPUP MODAL DUYỆT & NHẬN XÉT GỬI MAIL */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-orange-500"></div>

            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
              ⚖️ Duyệt hồ sơ nộp Tuần {selectedWeek} - {selectedTeacher.fullName}
            </h3>

            <div className="space-y-4">
              {/* Box Info */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5 text-slate-600">
                <div>• <strong>Người nhận mail thông báo:</strong> {selectedTeacher.fullName}</div>
                <div>• <strong>Địa chỉ Gmail gửi thật:</strong> {selectedTeacher.email}</div>
                <div>• <strong>Tuần học kiểm duyệt:</strong> Tuần {selectedWeek}</div>
              </div>

              {/* Nhận xét */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase">Nhận xét chuyên môn / Yêu cầu bổ sung</label>
                <textarea
                  rows={4}
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Nhập nhận xét (ví dụ: Giáo án soạn đúng chuẩn... hoặc Yêu cầu tải thêm file điều chỉnh sau tiết dạy...)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>

              {/* SMTP Logs display */}
              {smtpLog && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 max-h-[120px] overflow-y-auto whitespace-pre-wrap">
                  {smtpLog}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedTeacher(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  Hủy bỏ
                </button>
                
                <button
                  onClick={() => submitVerification('incomplete')}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Yêu cầu Bổ sung (Mail 🔴)'}
                </button>
                
                <button
                  onClick={() => submitVerification('verified')}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Xác nhận Nộp đủ (Mail 🟢)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
