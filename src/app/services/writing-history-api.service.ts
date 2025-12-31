import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config/app.config';

export interface AiCorrection {
  id?: string;
  issueType?: string;
  summary?: string;
  explanation?: string;
  originalText?: string;
  suggestedText?: string;
  startIndex?: number;
  endIndex?: number;
  severity?: 'low' | 'medium' | 'high' | string;
}

export interface SubmitWritingDto {
  userId: string;
  taskId: number;
  answer: string;
  wordCount: number;
  timeSpent: number;
  aiScore?: number;
  taskAchievement?: number;
  coherenceCohesion?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  aiFeedback?: string;
  aiSuggestions?: string[];
  aiCorrections?: AiCorrection[];
  aiCorrectedAnswer?: string;
  aiProvider?: string;
  aiModel?: string;
  aiEvaluatedAt?: string;
  aiRequestId?: string;
}

export interface LinkingWord {
  word: string;
  positions?: number[];
}

export interface WordRepetition {
  word: string;
  positions?: number[];
}

export interface WritingStatistics {
  linkingWords?: LinkingWord[];
  wordRepetitions?: WordRepetition[];
}

export interface DetailedIeltsScores {
  coherenceCohesionOverall?: number;
  logicalStructure?: number;
  introductionConclusion?: number;
  supportedMainPoints?: number;
  accurateLinkingWords?: number;
  varietyInLinkingWords?: number;
  lexicalResourceOverall?: number;
  variedVocabulary?: number;
  accurateSpellingWordFormation?: number;
  grammaticalRangeOverall?: number;
  mixComplexSimpleSentences?: number;
  clearCorrectGrammar?: number;
  taskAchievementOverall?: number;
  completeResponse?: number;
  clearComprehensiveIdeas?: number;
  relevantSpecificExamples?: number;
  appropriateWordCount?: number;
}

export interface WritingHistoryDto {
  id: number;
  userId: string;
  taskId: number;
  taskTitle?: string;
  taskType: string;
  answer: string;
  wordCount: number;
  timeSpent: number;
  aiScore?: number;
  taskAchievement?: number;
  coherenceCohesion?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  aiFeedback?: string;
  aiSuggestions?: string[];
  aiCorrections?: AiCorrection[];
  aiCorrectedAnswer?: string;
  aiProvider?: string;
  aiModel?: string;
  aiEvaluatedAt?: string;
  aiRequestId?: string;
  aiStatistics?: WritingStatistics;
  aiDetailedScores?: DetailedIeltsScores;
  submittedAt: string;
  createdAt: string;
  updatedAt?: string;
  isDraft?: boolean;
}

export interface UserWritingStatsDto {
  userId: string;
  totalCompleted: number;
  task1Completed: number;
  task2Completed: number;
  averageScore?: number;
  task1AverageScore?: number;
  task2AverageScore?: number;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  empty: boolean;
}

export interface AiScoringRequest {
  historyId: number;
  userId: string;
  taskId: number;
  answer: string;
  wordCount: number;
  timeSpent: number;
  imageData?: string; // Base64 encoded image data for Task 1
  imageMimeType?: string; // MIME type of the image (e.g., "image/jpeg", "image/png")
}

@Injectable({
  providedIn: 'root'
})
export class WritingHistoryApiService {
  private readonly apiUrl = `${AppConfig.api.baseUrl}/api/writing-history`;
  private readonly aiScoringUrl = `${AppConfig.api.baseUrl}/api/ai-scoring`;

  constructor(private http: HttpClient) {}

  // Submit bài làm
  submitWriting(submitDto: SubmitWritingDto): Observable<WritingHistoryDto> {
    return this.http.post<WritingHistoryDto>(`${this.apiUrl}/submit`, submitDto);
  }

  // Lấy lịch sử làm bài của user
  getUserHistory(userId: string): Observable<WritingHistoryDto[]> {
    return this.http.get<WritingHistoryDto[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Lấy lịch sử làm bài của user với phân trang
  getUserHistoryPage(userId: string, page: number = 0, size: number = 10): Observable<Page<WritingHistoryDto>> {
    return this.getUserHistoryPageWithFilters(userId, page, size);
  }

  // Lấy lịch sử làm bài của user với phân trang và filters
  getUserHistoryPageWithFilters(
    userId: string, 
    page: number = 0, 
    size: number = 10,
    search?: string,
    taskType?: string,
    fromDate?: string,
    toDate?: string,
    fromAiDate?: string,
    toAiDate?: string
  ): Observable<Page<WritingHistoryDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    if (taskType) {
      params = params.set('taskType', taskType);
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }
    if (fromAiDate) {
      params = params.set('fromAiDate', fromAiDate);
    }
    if (toAiDate) {
      params = params.set('toAiDate', toAiDate);
    }
    
    return this.http.get<Page<WritingHistoryDto>>(`${this.apiUrl}/user/${userId}/page`, { params });
  }

  // Lấy lịch sử làm bài của current user với phân trang và filters
  getMyHistoryPageWithFilters(
    page: number = 0, 
    size: number = 10,
    search?: string,
    taskType?: string,
    fromDate?: string,
    toDate?: string,
    fromAiDate?: string,
    toAiDate?: string
  ): Observable<Page<WritingHistoryDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    if (taskType) {
      params = params.set('taskType', taskType);
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }
    if (fromAiDate) {
      params = params.set('fromAiDate', fromAiDate);
    }
    if (toAiDate) {
      params = params.set('toAiDate', toAiDate);
    }
    
    return this.http.get<Page<WritingHistoryDto>>(`${this.apiUrl}/my-history/page`, { params });
  }

  // Lấy lịch sử làm bài của một task cụ thể
  getTaskHistory(userId: string, taskId: number): Observable<WritingHistoryDto[]> {
    return this.http.get<WritingHistoryDto[]>(`${this.apiUrl}/user/${userId}/task/${taskId}`);
  }

  // Lấy lần làm bài gần nhất của một task
  getLatestAttempt(userId: string, taskId: number): Observable<WritingHistoryDto> {
    return this.http.get<WritingHistoryDto>(`${this.apiUrl}/user/${userId}/task/${taskId}/latest`);
  }

  // Kiểm tra user đã làm bài này chưa
  isTaskCompleted(userId: string, taskId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/user/${userId}/task/${taskId}/completed`);
  }

  // Lấy danh sách task đã làm của user
  getCompletedTaskIds(userId: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/user/${userId}/completed-tasks`);
  }

  // Lấy danh sách task chưa làm của user
  getUncompletedTaskIds(userId: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/user/${userId}/uncompleted-tasks`);
  }

  // Lấy thống kê của user
  getUserStats(userId: string): Observable<UserWritingStatsDto> {
    return this.http.get<UserWritingStatsDto>(`${this.apiUrl}/user/${userId}/stats`);
  }

  // Gửi yêu cầu chấm điểm AI cho một bài làm
  scoreWritingAttempt(request: AiScoringRequest): Observable<WritingHistoryDto> {
    return this.http.post<WritingHistoryDto>(`${this.aiScoringUrl}/score`, request);
  }

  // Lấy chi tiết một bài làm theo ID (public, không cần authentication)
  getHistoryById(historyId: number): Observable<WritingHistoryDto> {
    return this.http.get<WritingHistoryDto>(`${this.apiUrl}/${historyId}`);
  }

  // Xóa lịch sử làm bài
  deleteHistory(historyId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${historyId}`);
  }
}
