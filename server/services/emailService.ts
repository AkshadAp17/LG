import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Role-based email recipients
const roleEmails = {
  client: 'client@legalcase.com',
  lawyer: 'lawyer@legalcase.com', 
  police: 'police@legalcase.com'
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  role?: 'client' | 'lawyer' | 'police';
}

export class EmailService {
  static async sendEmail({ to, subject, html, role }: EmailOptions) {
    try {
      // If role is provided, also send to role-specific email
      const recipients = [to];
      if (role && roleEmails[role]) {
        recipients.push(roleEmails[role]);
      }

      const mailOptions = {
        from: `Legal Case Management <${process.env.EMAIL_USER}>`,
        to: recipients.join(', '),
        subject: `[Legal Case Management] ${subject}`,
        html: this.getEmailTemplate(subject, html)
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  static async sendCaseApprovalNotification(caseTitle: string, clientEmail: string, lawyerEmail?: string) {
    const subject = `Case Approved: ${caseTitle}`;
    const html = `
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0066cc;">✅ Case Approved</h2>
        <p>Good news! Your case "<strong>${caseTitle}</strong>" has been approved by the police department.</p>
        <p>Your case will now proceed to the next stage. You will be notified of any updates.</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #e0f2fe; border-radius: 6px;">
          <p style="margin: 0; color: #0277bd;"><strong>Next Steps:</strong></p>
          <ul style="color: #0277bd; margin: 10px 0;">
            <li>Your assigned lawyer will contact you soon</li>
            <li>Case proceedings will begin as scheduled</li>
            <li>You can track progress in your dashboard</li>
          </ul>
        </div>
      </div>
    `;

    await this.sendEmail({ to: clientEmail, subject, html, role: 'client' });
    
    if (lawyerEmail) {
      await this.sendEmail({ 
        to: lawyerEmail, 
        subject: `New Approved Case: ${caseTitle}`, 
        html: `
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #0066cc;">📋 New Case Assignment</h2>
            <p>A new case "<strong>${caseTitle}</strong>" has been approved and assigned to you.</p>
            <p>Please review the case details and contact your client to begin proceedings.</p>
          </div>
        `,
        role: 'lawyer' 
      });
    }
  }

  static async sendCaseRejectionNotification(caseTitle: string, clientEmail: string, reason?: string) {
    const subject = `Case Status Update: ${caseTitle}`;
    const html = `
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px;">
        <h2 style="color: #dc2626;">❌ Case Requires Review</h2>
        <p>Your case "<strong>${caseTitle}</strong>" requires additional review.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <div style="margin-top: 20px; padding: 15px; background-color: #fee2e2; border-radius: 6px;">
          <p style="margin: 0; color: #991b1b;"><strong>Next Steps:</strong></p>
          <ul style="color: #991b1b; margin: 10px 0;">
            <li>Review the feedback provided</li>
            <li>Update your case with additional information</li>
            <li>Resubmit for approval when ready</li>
          </ul>
        </div>
      </div>
    `;

    await this.sendEmail({ to: clientEmail, subject, html, role: 'client' });
  }

  static async sendNewMessageNotification(senderName: string, recipientEmail: string, messagePreview: string, recipientRole: 'client' | 'lawyer' | 'police') {
    const subject = `New Message from ${senderName}`;
    const html = `
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0066cc;">💬 New Message</h2>
        <p>You have received a new message from <strong>${senderName}</strong>.</p>
        <div style="margin: 15px 0; padding: 15px; background-color: #e2e8f0; border-radius: 6px; border-left: 4px solid #0066cc;">
          <p style="margin: 0; font-style: italic;">"${messagePreview}..."</p>
        </div>
        <p>Log in to your dashboard to view the full message and respond.</p>
      </div>
    `;

    await this.sendEmail({ to: recipientEmail, subject, html, role: recipientRole });
  }

  static async sendDocumentUploadNotification(documentName: string, caseTitle: string, uploaderName: string, recipientEmail: string, recipientRole: 'client' | 'lawyer' | 'police') {
    const subject = `New Document: ${documentName}`;
    const html = `
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px;">
        <h2 style="color: #059669;">📄 New Document Uploaded</h2>
        <p><strong>${uploaderName}</strong> has uploaded a new document for case "<strong>${caseTitle}</strong>".</p>
        <div style="margin: 15px 0; padding: 15px; background-color: #dcfce7; border-radius: 6px;">
          <p style="margin: 0; color: #047857;"><strong>Document:</strong> ${documentName}</p>
          <p style="margin: 5px 0 0 0; color: #047857;"><strong>Case:</strong> ${caseTitle}</p>
        </div>
        <p>Access your document vault to view and download the file.</p>
      </div>
    `;

    await this.sendEmail({ to: recipientEmail, subject, html, role: recipientRole });
  }

  static async sendCaseRequestNotification(caseTitle: string, clientName: string, lawyerEmail: string) {
    const subject = `New Case Request: ${caseTitle}`;
    const html = `
      <div style="background-color: #fefbeb; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d97706;">⚖️ New Case Request</h2>
        <p>You have received a new case request from <strong>${clientName}</strong>.</p>
        <div style="margin: 15px 0; padding: 15px; background-color: #fef3c7; border-radius: 6px;">
          <p style="margin: 0; color: #b45309;"><strong>Case:</strong> ${caseTitle}</p>
          <p style="margin: 5px 0 0 0; color: #b45309;"><strong>Client:</strong> ${clientName}</p>
        </div>
        <p>Please review the case details and respond to the client.</p>
      </div>
    `;

    await this.sendEmail({ to: lawyerEmail, subject, html, role: 'lawyer' });
  }

  static getEmailTemplate(subject: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚖️ Legal Case Management</h1>
          <p style="color: #e2e8f0; margin: 5px 0 0 0;">Professional Legal Services</p>
        </div>
        
        ${content}
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            This is an automated notification from Legal Case Management System.<br>
            Please do not reply to this email.
          </p>
          <div style="margin-top: 15px;">
            <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Access Dashboard
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}