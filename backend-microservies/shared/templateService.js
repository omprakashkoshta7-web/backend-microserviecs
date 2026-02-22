// Process email template with variables
function processTemplate(template, variables) {
  if (!template) return '';
  
  let processed = template;
  
  // Replace all variables in format {variableName}
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    const value = variables[key] !== undefined ? variables[key] : '';
    processed = processed.replace(regex, value);
  });
  
  return processed;
}

// Get template by name
function getTemplateByName(templates, name) {
  return templates.find(t => t.name === name && t.isActive);
}

// Validate template variables
function validateTemplate(template) {
  const errors = [];
  
  if (!template.name || template.name.trim() === '') {
    errors.push('Template name is required');
  }
  
  if (!template.subject || template.subject.trim() === '') {
    errors.push('Subject line is required');
  }
  
  if (!template.body || template.body.trim() === '') {
    errors.push('Email body is required');
  }
  
  if (!template.category) {
    errors.push('Category is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Extract variables from template text
function extractVariables(text) {
  const regex = /\{([^}]+)\}/g;
  const variables = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

// Generate sample data for testing
function generateSampleData(variables) {
  const sampleData = {};
  
  variables.forEach(variable => {
    switch (variable) {
      case 'customerName':
        sampleData[variable] = 'John Doe';
        break;
      case 'orderId':
        sampleData[variable] = 'ORD123456';
        break;
      case 'trackingId':
        sampleData[variable] = 'TRACK789012';
        break;
      case 'total':
        sampleData[variable] = '2499';
        break;
      case 'email':
        sampleData[variable] = 'customer@example.com';
        break;
      case 'phone':
        sampleData[variable] = '+91 9876543210';
        break;
      case 'resetCode':
        sampleData[variable] = '123456';
        break;
      case 'resetLink':
        sampleData[variable] = 'https://yourstore.com/reset-password';
        break;
      case 'refundAmount':
        sampleData[variable] = '2499';
        break;
      case 'courierName':
        sampleData[variable] = 'Blue Dart';
        break;
      case 'deliveryDate':
        sampleData[variable] = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();
        break;
      case 'orderDate':
        sampleData[variable] = new Date().toLocaleDateString();
        break;
      case 'items':
        sampleData[variable] = 'Blue Dress, Red Shoes, Black Bag';
        break;
      default:
        sampleData[variable] = `[${variable}]`;
    }
  });
  
  return sampleData;
}

// Format email template for display
function formatTemplatePreview(template, sampleData) {
  const subject = processTemplate(template.subject, sampleData);
  const body = processTemplate(template.body, sampleData);
  
  return {
    subject,
    body,
    variables: template.variables,
    sampleData
  };
}

// Email template categories
const TEMPLATE_CATEGORIES = {
  ORDERS: 'Orders',
  USERS: 'Users',
  RETURNS: 'Returns',
  TICKETS: 'Tickets',
  MARKETING: 'Marketing'
};

// Common email templates
const DEFAULT_TEMPLATES = [
  {
    name: 'Order Confirmation',
    subject: 'Your Order #{orderId} has been confirmed',
    category: TEMPLATE_CATEGORIES.ORDERS,
    body: `
      <h1>Order Confirmed! 🎉</h1>
      <p>Hello {customerName},</p>
      <p>Thank you for your order. Your order #{orderId} has been successfully placed.</p>
      <p><strong>Order Total:</strong> ₹{total}</p>
      <p><strong>Items:</strong> {items}</p>
      <p>We'll send you another email when your order ships.</p>
      <p>Thank you for shopping with us!</p>
    `,
    variables: ['orderId', 'customerName', 'total', 'items']
  },
  {
    name: 'Order Shipped',
    subject: 'Your Order #{orderId} has been shipped',
    category: TEMPLATE_CATEGORIES.ORDERS,
    body: `
      <h1>Order Shipped! 📦</h1>
      <p>Hello {customerName},</p>
      <p>Great news! Your order #{orderId} has been shipped.</p>
      <p><strong>Tracking ID:</strong> {trackingId}</p>
      <p><strong>Courier:</strong> {courierName}</p>
      <p>You can track your package using the tracking number above.</p>
    `,
    variables: ['orderId', 'customerName', 'trackingId', 'courierName']
  },
  {
    name: 'Welcome Email',
    subject: 'Welcome to our store, {customerName}!',
    category: TEMPLATE_CATEGORIES.USERS,
    body: `
      <h1>Welcome! 👋</h1>
      <p>Hello {customerName},</p>
      <p>Welcome to our store! We're excited to have you join our community.</p>
      <p>Start exploring our amazing collection of products and enjoy exclusive deals.</p>
      <p>Happy Shopping!</p>
    `,
    variables: ['customerName']
  },
  {
    name: 'Password Reset',
    subject: 'Reset your password',
    category: TEMPLATE_CATEGORIES.USERS,
    body: `
      <h1>Password Reset 🔐</h1>
      <p>Hello {customerName},</p>
      <p>We received a request to reset your password.</p>
      <p><strong>Reset Code:</strong> {resetCode}</p>
      <p>Or click here: {resetLink}</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    variables: ['customerName', 'resetCode', 'resetLink']
  },
  {
    name: 'Refund Processed',
    subject: 'Refund processed for Order #{orderId}',
    category: TEMPLATE_CATEGORIES.RETURNS,
    body: `
      <h1>Refund Processed 💰</h1>
      <p>Hello {customerName},</p>
      <p>Your refund has been processed successfully.</p>
      <p><strong>Order ID:</strong> {orderId}</p>
      <p><strong>Refund Amount:</strong> ₹{refundAmount}</p>
      <p>The amount will be credited within 5-7 business days.</p>
    `,
    variables: ['customerName', 'orderId', 'refundAmount']
  }
];

module.exports = {
  processTemplate,
  getTemplateByName,
  validateTemplate,
  extractVariables,
  generateSampleData,
  formatTemplatePreview,
  TEMPLATE_CATEGORIES,
  DEFAULT_TEMPLATES
};
