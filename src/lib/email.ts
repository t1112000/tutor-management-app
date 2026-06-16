import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SessionInfo {
  studentName: string;
  subject: "english" | "chinese";
  startTime: string;
  endTime: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  english: "Tiếng Anh",
  chinese: "Tiếng Trung",
};

export async function sendReminderEmail(
  to: string,
  dateStr: string,
  sessions: SessionInfo[]
): Promise<void> {
  const sessionRows = sessions
    .map(
      (s) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${s.startTime}–${s.endTime}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${s.studentName}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${SUBJECT_LABELS[s.subject] ?? s.subject}</td></tr>`
    )
    .join("");

  const [year, month, day] = dateStr.split("-");
  const displayDate = `${day}/${month}/${year}`;

  await resend.emails.send({
    from: "MyClass <onboarding@resend.dev>",
    to,
    subject: `Lịch dạy ngày ${displayDate}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#ec4899;color:white;padding:20px;border-radius:12px 12px 0 0">
          <h2 style="margin:0">📅 Lịch dạy hôm nay</h2>
          <p style="margin:4px 0 0;opacity:0.9">${displayDate}</p>
        </div>
        <div style="background:white;border:1px solid #f3f4f6;border-top:none;border-radius:0 0 12px 12px;padding:0">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#fdf2f8">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af">GIỜ</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af">HỌC SINH</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af">MÔN</th>
              </tr>
            </thead>
            <tbody>${sessionRows}</tbody>
          </table>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px">MyClass - Quản lý dạy học</p>
      </div>
    `,
  });
}
