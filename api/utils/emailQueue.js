import { transporter } from './emailService.js';

// Email queue system for better rate management
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3; // Max concurrent emails
    this.delayBetweenEmails = 1000; // 1 second delay between emails
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds delay for retries
  }

  // Add email to queue
  async addToQueue(mailOptions, priority = 'normal') {
    const emailItem = {
      id: Date.now() + Math.random(),
      mailOptions,
      priority,
      attempts: 0,
      createdAt: new Date(),
      status: 'queued'
    };

    // Insert based on priority
    if (priority === 'high') {
      this.queue.unshift(emailItem);
    } else {
      this.queue.push(emailItem);
    }

    console.log(`Email queued: ${mailOptions.to} (Priority: ${priority})`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return emailItem.id;
  }

  // Process the email queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`Processing email queue: ${this.queue.length} emails pending`);

    while (this.queue.length > 0) {
      const emailItem = this.queue.shift();
      
      try {
        await this.sendEmail(emailItem);
        
        // Add delay between emails to respect rate limits
        if (this.queue.length > 0) {
          await this.delay(this.delayBetweenEmails);
        }
      } catch (error) {
        console.error(`Failed to process email ${emailItem.id}:`, error);
        await this.handleEmailFailure(emailItem, error);
      }
    }

    this.processing = false;
    console.log('Email queue processing completed');
  }

  // Send individual email
  async sendEmail(emailItem) {
    try {
      emailItem.status = 'sending';
      emailItem.attempts++;

      const result = await transporter.sendMail(emailItem.mailOptions);
      
      emailItem.status = 'sent';
      emailItem.messageId = result.messageId;
      emailItem.sentAt = new Date();

      console.log(`Email sent successfully: ${emailItem.mailOptions.to} (ID: ${emailItem.id})`);
      
      return result;
    } catch (error) {
      emailItem.lastError = error.message;
      throw error;
    }
  }

  // Handle email failure
  async handleEmailFailure(emailItem, error) {
    if (emailItem.attempts < this.maxRetries) {
      // Retry with exponential backoff
      const retryDelay = this.retryDelay * Math.pow(2, emailItem.attempts - 1);
      
      console.log(`Retrying email ${emailItem.id} in ${retryDelay}ms (attempt ${emailItem.attempts + 1})`);
      
      setTimeout(() => {
        this.queue.unshift(emailItem); // Add back to front of queue
        this.processQueue();
      }, retryDelay);
    } else {
      // Max retries exceeded
      emailItem.status = 'failed';
      emailItem.failedAt = new Date();
      
      console.error(`Email failed permanently: ${emailItem.mailOptions.to} (ID: ${emailItem.id})`);
      
      // Log to error tracking system
      this.logEmailFailure(emailItem, error);
    }
  }

  // Log email failure for monitoring
  logEmailFailure(emailItem, error) {
    const failureLog = {
      id: emailItem.id,
      to: emailItem.mailOptions.to,
      subject: emailItem.mailOptions.subject,
      attempts: emailItem.attempts,
      error: error.message,
      failedAt: new Date(),
      createdAt: emailItem.createdAt
    };

    console.error('EMAIL FAILURE LOG:', failureLog);
    
    // In production, you might want to send this to a logging service
    // or database for analysis
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      queued: this.queue.filter(item => item.status === 'queued').length,
      sending: this.queue.filter(item => item.status === 'sending').length,
      failed: this.queue.filter(item => item.status === 'failed').length
    };
  }

  // Clear failed emails from queue
  clearFailed() {
    const failedCount = this.queue.filter(item => item.status === 'failed').length;
    this.queue = this.queue.filter(item => item.status !== 'failed');
    console.log(`Cleared ${failedCount} failed emails from queue`);
  }

  // Pause queue processing
  pause() {
    this.processing = false;
    console.log('Email queue paused');
  }

  // Resume queue processing
  resume() {
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }
}

// Create singleton instance
export const emailQueue = new EmailQueue();

// Enhanced email sending functions that use the queue
export const sendQueuedEmail = async (mailOptions, priority = 'normal') => {
  return await emailQueue.addToQueue(mailOptions, priority);
};

// Get queue statistics
export const getQueueStats = () => {
  return emailQueue.getStatus();
};

// Clear failed emails
export const clearFailedEmails = () => {
  return emailQueue.clearFailed();
};

export default emailQueue;
