import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseClient';
import { sendVerificationEmail, sendIncompleteEmail } from '@/services/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      teacherId, 
      leadId, 
      teacherEmail, 
      teacherName, 
      weekNumber, 
      grade, 
      leadName, 
      status, 
      note 
    } = body;

    // Validate dữ liệu đầu vào
    if (!teacherId || !leadId || !teacherEmail || !teacherName || !weekNumber || !grade || !leadName || !status) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc để thực hiện phản hồi.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Cập nhật trạng thái duyệt vào bảng submissions bằng Supabase Admin Client (Bypass RLS bảo mật)
    console.log(`[API Mail] Đang cập nhật trạng thái submissions cho giáo viên ID: ${teacherId}, tuần: ${weekNumber} sang: ${status}...`);
    const { error: dbError } = await supabase
      .from('submissions')
      .upsert({
        teacher_id: teacherId,
        week_number: Number(weekNumber),
        school_year: '2026-2027',
        lead_status: status,
        lead_note: note || '',
        lead_verified_at: new Date().toISOString(),
        lead_id: leadId,
      }, {
        onConflict: 'teacher_id,week_number,school_year'
      });

    if (dbError) {
      console.error('[API Mail] Lỗi cập nhật cơ sở dữ liệu submissions:', dbError);
      throw new Error(`Lỗi cập nhật trạng thái dữ liệu: ${dbError.message}`);
    }

    // 2. Gửi email thông báo qua SMTP
    console.log(`[API Mail] Gửi email thông báo trạng thái ${status} tới ${teacherEmail}...`);
    if (status === 'verified') {
      await sendVerificationEmail(teacherEmail, teacherName, Number(weekNumber), grade, leadName, note);
    } else if (status === 'incomplete') {
      await sendIncompleteEmail(teacherEmail, teacherName, Number(weekNumber), grade, leadName, note);
    } else {
      return NextResponse.json(
        { success: false, error: 'Trạng thái phản hồi không hợp lệ (phải là verified hoặc incomplete).' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cập nhật trạng thái và gửi email thông báo thành công qua SMTP trường.' 
    });
  } catch (error: any) {
    console.error('Lỗi API phản hồi & gửi mail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống khi thực hiện phản hồi.' },
      { status: 500 }
    );
  }
}
