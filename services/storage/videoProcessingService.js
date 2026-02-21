const { performance } = require('perf_hooks');
const {
  videoProcessingTotal,
  videoProcessingFailuresTotal,
  videoProcessingDurationSeconds,
} = require('../../metrics/metrics');

/**
 * Wrap a video processing function so that Prometheus metrics are
 * consistently recorded for every processing attempt.
 *
 * @param {Function} handler - async function that performs the actual processing
 * @returns {Function} wrapped handler with metrics
 */
const withVideoProcessingMetrics = (handler) => {
  if (typeof handler !== 'function') {
    throw new Error('withVideoProcessingMetrics requires a function handler');
  }

  return async (...args) => {
    const startTime = performance.now();

    try {
      videoProcessingTotal.inc({ result: 'started' });

      const result = await handler(...args);

      const durationSeconds = (performance.now() - startTime) / 1000;
      videoProcessingDurationSeconds.observe({ result: 'success' }, durationSeconds);
      videoProcessingTotal.inc({ result: 'success' });

      return result;
    } catch (error) {
      const durationSeconds = (performance.now() - startTime) / 1000;
      videoProcessingDurationSeconds.observe({ result: 'failure' }, durationSeconds);
      videoProcessingTotal.inc({ result: 'failure' });

      const errorType =
        (error && (error.code || error.type || error.name)) || 'other';

      videoProcessingFailuresTotal.inc({
        error_type: String(errorType),
      });

      throw error;
    }
  };
};

module.exports = {
  withVideoProcessingMetrics,
};
















