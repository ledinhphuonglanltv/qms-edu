import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail, sendIncompleteEmail } from '@/services/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherEmail, teacherName, weekNumber, grade, leadName, status, note } = body;

    // Validate dữ liệu đầu vào
    if (!teacherEmail || !teacherName || !weekNumber || !grade || !leadName || !status) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc để gửi mail.' },
        { status: 400 }
      );
    }

    if (status === 'verified') {
      await sendVerificationEmail(teacherEmail, teacherName, Number(weekNumber), grade, leadName, note);
    } else if (status === 'incomplete') {
      await sendIncompleteEmail(teacherEmail, teacherName, Number(weekNumber), grade, leadName, note);
    } else {
      return NextResponse.json(
        { success: false, error: 'Trạng thái gửi mail không hợp lệ (phải là verified hoặc incomplete).' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Đã gửi email thông báo thành công qua SMTP trường.' });
  } catch (error: any) {
    console.error('Lỗi API gửi mail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống khi gửi email.' },
      { status: 500 }
    );
  }
}
