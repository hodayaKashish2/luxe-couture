import { NextResponse } from 'next/server';
import { sendAdminEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, dressName, date } = body;

    if (!name || !phone || !dressName || !date) {
      return NextResponse.json({ success: false, error: 'חסרים פרטים בהזמנה' }, { status: 400 });
    }

    const result = await sendAdminEmail(
      `👗 הזמנה חדשה באתר! ${name}`,
      `
        <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h2 style="color: #1c1917;">יש לך הזמנה חדשה באתר השמלות!</h2>
          <p><strong>שם הלקוחה:</strong> ${name}</p>
          <p><strong>מספר טלפון:</strong> ${phone}</p>
          ${email ? `<p><strong>אימייל:</strong> ${email}</p>` : ''}
          <p><strong>השמלה המבוקשת:</strong> ${dressName}</p>
          <p><strong>תאריך האירוע:</strong> ${date}</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <p style="font-size: 12px; color: #a1a1aa;">הודעה זו נשלחה אוטומטית מאתר שמלה בקליק.</p>
        </div>
      `
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('תקלה פנימית בשרת:', error);
    return NextResponse.json({ success: false, error: 'תקלה פנימית' }, { status: 500 });
  }
}
