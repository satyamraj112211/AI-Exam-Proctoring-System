const SystemConfig = require('../../models/SystemConfig');
const ApiResponse = require('../../utils/helpers/apiResponse');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const logger = require('../../utils/helpers/logger');

/**
 * @desc    Get system configuration
 * @route   GET /api/v1/admin/system-config
 * @access  Private (Admin)
 */
exports.getSystemConfig = asyncHandler(async (req, res) => {
  const config = await SystemConfig.getConfig();
  
  // Don't send password in response
  const configData = config.toObject();
  if (configData.emailSettings) {
    configData.emailSettings.smtpPassword = configData.emailSettings.smtpPassword ? '***' : '';
  }

  res.status(200).json(
    new ApiResponse(200, { config: configData }, 'System configuration fetched successfully')
  );
});

/**
 * @desc    Update system configuration
 * @route   PUT /api/v1/admin/system-config
 * @access  Private (Admin)
 */
exports.updateSystemConfig = asyncHandler(async (req, res) => {
  const updateData = req.body;
  const adminId = req.admin?._id || req.user?.id;

  // Get existing config
  let config = await SystemConfig.getConfig();

  // Validate and update only allowed fields
  const allowedSections = [
    'examSettings',
    'proctoringSettings',
    'notificationSettings',
    'securitySettings',
    'systemSettings',
    'emailSettings'
  ];

  const updates = {};
  
  for (const section of allowedSections) {
    if (updateData[section] && typeof updateData[section] === 'object') {
      // Merge with existing settings
      const existingSection = config[section] ? config[section].toObject() : {};
      updates[section] = { ...existingSection, ...updateData[section] };
    }
  }
  
  // Only update password if a new one is provided (not '***' or empty)
  if (updates.emailSettings) {
    if (updates.emailSettings.smtpPassword === '***' || updates.emailSettings.smtpPassword === '') {
      // Keep existing password, don't update it
      const existingEmailSettings = config.emailSettings ? config.emailSettings.toObject() : {};
      updates.emailSettings.smtpPassword = existingEmailSettings.smtpPassword || '';
    }
  }

  // Update version and lastUpdatedBy
  updates.version = (config.version || 0) + 1;
  updates.lastUpdatedBy = adminId;

  // Update configuration
  config = await SystemConfig.findByIdAndUpdate(
    config._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  logger.info(`System configuration updated by admin ${adminId}, version: ${config.version}`);

  // Don't send password in response
  const configData = config.toObject();
  if (configData.emailSettings) {
    configData.emailSettings.smtpPassword = configData.emailSettings.smtpPassword ? '***' : '';
  }

  res.status(200).json(
    new ApiResponse(200, { config: configData }, 'System configuration updated successfully')
  );
});

/**
 * @desc    Reset system configuration to defaults
 * @route   POST /api/v1/admin/system-config/reset
 * @access  Private (Admin)
 */
exports.resetSystemConfig = asyncHandler(async (req, res) => {
  const adminId = req.admin?._id || req.user?.id;

  // Delete existing config and create new one with defaults
  await SystemConfig.deleteMany({});
  const config = await SystemConfig.create({
    lastUpdatedBy: adminId
  });

  logger.info(`System configuration reset to defaults by admin ${adminId}`);

  // Don't send password in response
  const configData = config.toObject();
  if (configData.emailSettings) {
    configData.emailSettings.smtpPassword = '';
  }

  res.status(200).json(
    new ApiResponse(200, { config: configData }, 'System configuration reset to defaults')
  );
});

