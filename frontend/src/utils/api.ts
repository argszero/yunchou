import { fingerprintManager } from './fingerprint';
import type { DecisionProblem } from '../types';

const API_BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface CreateDecisionProblemRequest {
  title: string;
  description?: string;
  criteria: Array<{
    name: string;
    description?: string;
  }>;
  alternatives: Array<{
    name: string;
    description?: string;
    scores: number[];
  }>;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...fingerprintManager.getRequestHeaders()
    };
    return headers;
  }

  /**
   * 发起请求
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * 获取用户的所有决策问题
   */
  async getUserDecisionProblems(): Promise<ApiResponse<DecisionProblem[]>> {
    return this.request<DecisionProblem[]>('/api/decision-problems');
  }

  /**
   * 创建新的决策问题
   */
  async createDecisionProblem(problemData: CreateDecisionProblemRequest): Promise<ApiResponse<DecisionProblem>> {
    return this.request<DecisionProblem>('/api/decision-problems', {
      method: 'POST',
      body: JSON.stringify(problemData)
    });
  }

  /**
   * 获取决策问题详情
   */
  async getDecisionProblem(id: string): Promise<ApiResponse<DecisionProblem>> {
    return this.request<DecisionProblem>(`/api/decision-problems/${id}`);
  }

  /**
   * 获取用户的所有决策问题（新API）
   */
  async getProblems(): Promise<DecisionProblem[]> {
    const response = await this.request<DecisionProblem[]>('/problems');
    return response.data || [];
  }

  /**
   * 创建新的决策问题（新API）
   */
  async post(url: string, data: any): Promise<any> {
    const response = await this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // 新API返回数据直接返回，不需要提取data字段
    return response;
  }

  /**
   * 获取决策问题详情（新API）
   */
  async get(url: string): Promise<any> {
    const response = await this.request(url);
    // 新API返回数据直接返回，不需要提取data字段
    return response;
  }

  /**
   * 更新决策问题（新API）
   */
  async put(url: string, data: any): Promise<any> {
    const response = await this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    // 新API返回数据直接返回，不需要提取data字段
    return response;
  }

  /**
   * 删除决策问题（新API）
   */
  async delete(url: string): Promise<any> {
    const response = await this.request(url, {
      method: 'DELETE'
    });
    // 新API返回数据直接返回，不需要提取data字段
    return response;
  }

  /**
   * 检查数据库健康状态
   */
  async checkDatabaseHealth(): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request('/api/health/db');
  }

  /**
   * 检查指纹有效性
   */
  isFingerprintValid(): boolean {
    return fingerprintManager.isValid();
  }

  /**
   * 清除用户指纹（用于测试）
   */
  clearFingerprint(): void {
    fingerprintManager.clearFingerprint();
  }
}

// 创建单例实例
export const apiClient = new ApiClient();