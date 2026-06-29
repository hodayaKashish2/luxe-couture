import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// החליפי את הטוקן הזה בטוקן החינמי שתקבלי מ-Resend (לוקח דקה להירשם אליהם)
const resend = new Resend('re_hqRjJjLs_PB11QWB3Mmx9XLVYahNWqpoa');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, dressName, date } = body;

    // שליחת המייל האוטומטי
    const { data, error } = await resend.emails.send({
      from: 'DressRental <onboarding@resend.dev>', // כתובת השולח (במסלול החינמי זה קבוע)
      to: 'hodayaka1212@gmail.com', // 🌟 הכתובת שלך! (כדי שתקבלי התראה למייל שלך על כל הזמנה חדשה)
      subject: `👗 הזמנה חדשה באתר! ${name}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded: 12px;">
          <h2 style="color: #1c1917;">יש לך הזמנה חדשה באתר השמלות!</h2>
          <p><strong>שם הלקוחה:</strong> ${name}</p>
          <p><strong>מספר טלפון:</strong> ${phone}</p>
          <p><strong>השמלה המבוקשת:</strong> ${dressName}</p>
          <p><strong>תאריך האירוע:</strong> ${date}</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <p style="font-size: 12px; color: #a1a1aa;">הודעה זו נשלחה אוטומטית מאתר Dress Rental שלך.</p>
        </div>
      `,
    });

    if (error) {
      console.error('שגיאה משירות המיילים:', error);
      return NextResponse.json({ success: false, error: 'שגיאה בשליחת המייל' });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('תקלה פנימית בשרת:', error);
    return NextResponse.json({ success: false, error: 'תקלה פנימית' }, { status: 500 });
  }
}