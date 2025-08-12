import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendCaseApprovalEmail = async (
  userEmail: string, 
  lawyerEmail: string, 
  caseTitle: string, 
  pnr: string, 
  hearingDate: string
) => {
  const subject = `✅ Case Approved - ${caseTitle}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #10b981; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="color: white; font-size: 24px;">✅</span>
          </div>
          <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: bold;">Case Approved!</h1>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-bottom: 20px;">
          <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">Case Details</h3>
          <p style="color: #475569; margin: 8px 0;"><strong>Case:</strong> ${caseTitle}</p>
          <p style="color: #475569; margin: 8px 0;"><strong>PNR:</strong> ${pnr}</p>
          <p style="color: #475569; margin: 8px 0;"><strong>Hearing Date:</strong> ${hearingDate}</p>
        </div>
        
        <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
          Your case has been officially approved by the police authorities. Please keep your PNR number safe for future reference.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #94a3b8; font-size: 14px;">
            Legal Case Management System<br>
            Professional Legal Services
          </p>
        </div>
      </div>
    </div>
  `;
  
  await Promise.all([
    sendEmail(userEmail, subject, `Your case "${caseTitle}" has been approved. PNR: ${pnr}. Hearing Date: ${hearingDate}`, htmlContent),
    sendEmail(lawyerEmail, subject, `Case "${caseTitle}" has been approved. PNR: ${pnr}. Hearing Date: ${hearingDate}`, htmlContent),
  ]);
};

export const sendCaseRejectionEmail = async (
  userEmail: string, 
  lawyerEmail: string, 
  caseTitle: string, 
  reason?: string
) => {
  const subject = `❌ Case Rejected - ${caseTitle}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #ef4444; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="color: white; font-size: 24px;">❌</span>
          </div>
          <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: bold;">Case Rejected</h1>
        </div>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
          <h3 style="color: #991b1b; margin: 0 0 10px 0;">Case Details</h3>
          <p style="color: #475569; margin: 8px 0;"><strong>Case:</strong> ${caseTitle}</p>
          ${reason ? `<p style="color: #475569; margin: 8px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        
        <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
          Unfortunately, your case has been rejected by the police authorities. ${reason ? 'Please review the reason provided above.' : 'Please contact the relevant authorities for more information.'}
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #94a3b8; font-size: 14px;">
            Legal Case Management System<br>
            Professional Legal Services
          </p>
        </div>
      </div>
    </div>
  `;
  
  await Promise.all([
    sendEmail(userEmail, subject, `Your case "${caseTitle}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`, htmlContent),
    sendEmail(lawyerEmail, subject, `Case "${caseTitle}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`, htmlContent),
  ]);
};
