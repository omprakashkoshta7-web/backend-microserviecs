require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');

const { connectDB } = require('../../shared/db');
const { Notification } = require('../../shared/models');
const { authMiddleware } = require('../../shared/auth');
const { sendEmail } = require('../../shared/email');
const { processTemplate, validateTemplate, extractVariables, generateSampleData } = require('../../shared/template');

const app = express();
const PORT = process.env.NOTIFICATIONS_PORT || 5005;

app.use(compression());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Notifications service running on http://localhost:${PORT}`);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'notifications' });
});

// Notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.userId, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin email templates
app.post('/api/admin/email-templates/send-test', authMiddleware, async (req, res) => {
  try {
    const { template, toEmail, variables = {} } = req.body;

    if (!template || typeof template !== 'object') {
      return res.status(400).json({ message: 'Template data is required' });
    }

    if (!toEmail || typeof toEmail !== 'string') {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail.trim())) {
      return res.status(400).json({ message: 'Invalid recipient email address' });
    }

    const hasResendConfig = !!process.env.RESEND_API_KEY;
    const hasSmtpConfig = !!((process.env.SMTP_USER || process.env.EMAIL_USER) && (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD));

    if (!hasResendConfig && !hasSmtpConfig) {
      return res.status(500).json({
        message: 'Email service is not configured. Set RESEND_API_KEY + EMAIL_FROM, or SMTP/EMAIL credentials in backend .env'
      });
    }

    const validation = validateTemplate(template);
    if (!validation.isValid) {
      return res.status(400).json({ message: 'Invalid template', errors: validation.errors });
    }

    const foundVars = extractVariables(`${template.subject || ''} ${template.body || ''}`);
    const variableList = [...new Set([...(template.variables || []), ...foundVars])];
    const sampleData = generateSampleData(variableList);
    const templateVariables = { ...sampleData, ...variables };

    const subject = processTemplate(template.subject, templateVariables);
    const body = processTemplate(template.body, templateVariables);

    const emailResult = await sendEmail(toEmail.trim(), subject, body, { fromName: 'E-Commerce Admin' });

    if (!emailResult.success) {
      return res.status(500).json({
        message: 'Failed to send email',
        error: emailResult.error || 'Unknown email error'
      });
    }

    res.json({
      message: 'Test email sent successfully',
      messageId: emailResult.messageId,
      to: emailResult.to,
      subject: emailResult.subject
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
