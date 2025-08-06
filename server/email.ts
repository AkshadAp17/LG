import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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
  const subject = `Case Approved - ${caseTitle}`;
  const text = `Your case "${caseTitle}" has been approved. PNR: ${pnr}. Hearing Date: ${hearingDate}`;
  
  await Promise.all([
    sendEmail(userEmail, subject, text),
    sendEmail(lawyerEmail, subject, text),
  ]);
};

export const sendCaseRejectionEmail = async (
  userEmail: string, 
  lawyerEmail: string, 
  caseTitle: string, 
  reason?: string
) => {
  const subject = `Case Rejected - ${caseTitle}`;
  const text = `Your case "${caseTitle}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`;
  
  await Promise.all([
    sendEmail(userEmail, subject, text),
    sendEmail(lawyerEmail, subject, text),
  ]);
};
