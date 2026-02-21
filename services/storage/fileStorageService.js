const path = require('path');
const { fileUploadsTotal } = require('../../metrics/metrics');

/**
 * Record a file upload event in Prometheus and return the relative URL
 * that can be stored on the Student model or returned to clients.
 *
 * This service does not perform the actual write – multer already stores
 * the file on disk. It is responsible purely for domain logic + metrics.
 *
 * @param {Object} params
 * @param {Object} params.file - Multer file object
 * @param {string} params.type - Domain-specific file type (e.g. "avatar", "exam_video")
 * @returns {{ relativePath: string }}
 */
const recordFileUploadAndBuildPath = ({ file, type = 'other' }) => {
  if (!file) {
    // Defensive: no file present – count as failure for observability
    fileUploadsTotal.inc({
      type,
      status: 'failure',
    });
    throw new Error('File object is required for recording upload metrics');
  }

  const safeType = type || 'other';

  try {
    fileUploadsTotal.inc({
      type: safeType,
      status: 'success',
    });
  } catch (err) {
    // Metrics failures should never break the request flow
    // eslint-disable-next-line no-console
    console.error('Failed to increment file upload metrics', err);
  }

  // For avatars, files are stored under /uploads/avatars by multer
  // We build a web-facing relative path, independent of the absolute disk path.
  const relativePath = path.posix.join('/uploads/avatars', file.filename);

  return { relativePath };
};

module.exports = {
  recordFileUploadAndBuildPath,
};
















