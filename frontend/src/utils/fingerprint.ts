/**
 * 生成浏览器指纹
 * 基于浏览器特征生成唯一标识符
 */

interface FingerprintData {
  fingerprintHash: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: string;
  deviceMemory: string;
}

export class FingerprintManager {
  private storageKey: string;
  private fingerprintData: FingerprintData | null;

  constructor() {
    this.storageKey = 'decisionflow_user_fingerprint';
    this.fingerprintData = null;
  }

  /**
   * 生成指纹数据
   */
  generateFingerprint(): FingerprintData {
    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const hardwareConcurrency = (navigator.hardwareConcurrency || 'unknown').toString();
    const deviceMemory = 'unknown'; // navigator.deviceMemory is not widely supported

    // 生成指纹字符串
    const fingerprintString = [
      userAgent,
      screenResolution,
      timezone,
      language,
      platform,
      hardwareConcurrency,
      deviceMemory
    ].join('|');

    // 生成简单哈希（前端不需要强加密）
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }

    const fingerprintHash = Math.abs(hash).toString(16);

    this.fingerprintData = {
      fingerprintHash,
      userAgent,
      screenResolution,
      timezone,
      language,
      platform,
      hardwareConcurrency,
      deviceMemory
    };

    return this.fingerprintData;
  }

  /**
   * 获取指纹数据（从存储或生成）
   */
  getFingerprint(): FingerprintData {
    // 首先尝试从localStorage获取
    const storedFingerprint = localStorage.getItem(this.storageKey);
    if (storedFingerprint) {
      try {
        const parsedData = JSON.parse(storedFingerprint);
        this.fingerprintData = parsedData;
        return parsedData;
      } catch (error) {
        console.warn('Failed to parse stored fingerprint, generating new one');
      }
    }

    // 生成新的指纹数据
    const newFingerprint = this.generateFingerprint();

    // 存储到localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(newFingerprint));

    return newFingerprint;
  }

  /**
   * 清除指纹数据
   */
  clearFingerprint(): void {
    localStorage.removeItem(this.storageKey);
    this.fingerprintData = null;
  }

  /**
   * 获取请求头信息（用于API调用）
   */
  getRequestHeaders(): Record<string, string> {
    const fingerprint = this.getFingerprint();
    return {
      'X-Fingerprint-Hash': fingerprint.fingerprintHash,
      'X-Screen-Resolution': fingerprint.screenResolution,
      'X-Timezone': fingerprint.timezone,
      'X-Language': fingerprint.language
    };
  }

  /**
   * 验证指纹是否有效
   */
  isValid(): boolean {
    try {
      const fingerprint = this.getFingerprint();
      return !!(fingerprint && fingerprint.fingerprintHash);
    } catch {
      return false;
    }
  }
}

// 创建单例实例
export const fingerprintManager = new FingerprintManager();