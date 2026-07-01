import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseClient';
import { sendBghEvaluationEmail } from '@/services/emailService';

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
      isElite,
      criteriaRatings,
      eliteFileName,
      eliteFileUrl
    } = body;

    if (!teacherId || !weekNumber || !bghRating || !bghId) {
      return NextResponse.json({ error: 'Thiếu thông tin đánh giá bắt buộc.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    console.log(`[BGH API] Lưu đánh giá cho giáo viên ${teacherId}, Tuần ${weekNumber}, Xếp loại: ${bghRating}...`);

    // 1. Lưu kết quả đánh giá (bao gồm cả 6 tiêu chí chi tiết và thông tin file học liệu vàng) vào bảng submissions
    const { data: submission, error: subErr } = await supabase
      .from('submissions')
      .upsert({
        teacher_id: teacherId,
        week_number: Number(weekNumber),
        school_year: schoolYear,
        bgh_rating: bghRating,
        bgh_feedback: bghFeedback || '',
        bgh_rated_at: new Date().toISOString(),
        bgh_id: bghId,
        is_elite: isElite === true,
        criteria_muc_tieu: criteriaRatings?.['muc_tiêu'] || 'Đạt',
        criteria_hoat_dong: criteriaRatings?.['hoat_dong'] || 'Đạt',
        criteria_phuong_phap: criteriaRatings?.['phuong_phap'] || 'Đạt',
        criteria_thiet_bi: criteriaRatings?.['thiet_bi'] || 'Đạt',
        criteria_danh_gia: criteriaRatings?.['danh_gia'] || 'Đạt',
        criteria_trinh_bay: criteriaRatings?.['trinh_bay'] || 'Đạt',
        elite_file_name: eliteFileName || null,
        elite_file_url: eliteFileUrl || null
      }, {
        onConflict: 'teacher_id,week_number,school_year'
      })
      .select()
      .maybeSingle();

    if (subErr) {
      console.error('[BGH API] Lỗi lưu database submissions:', subErr);
      throw subErr;
    }

    // 2. Chỉ gửi email cho Giáo viên khi Ban Giám Hiệu có nhập nhận xét/góp ý chi tiết
    if (bghFeedback && bghFeedback.trim() !== '') {
      try {
        // Lấy thông tin email và tên của giáo viên từ bảng profiles
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', teacherId)
          .single();

        if (teacherProfile && teacherProfile.email) {
          console.log(`[BGH API] Đang gửi email thông báo kết quả đánh giá bảo mật tới: ${teacherProfile.email}`);
          
          // Tạo chuỗi điểm tiêu chí định dạng HTML để chèn vào mail
          const criteriaText = `
            • <strong>1. Mục tiêu bài dạy (Kiến thức, năng lực, phẩm chất):</strong> ${criteriaRatings?.['muc_tiêu'] || 'Đạt'}<br/>
            • <strong>2. Tiến trình và chuỗi hoạt động học của học sinh:</strong> ${criteriaRatings?.['hoat_dong'] || 'Đạt'}<br/>
            • <strong>3. Phương pháp, kĩ thuật dạy học tích cực áp dụng:</strong> ${criteriaRatings?.['phuong_phap'] || 'Đạt'}<br/>
            • <strong>4. Thiết bị dạy học và học liệu sử dụng phù hợp:</strong> ${criteriaRatings?.['thiet_bi'] || 'Đạt'}<br/>
            • <strong>5. Phương án kiểm tra, đánh giá kết quả hoạt động:</strong> ${criteriaRatings?.['danh_gia'] || 'Đạt'}<br/>
            • <strong>6. Trình bày khoa học, phần điều chỉnh thực tế sâu sắc:</strong> ${criteriaRatings?.['trinh_bay'] || 'Đạt'}
          `;

          await sendBghEvaluationEmail(
            teacherProfile.email,
            teacherProfile.full_name || 'Giáo viên',
            Number(weekNumber),
            bghRating,
            bghFeedback,
            criteriaText
          );
          
          console.log('[BGH API] Gửi email thông báo cho giáo viên thành công.');
        } else {
          console.warn('[BGH API] Không tìm thấy email giáo viên để gửi thông báo.');
        }
      } catch (mailErr) {
        console.error('[BGH API] Lỗi trong quá trình gửi mail:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu kết quả đánh giá thi đua và gửi email thông báo riêng tư thành công.',
      data: submission
    });

  } catch (err: any) {
    console.error('[BGH API] Lỗi API:', err);
    return NextResponse.json({ error: err.message || 'Lỗi lưu đánh giá ở Server.' }, { status: 500 });
  }
}
