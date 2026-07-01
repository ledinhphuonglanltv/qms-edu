import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      teacherId, 
      weekNumber, 
      schoolYear = '2026-2027', 
      bghRating, 
      bghFeedback, 
      bghId, 
      isElite 
    } = body;

    if (!teacherId || !weekNumber || !bghRating || !bghFeedback || !bghId) {
      return NextResponse.json({ error: 'Thiếu thông tin đánh giá bắt buộc.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    console.log(`[BGH API] Lưu đánh giá cho giáo viên ${teacherId}, Tuần ${weekNumber}, Xếp loại: ${bghRating}...`);

    // Thực hiện upsert bằng Admin client (bypass RLS)
    const { data, error } = await supabase
      .from('submissions')
      .upsert({
        teacher_id: teacherId,
        week_number: Number(weekNumber),
        school_year: schoolYear,
        bgh_rating: bghRating,
        bgh_feedback: bghFeedback,
        bgh_rated_at: new Date().toISOString(),
        bgh_id: bghId,
        is_elite: isElite === true
      }, {
        onConflict: 'teacher_id,week_number,school_year'
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[BGH API] Lỗi lưu database:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu kết quả đánh giá thi đua thành công.',
      data
    });

  } catch (err: any) {
    console.error('[BGH API] Lỗi API:', err);
    return NextResponse.json({ error: err.message || 'Lỗi lưu đánh giá ở Server.' }, { status: 500 });
  }
}
