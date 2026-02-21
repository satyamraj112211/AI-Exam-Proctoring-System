/**
 * Simple in-memory email queue for background processing
 * In production, consider using Redis Bull or similar
 */
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Add email to queue and process in background
   */
  async enqueue(emailJob) {
    this.queue.push({
      ...emailJob,
      attempts: 0,
      maxAttempts: 3,
      addedAt: Date.now()
    });
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process email queue in background
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      job.attempts++;

      try {
        await job.sendFunction();
        console.log(`✓ Queued email sent successfully to: ${job.email}`);
      } catch (error) {
        console.error(`✗ Queued email failed (attempt ${job.attempts}/${job.maxAttempts}):`, error.message);
        
        // Retry if attempts remaining
        if (job.attempts < job.maxAttempts) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, job.attempts - 1), 10000);
          setTimeout(() => {
            this.queue.push(job);
          }, delay);
        } else {
          console.error(`✗ Email job failed after ${job.maxAttempts} attempts:`, job.email);
        }
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }
}

module.exports = new EmailQueue();




