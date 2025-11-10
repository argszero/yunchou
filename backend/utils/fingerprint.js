import crypto from 'crypto';

/**
 * 生成浏览器指纹数据
 * @param {Object} req - Express请求对象
 * @returns {Object} 指纹数据
 */
export function generateFingerprintData(req) {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';

  // 从请求中提取可能的屏幕分辨率（前端需要传递）
  const screenResolution = req.headers['x-screen-resolution'] || 'unknown';
  const timezone = req.headers['x-timezone'] || 'unknown';
  const language = req.headers['x-language'] || acceptLanguage.split(',')[0] || 'unknown';

  // 生成指纹哈希（使用与前端相同的格式）
  const fingerprintString = [
    userAgent,
    screenResolution,
    timezone,
    language,
    'unknown', // platform (前端有，但后端无法获取)
    'unknown', // hardwareConcurrency (前端有，但后端无法获取)
    'unknown'  // deviceMemory (前端有，但后端无法获取)
  ].join('|');
  const fingerprintHash = crypto.createHash('sha256').update(fingerprintString).digest('hex');

  return {
    fingerprintHash,
    userAgent,
    screenResolution,
    timezone,
    language
  };
}

/**
 * 验证指纹数据
 * @param {Object} fingerprintData - 指纹数据
 * @returns {boolean} 是否有效
 */
export function validateFingerprintData(fingerprintData) {
  return !!(fingerprintData &&
           fingerprintData.fingerprintHash &&
           fingerprintData.fingerprintHash.length === 64);
}