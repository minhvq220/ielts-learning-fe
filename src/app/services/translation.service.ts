import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  alternativeTranslations?: string[];
  synonyms?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  // Sử dụng Google Translate API miễn phí (có giới hạn)
  // Hoặc có thể thay thế bằng API key nếu có
  private readonly translateApiUrl = 'https://translate.googleapis.com/translate_a/single';
  
  constructor(private http: HttpClient) {}

  /**
   * Helper function để kiểm tra text có phải là tiếng Việt hợp lệ không
   */
  private isValidVietnameseText(text: string): boolean {
    if (!text || text.trim().length === 0) return false;
    
    // Loại bỏ ký tự lỗi
    let cleanText = text.replace(/[\u200B-\u200D\uFEFF\u00AD]+/g, '').trim();
    
    // Kiểm tra có ký tự lỗi như underscore trong từ (m_en_gbus)
    if (cleanText.includes('_') || cleanText.match(/[a-zA-Z]_[a-zA-Z]/)) {
      return false;
    }
    
    // Kiểm tra các pattern lỗi khác (có vẻ như là ký tự phân tách không hợp lệ)
    // Ví dụ: m_en_gbus, word_en_word
    if (cleanText.match(/[a-z]+_[a-z]+_[a-z]+/i) || cleanText.match(/^[a-z]+_[a-z]+$/i)) {
      return false;
    }
    
    // Kiểm tra có chứa ký tự tiếng Việt (Unicode range cho tiếng Việt)
    const hasVietnameseChars = /[\u00C0-\u00FF\u0102\u0103\u1EA0-\u1EF9]/.test(cleanText);
    
    // CHỈ chấp nhận text có ký tự tiếng Việt - không chấp nhận text chỉ có tiếng Anh
    if (!hasVietnameseChars) {
      return false;
    }
    
    // Nếu có ký tự tiếng Việt và không có ký tự lỗi, đó là text tiếng Việt hợp lệ
    return true;
  }

  /**
   * Helper function để đệ quy tìm tất cả các string tiếng Việt trong response
   */
  private extractVietnameseTexts(obj: any, results: Set<string>, excludeText?: string, maxDepth: number = 10): void {
    if (maxDepth <= 0) return;
    
    if (typeof obj === 'string') {
      const text = obj.trim();
      if (text && text.length > 0) {
        // Loại bỏ ký tự lỗi
        const cleanText = text.replace(/[\u200B-\u200D\uFEFF\u00AD]+/g, '').trim();
        
        // Chỉ lấy text tiếng Việt hợp lệ
        if (cleanText && cleanText !== excludeText && this.isValidVietnameseText(cleanText)) {
          results.add(cleanText);
        }
      }
      return;
    }
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        this.extractVietnameseTexts(item, results, excludeText, maxDepth - 1);
      });
      return;
    }
    
    if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => {
        this.extractVietnameseTexts(value, results, excludeText, maxDepth - 1);
      });
    }
  }

  /**
   * Kiểm tra xem text có phải là part of speech (loại từ) không
   */
  private isPartOfSpeech(text: string): boolean {
    const cleanText = text.toLowerCase().trim();
    
    // Danh sách các part of speech phổ biến
    const partsOfSpeech = [
      'noun', 'nouns', 'n',
      'verb', 'verbs', 'v',
      'adjective', 'adjectives', 'adj', 'a',
      'adverb', 'adverbs', 'adv',
      'pronoun', 'pronouns', 'pron',
      'preposition', 'prepositions', 'prep',
      'conjunction', 'conjunctions', 'conj',
      'interjection', 'interjections', 'interj',
      'article', 'articles', 'art',
      'determiner', 'determiners', 'det',
      'danh từ', 'động từ', 'tính từ', 'trạng từ',
      'đại từ', 'giới từ', 'liên từ', 'thán từ'
    ];
    
    return partsOfSpeech.includes(cleanText);
  }

  /**
   * Helper function để đệ quy tìm synonyms (có thể là tiếng Anh hoặc tiếng Việt)
   */
  private extractSynonyms(obj: any, results: Set<string>, excludeText?: string, maxDepth: number = 10): void {
    if (maxDepth <= 0) return;
    
    if (typeof obj === 'string') {
      const text = obj.trim();
      if (text && text.length > 0) {
        // Loại bỏ ký tự lỗi
        let cleanText = text.replace(/[\u200B-\u200D\uFEFF\u00AD]+/g, '').trim();
        cleanText = cleanText.replace(/\s+$/, '');
        
        // Kiểm tra không phải là part of speech
        if (this.isPartOfSpeech(cleanText)) {
          return; // Bỏ qua part of speech
        }
        
        // Kiểm tra không có ký tự lỗi như underscore
        if (cleanText && 
            cleanText !== excludeText && 
            !cleanText.includes('_') &&
            !cleanText.match(/[a-z]+_[a-z]+_[a-z]+/i) &&
            cleanText.length > 0 &&
            !cleanText.match(/^[0-9]+$/) && // Không phải chỉ số
            cleanText.length < 50) { // Không quá dài (synonyms thường ngắn)
          results.add(cleanText);
        }
      }
      return;
    }
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        this.extractSynonyms(item, results, excludeText, maxDepth - 1);
      });
      return;
    }
    
    if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => {
        this.extractSynonyms(value, results, excludeText, maxDepth - 1);
      });
    }
  }

  /**
   * Dịch text từ tiếng Anh sang tiếng Việt
   * @param text Text cần dịch
   * @returns Observable<TranslationResult>
   */
  translateToVietnamese(text: string): Observable<TranslationResult> {
    if (!text || text.trim().length === 0) {
      return of({
        originalText: text,
        translatedText: '',
        sourceLanguage: 'en',
        targetLanguage: 'vi'
      });
    }

    const params = new HttpParams()
      .set('client', 'gtx')
      .set('sl', 'en') // source language: English
      .set('tl', 'vi') // target language: Vietnamese
      .set('dt', 't')  // translate
      .set('q', text.trim());

    return this.http.get<any[]>(this.translateApiUrl, { params }).pipe(
      map((response: any) => {
        // Response format: [[["translated text", "original text", ...], ...], "en"]
        let translatedText = '';
        if (response && response[0] && Array.isArray(response[0])) {
          translatedText = response[0]
            .map((item: any[]) => item[0])
            .join('');
        }
        
        return {
          originalText: text.trim(),
          translatedText: translatedText || text.trim(),
          sourceLanguage: response[2] || 'en',
          targetLanguage: 'vi'
        };
      }),
      catchError((error) => {
        console.error('Translation error:', error);
        // Return original text if translation fails
        return of({
          originalText: text.trim(),
          translatedText: text.trim(),
          sourceLanguage: 'en',
          targetLanguage: 'vi'
        });
      })
    );
  }

  /**
   * Dịch text từ bất kỳ ngôn ngữ nào sang tiếng Việt
   * @param text Text cần dịch
   * @param sourceLanguage Mã ngôn ngữ nguồn (mặc định: auto-detect)
   * @returns Observable<TranslationResult>
   */
  translate(text: string, sourceLanguage: string = 'auto'): Observable<TranslationResult> {
    if (!text || text.trim().length === 0) {
      return of({
        originalText: text,
        translatedText: '',
        sourceLanguage: sourceLanguage === 'auto' ? 'unknown' : sourceLanguage,
        targetLanguage: 'vi'
      });
    }

    // Google Translate API có giới hạn 5000 ký tự
    // Nếu text quá dài, chỉ lấy 5000 ký tự đầu tiên
    const trimmedText = text.trim();
    const maxLength = 5000;
    const textToTranslate = trimmedText.length > maxLength 
      ? trimmedText.substring(0, maxLength) 
      : trimmedText;

    // Thêm dt parameters để lấy translation, alternative translations, definitions, dictionary và synonyms
    // dt=t: translation, dt=at: alternative translations, dt=md: definitions, dt=bd: dictionary, dt=ss: synonyms
    let params = new HttpParams()
      .set('client', 'gtx')
      .set('sl', sourceLanguage)
      .set('tl', 'vi')
      .set('q', textToTranslate);
    
    // Thêm nhiều dt parameters bằng cách append để lấy tất cả nghĩa
    ['t', 'at', 'md', 'bd', 'ss'].forEach(dt => {
      params = params.append('dt', dt);
    });

    return this.http.get<any[]>(this.translateApiUrl, { params }).pipe(
      map((response: any) => {
        console.log('Full Google Translate response:', response);
        
        let translatedText = '';
        const alternativeTranslations = new Set<string>();
        const synonyms = new Set<string>();
        
        // Main translation (dt=t) - response[0]
        if (response && response[0] && Array.isArray(response[0])) {
          translatedText = response[0]
            .map((item: any[]) => item[0])
            .join('');
        }
        
        // Alternative translations (dt=at) - response[5]
        // Cấu trúc: response[5] = [[[["translation1"], ["translation2"], ...]]]
        if (response && response[5] && Array.isArray(response[5])) {
          response[5].forEach((alt: any) => {
            if (alt && Array.isArray(alt)) {
              alt.forEach((transGroup: any) => {
                if (transGroup && Array.isArray(transGroup)) {
                  transGroup.forEach((trans: any) => {
                    if (trans && Array.isArray(trans)) {
                      // Có thể có nhiều translations trong mỗi trans
                      trans.forEach((t: any) => {
                        if (t && Array.isArray(t) && t[0]) {
                          const translation = String(t[0]).trim();
                          if (translation && translation !== translatedText) {
                            alternativeTranslations.add(translation);
                          }
                        } else if (typeof t === 'string') {
                          const translation = t.trim();
                          if (translation && translation !== translatedText) {
                            alternativeTranslations.add(translation);
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
        
        // Definitions (dt=md) - response[1] - Lấy tất cả các nghĩa từ definitions
        // Cấu trúc: response[1] = [[[["pos", [["meaning1"], ["meaning2"], ...]], ...]]]
        if (response && response[1] && Array.isArray(response[1])) {
          response[1].forEach((defGroup: any) => {
            if (defGroup && Array.isArray(defGroup)) {
              defGroup.forEach((def: any) => {
                if (def && Array.isArray(def)) {
                  def.forEach((defItem: any) => {
                    if (defItem && Array.isArray(defItem)) {
                      // defItem[0] = pos (part of speech)
                      // defItem[1] = array of meanings [[meaning1], [meaning2], ...]
                      if (defItem[1] && Array.isArray(defItem[1])) {
                        defItem[1].forEach((meaning: any) => {
                          if (meaning && Array.isArray(meaning)) {
                            // meaning[0] là nghĩa tiếng Việt
                            if (meaning[0]) {
                              const meaningText = String(meaning[0]).trim();
                              if (meaningText && meaningText !== translatedText) {
                                alternativeTranslations.add(meaningText);
                              }
                            }
                          } else if (typeof meaning === 'string') {
                            const meaningText = meaning.trim();
                            if (meaningText && meaningText !== translatedText) {
                              alternativeTranslations.add(meaningText);
                            }
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
          });
        }
        
        // Dictionary entries (dt=bd) và các phần khác
        // Sử dụng helper function để đệ quy tìm tất cả các text tiếng Việt trong response
        // Bỏ qua response[0] (main translation), response[2] (language code)
        for (let i = 0; i < response.length; i++) {
          if (i !== 0 && i !== 2) { // Bỏ qua main translation và language code
            try {
              this.extractVietnameseTexts(response[i], alternativeTranslations, translatedText);
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
        
        // Synonyms (dt=ss) - có thể ở response[11] hoặc các vị trí khác
        // Parse synonyms riêng biệt vì có thể là tiếng Anh hoặc tiếng Việt
        console.log('Response[11] (synonyms):', response && response[11]);
        
        // Thử parse từ response[11] trước
        if (response && response[11]) {
          try {
            this.extractSynonyms(response[11], synonyms, translatedText);
            console.log('Synonyms from response[11]:', Array.from(synonyms));
          } catch (e) {
            console.warn('Error parsing synonyms from response[11]:', e);
          }
        }
        
        // Nếu không có synonyms ở response[11], thử tìm trong các phần khác của response
        // Đặc biệt là response[12] hoặc các index khác
        if (synonyms.size === 0) {
          console.log('No synonyms found in response[11], trying other indices...');
          // Thử response[12], [13], [14]...
          for (let i = 12; i < Math.min(response.length, 20); i++) {
            if (response[i] && Array.isArray(response[i])) {
              try {
                const synCountBefore = synonyms.size;
                this.extractSynonyms(response[i], synonyms, translatedText);
                if (synonyms.size > synCountBefore) {
                  console.log(`Found synonyms in response[${i}]:`, Array.from(synonyms));
                  break;
                }
              } catch (e) {
                // Continue to next index
              }
            }
          }
        }
        
        // Fallback: parse theo cấu trúc cũ nếu vẫn không có synonyms
        if (synonyms.size === 0 && response && response[11] && Array.isArray(response[11])) {
          console.log('Using fallback method to parse synonyms...');
          response[11].forEach((synGroup: any) => {
            if (synGroup && Array.isArray(synGroup)) {
              synGroup.forEach((syn: any) => {
                if (syn && Array.isArray(syn)) {
                  syn.forEach((s: any) => {
                    if (s && Array.isArray(s) && s[0]) {
                      let synonym = String(s[0]).trim();
                      synonym = synonym.replace(/[\u200B-\u200D\uFEFF\u00AD]+/g, '');
                      synonym = synonym.replace(/\s+$/, '');
                      if (synonym && synonym !== translatedText) {
                        synonyms.add(synonym);
                      }
                    } else if (typeof s === 'string') {
                      let synonym = s.trim();
                      synonym = synonym.replace(/[\u200B-\u200D\uFEFF\u00AD]+/g, '');
                      if (synonym && synonym !== translatedText) {
                        synonyms.add(synonym);
                      }
                    }
                  });
                } else if (typeof syn === 'string') {
                  let synonym = syn.trim();
                  synonym = synonym.replace(/[\u200B-\u200D\uFEFF\u00AD]+/g, '');
                  if (synonym && synonym !== translatedText) {
                    synonyms.add(synonym);
                  }
                }
              });
            }
          });
          console.log('Synonyms from fallback method:', Array.from(synonyms));
        }
        
        console.log('Total synonyms found:', Array.from(synonyms));
        
        // Convert Sets to Arrays và lọc lại để chỉ giữ tiếng Việt hợp lệ
        const uniqueAlternatives = Array.from(alternativeTranslations)
          .filter(text => {
            const cleanText = String(text).trim();
            // Phải có ký tự tiếng Việt, không có ký tự lỗi, không phải toàn bộ là tiếng Anh
            return this.isValidVietnameseText(cleanText) && 
                   /[\u00C0-\u00FF\u0102\u0103\u1EA0-\u1EF9]/.test(cleanText) &&
                   !cleanText.match(/^[a-zA-Z\s]+$/); // Không phải toàn bộ là chữ cái tiếng Anh
          });
        
        const uniqueSynonyms = Array.from(synonyms)
          .filter(text => {
            const cleanText = String(text).trim();
            
            // Loại bỏ part of speech (loại từ)
            if (this.isPartOfSpeech(cleanText)) {
              console.log('Filtered out part of speech:', cleanText);
              return false;
            }
            
            // Synonyms có thể là tiếng Anh hoặc tiếng Việt, nhưng phải hợp lệ
            // Loại bỏ text có ký tự lỗi, underscore, hoặc quá dài
            const isValid = cleanText.length > 0 && 
                           cleanText.length < 50 && // Không quá dài
                           !cleanText.includes('_') &&
                           !cleanText.match(/[a-z]+_[a-z]+_[a-z]+/i) &&
                           !cleanText.match(/^[0-9]+$/) && // Không phải chỉ số
                           cleanText !== translatedText; // Không trùng với bản dịch chính
            
            if (!isValid && cleanText.length > 0) {
              console.log('Filtered out synonym:', cleanText);
            }
            
            return isValid;
          })
          .slice(0, 10); // Giới hạn tối đa 10 từ đồng nghĩa
        
        console.log('Final synonyms after filter (max 10):', uniqueSynonyms);
        
        const detectedLanguage = response[2] || sourceLanguage;
        
        console.log('Parsed translations:', {
          main: translatedText,
          alternatives: uniqueAlternatives,
          synonyms: uniqueSynonyms
        });
        
        return {
          originalText: trimmedText, // Giữ nguyên text gốc đầy đủ để hiển thị
          translatedText: translatedText || textToTranslate,
          sourceLanguage: detectedLanguage,
          targetLanguage: 'vi',
          alternativeTranslations: uniqueAlternatives.length > 0 ? uniqueAlternatives : undefined,
          synonyms: uniqueSynonyms.length > 0 ? uniqueSynonyms : undefined
        };
      }),
      catchError((error) => {
        console.error('Translation error:', error);
        return of({
          originalText: text.trim(),
          translatedText: text.trim(),
          sourceLanguage: sourceLanguage === 'auto' ? 'unknown' : sourceLanguage,
          targetLanguage: 'vi'
        });
      })
    );
  }
}

