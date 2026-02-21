const { proctoringViolationsTotal } = require('../../metrics/metrics');
const logger = require('../../utils/helpers/logger');

/**
 * Record a proctoring violation event for observability.
 *
 * This helper is safe to call from anywhere in the proctoring pipeline
 * (AI monitoring, manual flags, screen / webcam controllers, etc.).
 *
 * @param {Object} params
 * @param {string} params.type - Violation type (e.g. "multiple_faces", "no_face", "eye_off_screen")
 */
const recordProctoringViolation = ({ type }) => {
  const safeType = type || 'other';
  try {
    proctoringViolationsTotal.inc({ type: safeType });
  } catch (err) {
    logger.error('Failed to increment proctoringViolationsTotal metric:', err);
  }
};

module.exports = {
  recordProctoringViolation,
};
















