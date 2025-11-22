import { Directive, ElementRef, HostListener, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { TranslationService, TranslationResult } from '../services/translation.service';

@Directive({
  selector: '[appTranslateSelection]',
  standalone: true
})
export class TranslateSelectionDirective implements OnInit, OnDestroy {
  private selectedText = signal<string>('');
  private translationResult = signal<TranslationResult | null>(null);
  private popupElement: HTMLElement | null = null;
  private isTranslating = signal<boolean>(false);
  private clickHandler?: (e: MouseEvent) => void;
  private savedRange: Range | null = null;
  private selectionChangeHandler?: () => void;
  private isShowingPopup = false;
  private scrollHandler?: () => void;
  private scrollUpdateFrame: number | null = null;
  private selectionUpdateTimeout?: number;
  private addedBodyPadding: number = 0; // Track padding đã thêm vào body

  constructor(
    private el: ElementRef<HTMLElement>,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    // Setup scroll handler để cập nhật vị trí popup khi scroll
    this.setupScrollHandler();
    
    // Setup selection change handler - hiển thị popup ngay khi có selection
    this.setupSelectionChangeHandler();
  }

  ngOnDestroy(): void {
    // Clear timeout nếu có
    if (this.selectionUpdateTimeout) {
      clearTimeout(this.selectionUpdateTimeout);
      this.selectionUpdateTimeout = undefined;
    }
    this.closePopup();
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
    }
    if (this.selectionChangeHandler) {
      document.removeEventListener('selectionchange', this.selectionChangeHandler);
    }
    // Cleanup scroll handler
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      window.removeEventListener('resize', this.scrollHandler);
    }
    if (this.scrollUpdateFrame) {
      cancelAnimationFrame(this.scrollUpdateFrame);
    }
    // Đảm bảo remove padding khi destroy
    this.removePaddingFromBody();
  }

  private setupSelectionChangeHandler(): void {
    this.selectionChangeHandler = () => {
      // Clear timeout cũ nếu có
      if (this.selectionUpdateTimeout) {
        clearTimeout(this.selectionUpdateTimeout);
        this.selectionUpdateTimeout = undefined;
      }

      // Đợi một chút để selection được cập nhật hoàn toàn
      this.selectionUpdateTimeout = window.setTimeout(() => {
        this.selectionUpdateTimeout = undefined;
        this.handleSelectionChange();
      }, 100);
    };

    document.addEventListener('selectionchange', this.selectionChangeHandler);
  }

  private handleSelectionChange(): void {
    // Nếu đang hiển thị popup result (không phải button), không xử lý
    if (this.popupElement && this.popupElement.classList.contains('translate-result-popup')) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Không có selection, đóng popup button nếu có
      if (this.popupElement && this.popupElement.classList.contains('translate-selection-popup')) {
        this.closePopup();
      }
      this.savedRange = null;
      return;
    }

    const selectedText = selection.toString().trim();
    
    // Nếu không có text được chọn
    if (!selectedText || selectedText.length === 0) {
      // Đóng popup button nếu có
      if (this.popupElement && this.popupElement.classList.contains('translate-selection-popup')) {
        this.closePopup();
      }
      this.savedRange = null;
      return;
    }

    // Kiểm tra xem text được chọn có nằm trong element này không
    const range = selection.getRangeAt(0);
    if (!this.el.nativeElement.contains(range.commonAncestorContainer)) {
      // Selection không nằm trong element này, đóng popup
      if (this.popupElement && this.popupElement.classList.contains('translate-selection-popup')) {
        this.closePopup();
      }
      this.savedRange = null;
      return;
    }

    // CRITICAL: Bỏ qua nếu selection nằm trong textarea hoặc input
    // Để tránh can thiệp vào việc gõ và paste
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'INPUT' ||
      (activeElement instanceof HTMLElement && activeElement.isContentEditable)
    )) {
      // Nếu selection nằm trong textarea/input, không xử lý
      // Chỉ xử lý khi user đang select text trong content (không phải đang gõ)
      const rangeContainer = range.commonAncestorContainer;
      if (rangeContainer.nodeType === Node.TEXT_NODE) {
        const parent = rangeContainer.parentElement;
        if (parent && (
          parent.tagName === 'TEXTAREA' || 
          parent.tagName === 'INPUT' ||
          parent.closest('textarea') ||
          parent.closest('input')
        )) {
          // Selection trong textarea/input, bỏ qua
          return;
        }
      } else if (rangeContainer.nodeType === Node.ELEMENT_NODE) {
        const element = rangeContainer as Element;
        if (element.tagName === 'TEXTAREA' || 
            element.tagName === 'INPUT' ||
            element.closest('textarea') ||
            element.closest('input')) {
          // Selection trong textarea/input, bỏ qua
          return;
        }
      }
    }

    // Lưu selected text và range (giữ nguyên selection)
    this.selectedText.set(selectedText);
    this.savedRange = range.cloneRange();

    // Hiển thị hoặc cập nhật popup button
    if (this.popupElement && this.popupElement.classList.contains('translate-selection-popup')) {
      // Cập nhật vị trí popup hiện có
      this.updateTranslateButtonPosition();
    } else {
      // Tạo popup mới
      this.showTranslateButton();
    }
  }

  private updateTranslateButtonPosition(): void {
    if (!this.popupElement || !this.savedRange) {
      return;
    }

    try {
      const rect = this.savedRange.getBoundingClientRect();
      const popup = this.popupElement;
      popup.style.left = `${rect.left + rect.width / 2 - 40}px`;
      popup.style.top = `${rect.bottom + 8}px`;
    } catch (error) {
      console.warn('Error updating translate button position:', error);
    }
  }

  private showTranslateButton(): void {
    // Nếu đang hiển thị popup result, không tạo button
    if (this.popupElement && this.popupElement.classList.contains('translate-result-popup')) {
      return;
    }

    // Đóng popup button cũ nếu có
    if (this.popupElement && this.popupElement.classList.contains('translate-selection-popup')) {
      this.popupElement.remove();
      this.popupElement = null;
    }
    
    // Đánh dấu đang hiển thị popup
    this.isShowingPopup = true;

    if (!this.savedRange) {
      return;
    }

    let rect: DOMRect;
    try {
      rect = this.savedRange.getBoundingClientRect();
    } catch (error) {
      console.warn('Range is no longer valid:', error);
      return;
    }

    // Tạo popup button
    const popup = document.createElement('div');
    popup.className = 'translate-selection-popup';
    popup.innerHTML = `
      <button class="translate-btn" title="Dịch sang tiếng Việt">
        <span class="translate-icon">🌐</span>
        <span class="translate-text">Dịch</span>
      </button>
    `;

    // Đặt vị trí popup
    popup.style.position = 'fixed';
    popup.style.left = `${rect.left + rect.width / 2 - 40}px`;
    popup.style.top = `${rect.bottom + 8}px`;
    popup.style.zIndex = '9999';

    // Thêm vào document
    document.body.appendChild(popup);
    this.popupElement = popup;

    // Thêm event listener cho nút dịch - sử dụng mousedown để bắt sớm hơn
    const translateBtn = popup.querySelector('.translate-btn');
    if (translateBtn) {
      translateBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        // Giữ selection khi click vào nút
        this.restoreSelection();
      }, true); // Sử dụng capture phase để bắt sớm hơn
      
      translateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        // Giữ selection trước khi dịch
        this.restoreSelection();
        
        // Hiển thị loading state
        const btn = (e.target as HTMLElement).closest('.translate-btn') as HTMLElement || translateBtn as HTMLElement;
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span>Đang dịch...</span>';
        btn.setAttribute('disabled', 'true');
        btn.style.opacity = '0.7';
        btn.style.cursor = 'wait';
        
        console.log('Translate button clicked, text:', this.selectedText());
        
        // Gọi dịch
        this.translateSelectedText();
        
        // Restore button sau một thời gian ngắn nếu có lỗi
        setTimeout(() => {
          if (!this.isTranslating()) {
            btn.innerHTML = originalContent;
            btn.removeAttribute('disabled');
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          }
        }, 100);
      }, true); // Sử dụng capture phase để bắt sớm hơn
    }

    // Đóng popup khi click ra ngoài - delay lâu hơn để tránh bắt ngay lập tức
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
    }
    
    // Sử dụng capture phase và delay đủ lâu để popup được render
    setTimeout(() => {
      this.clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // CRITICAL: Bỏ qua nếu click vào textarea hoặc input
        // Để tránh can thiệp vào việc gõ và paste
        if (target.tagName === 'TEXTAREA' || 
            target.tagName === 'INPUT' ||
            target.closest('textarea') ||
            target.closest('input')) {
          // Click vào textarea/input, không xử lý - để user có thể gõ và paste bình thường
          return;
        }
        
        // Không đóng nếu click trên popup hoặc nút dịch
        if (popup && popup.contains(target)) {
          // Nếu click vào nút dịch hoặc bất kỳ phần tử nào trong button, giữ selection
          if (target.closest('.translate-btn') || target.classList.contains('translate-btn') || target.closest('.translate-icon') || target.closest('.translate-text')) {
            this.restoreSelection();
            // Không đóng popup khi click vào button
            return;
          }
          // Nếu click vào popup nhưng không phải button, cũng không đóng
          return;
        }
        
        // Không đóng nếu đang có selection mới (người dùng có thể đang select text khác)
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          // Kiểm tra xem selection mới có khác với selection đã lưu không
          if (this.savedRange && selection.rangeCount > 0) {
            const currentRange = selection.getRangeAt(0);
            if (!this.savedRange.isPointInRange(currentRange.startContainer, currentRange.startOffset) &&
                !this.savedRange.isPointInRange(currentRange.endContainer, currentRange.endOffset)) {
              // Selection mới, giữ selection mới và hiển thị popup mới nếu cần
              return;
            }
          }
          return;
        }
        
        // Chỉ clear selection và đóng popup khi click ra ngoài và không có selection
        if (selection) {
          selection.removeAllRanges();
        }
        this.closePopup();
      };
      // Sử dụng capture phase để bắt event trước khi nó bubble
      document.addEventListener('click', this.clickHandler, true);
    }, 300);
  }

  private translateSelectedText(): void {
    const text = this.selectedText();
    if (!text || text.trim().length === 0) {
      console.warn('No text selected for translation');
      return;
    }

    console.log('Translating text:', text);
    this.isTranslating.set(true);

    // Dịch text
    this.translationService.translate(text).subscribe({
      next: (result) => {
        console.log('Translation result:', result);
        this.translationResult.set(result);
        this.isTranslating.set(false);
        
        // Restore button state trước khi hiển thị popup kết quả
        const translateBtn = document.querySelector('.translate-btn') as HTMLElement;
        if (translateBtn) {
          translateBtn.innerHTML = '<span class="translate-icon">🌐</span><span class="translate-text">Dịch</span>';
          translateBtn.removeAttribute('disabled');
          translateBtn.style.opacity = '1';
          translateBtn.style.cursor = 'pointer';
        }
        
        this.showTranslationPopup();
      },
      error: (error) => {
        console.error('Translation failed:', error);
        this.isTranslating.set(false);
        
        // Restore button state khi có lỗi
        const translateBtn = document.querySelector('.translate-btn') as HTMLElement;
        if (translateBtn) {
          translateBtn.innerHTML = '<span class="translate-icon">🌐</span><span class="translate-text">Dịch</span>';
          translateBtn.removeAttribute('disabled');
          translateBtn.style.opacity = '1';
          translateBtn.style.cursor = 'pointer';
        }
        
        this.showErrorPopup();
      }
    });
  }

  private showTranslationPopup(): void {
    console.log('showTranslationPopup called');
    
    const result = this.translationResult();
    if (!result) {
      console.warn('No translation result available');
      return;
    }
    
    console.log('Translation result:', result);

    // Lưu và clone savedRange trước khi đóng popup cũ
    let rangeToUse: Range | null = null;
    if (this.savedRange) {
      try {
        rangeToUse = this.savedRange.cloneRange();
        console.log('Range cloned successfully');
      } catch (error) {
        console.warn('Cannot clone range:', error);
        // Vẫn tiếp tục, sẽ thử dùng selection hiện tại
      }
    } else {
      console.warn('No savedRange available, trying to use current selection');
      // Thử lấy selection hiện tại
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        try {
          rangeToUse = selection.getRangeAt(0).cloneRange();
          console.log('Using current selection range');
        } catch (error) {
          console.error('Cannot clone current selection range:', error);
        }
      }
    }
    
    // Đóng popup button cũ nhưng giữ lại savedRange
    if (this.popupElement && this.popupElement.classList.contains('translate-selection-popup')) {
      this.popupElement.remove();
      this.popupElement = null;
      this.isShowingPopup = false;
    }
    
    // Khôi phục savedRange sau khi đóng popup cũ
    this.savedRange = rangeToUse;

    // Sử dụng savedRange hoặc thử lấy từ selection hiện tại
    if (!this.savedRange) {
      console.error('No valid range available for popup positioning');
      // Vẫn hiển thị popup nhưng ở vị trí mặc định
      this.createTranslationPopup(result, null);
      return;
    }

    let rect: DOMRect;
    try {
      rect = this.savedRange.getBoundingClientRect();
      console.log('Range rect:', rect);
    } catch (error) {
      // Nếu range không còn hợp lệ, hiển thị popup ở vị trí mặc định
      console.warn('Range is no longer valid, using default position:', error);
      this.createTranslationPopup(result, null);
      return;
    }
    
    this.createTranslationPopup(result, rect);
  }
  
  private createTranslationPopup(result: TranslationResult, rect: DOMRect | null): void {
    console.log('Creating translation popup');

    // Tạo popup hiển thị kết quả dịch - đơn giản và đẹp hơn
    const popup = document.createElement('div');
    popup.className = 'translate-result-popup';
    
    // Đếm số từ trong originalText (chia bởi khoảng trắng)
    const wordCount = result.originalText.trim().split(/\s+/).filter(word => word.length > 0).length;
    const isMultiWord = wordCount >= 2;
    
    // Nếu có 2 từ trở lên: chỉ hiển thị bản dịch chính (không gộp các cách dịch khác)
    // Nếu chỉ có 1 từ: gộp bản dịch chính và các cách dịch khác
    let vietnameseText: string;
    if (isMultiWord) {
      // Chỉ lấy bản dịch chính
      vietnameseText = this.escapeHtml(result.translatedText);
    } else {
      // Gộp bản dịch chính và các cách dịch khác vào 1 dòng
      const allVietnameseTranslations: string[] = [result.translatedText];
      if (result.alternativeTranslations && result.alternativeTranslations.length > 0) {
        allVietnameseTranslations.push(...result.alternativeTranslations);
      }
      vietnameseText = allVietnameseTranslations.map(text => this.escapeHtml(text)).join(', ');
    }
    
    let contentHtml = `
      <div class="translate-result-header">
        <span class="translate-result-title">🌐 Dịch nghĩa</span>
        <button class="translate-close-btn" aria-label="Đóng">×</button>
      </div>
      <div class="translate-result-body">
        <div class="translate-item translate-main-item">
          <div class="translate-item-label">🇻🇳 Tiếng Việt</div>
          <div class="translate-item-value highlight">${vietnameseText}</div>
        </div>
    `;
    
    // Synonyms - từ đồng nghĩa tiếng Anh (chỉ hiển thị nếu 1 từ và có synonyms)
    if (!isMultiWord && result.synonyms && result.synonyms.length > 0) {
      contentHtml += `
        <div class="translate-item translate-synonyms-item">
          <div class="translate-item-label">🔤 Từ đồng nghĩa</div>
          <div class="translate-item-value">${result.synonyms.map(syn => this.escapeHtml(syn)).join(', ')}</div>
        </div>
      `;
    }
    
    contentHtml += `
      </div>
    `;
    
    popup.innerHTML = contentHtml;

    // Đặt vị trí popup - ưu tiên mở rộng width, nhỏ về chiều cao, nằm ngay dưới text
    popup.style.position = 'fixed';
    const popupWidth = 650; // Tăng width để mở rộng bề ngang
    const popupMaxHeight = 350; // Giảm height để nhỏ hơn
    
    let left: number;
    let top: number;
    
    if (rect) {
      // Căn giữa theo chiều ngang, đặt ngay bên dưới text được chọn
      left = rect.left + rect.width / 2 - popupWidth / 2;
      top = rect.bottom + 8; // Giảm khoảng cách để gần hơn

      // Đảm bảo popup không vượt quá viewport
      const padding = 16;
      if (left < padding) {
        left = padding;
      }
      if (left + popupWidth > window.innerWidth - padding) {
        left = window.innerWidth - popupWidth - padding;
      }
      
      // Kiểm tra xem có đủ chỗ bên dưới không
      const spaceBelow = window.innerHeight - rect.bottom - padding;
      const spaceAbove = rect.top - padding;
      const estimatedPopupHeight = Math.min(popupMaxHeight, 200); // Ước tính chiều cao popup
      
      if (spaceBelow < estimatedPopupHeight) {
        // Không đủ chỗ bên dưới - đặt popup ở phía trên văn bản
        top = rect.top - estimatedPopupHeight - 8;
        
        // Đảm bảo popup không vượt quá viewport phía trên
        if (top < padding) {
          top = padding;
          // Nếu vẫn không đủ chỗ, scroll để hiển thị popup
          if (rect.top < estimatedPopupHeight + padding + 8) {
            window.scrollTo({
              top: window.scrollY + (rect.top - estimatedPopupHeight - padding - 8),
              behavior: 'smooth'
            });
          }
        }
        
        // Remove padding nếu có (không cần padding nữa)
        this.removePaddingFromBody();
      } else {
        // Đủ chỗ bên dưới, đặt popup bên dưới text
        top = rect.bottom + 8;
        // Đảm bảo remove padding nếu có
        this.removePaddingFromBody();
      }
    } else {
      // Vị trí mặc định ở giữa màn hình
      left = Math.round((window.innerWidth - popupWidth) / 2);
      top = Math.round((window.innerHeight - popupMaxHeight) / 2);
    }

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.width = `${popupWidth}px`;
    popup.style.maxHeight = `${popupMaxHeight}px`;
    popup.style.zIndex = '9999';
    
    // Sau khi set position, kiểm tra lại và điều chỉnh nếu cần
    // Sử dụng requestAnimationFrame để đảm bảo popup đã được render
    if (rect) {
      requestAnimationFrame(() => {
        const popupRect = popup.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const padding = 16;
        
        // Nếu popup bị khuất ở dưới, di chuyển lên trên
        if (popupRect.bottom > viewportHeight - padding) {
          const newTop = rect.top - popupRect.height - 8;
          if (newTop >= padding) {
            popup.style.top = `${newTop}px`;
          } else {
            // Nếu không đủ chỗ ở trên, scroll để hiển thị popup
            const scrollAmount = popupRect.bottom - (viewportHeight - padding) + 20;
            window.scrollBy({
              top: scrollAmount,
              behavior: 'smooth'
            });
          }
        }
        
        // Nếu popup bị khuất ở trên, scroll để hiển thị
        if (popupRect.top < padding) {
          const scrollAmount = popupRect.top - padding - 20;
          window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          });
        }
      });
    }

    // Thêm vào document
    document.body.appendChild(popup);
    this.popupElement = popup;
    this.isShowingPopup = true;
    
    console.log('Translation popup created and added to DOM at:', left, top);

    // Thêm event listener cho nút đóng
    const closeBtn = popup.querySelector('.translate-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closePopup();
      });
    }

    // Đóng popup khi click ra ngoài
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
    }
    setTimeout(() => {
      this.clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // CRITICAL: Bỏ qua nếu click vào textarea hoặc input
        // Để tránh can thiệp vào việc gõ và paste
        if (target.tagName === 'TEXTAREA' || 
            target.tagName === 'INPUT' ||
            target.closest('textarea') ||
            target.closest('input')) {
          // Click vào textarea/input, không xử lý - để user có thể gõ và paste bình thường
          return;
        }
        
        // Không đóng nếu click trên popup
        if (popup && popup.contains(e.target as Node)) {
          return;
        }
        
        // Clear selection và đóng popup khi click ra ngoài
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
        this.closePopup();
      };
      document.addEventListener('click', this.clickHandler, true);
    }, 300);
  }

  private showErrorPopup(): void {
    this.closePopup();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const popup = document.createElement('div');
    popup.className = 'translate-error-popup';
    popup.innerHTML = `
      <div class="translate-error-content">
        <span>Không thể dịch. Vui lòng thử lại sau.</span>
        <button class="translate-close-btn">×</button>
      </div>
    `;

    popup.style.position = 'fixed';
    popup.style.left = `${rect.left + rect.width / 2 - 150}px`;
    popup.style.top = `${rect.bottom + 8}px`;
    popup.style.zIndex = '9999';

    document.body.appendChild(popup);
    this.popupElement = popup;

    const closeBtn = popup.querySelector('.translate-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closePopup();
      });
    }
  }

  private closePopup(): void {
    if (this.popupElement) {
      this.popupElement.remove();
      this.popupElement = null;
    }
    this.isShowingPopup = false;
    this.savedRange = null;
    // Remove padding đã thêm vào body
    this.removePaddingFromBody();
  }

  private addPaddingToBody(padding: number): void {
    if (this.addedBodyPadding === 0) {
      // Lưu padding hiện tại của body (nếu có)
      const currentPadding = parseInt(window.getComputedStyle(document.body).paddingBottom) || 0;
      document.body.style.paddingBottom = `${currentPadding + padding}px`;
      this.addedBodyPadding = padding;
    } else {
      // Nếu đã có padding, chỉ cần tăng thêm nếu cần
      const currentPadding = parseInt(window.getComputedStyle(document.body).paddingBottom) || 0;
      const neededPadding = Math.max(padding, this.addedBodyPadding);
      if (neededPadding > this.addedBodyPadding) {
        document.body.style.paddingBottom = `${currentPadding + (neededPadding - this.addedBodyPadding)}px`;
        this.addedBodyPadding = neededPadding;
      }
    }
  }

  private removePaddingFromBody(): void {
    if (this.addedBodyPadding > 0) {
      const currentPadding = parseInt(window.getComputedStyle(document.body).paddingBottom) || 0;
      const newPadding = Math.max(0, currentPadding - this.addedBodyPadding);
      if (newPadding === 0) {
        document.body.style.paddingBottom = '';
      } else {
        document.body.style.paddingBottom = `${newPadding}px`;
      }
      this.addedBodyPadding = 0;
    }
  }

  private restoreSelection(): void {
    if (this.savedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(this.savedRange);
      }
    }
  }

  private setupScrollHandler(): void {
    this.scrollHandler = () => {
      if (this.scrollUpdateFrame) {
        cancelAnimationFrame(this.scrollUpdateFrame);
      }
      
      this.scrollUpdateFrame = requestAnimationFrame(() => {
        this.updatePopupPosition();
        this.scrollUpdateFrame = null;
      });
    };

    window.addEventListener('scroll', this.scrollHandler, true);
    window.addEventListener('resize', this.scrollHandler);
  }

  private updatePopupPosition(): void {
    if (!this.popupElement || !this.savedRange) {
      return;
    }

    try {
      // Lấy vị trí mới của range
      const rect = this.savedRange.getBoundingClientRect();
      
      // Cập nhật vị trí cho translate button
      if (this.popupElement.classList.contains('translate-selection-popup')) {
        this.popupElement.style.left = `${rect.left + rect.width / 2 - 40}px`;
        this.popupElement.style.top = `${rect.bottom + 8}px`;
        return;
      }
      
      // Cập nhật vị trí cho translate result popup
      if (this.popupElement.classList.contains('translate-result-popup')) {
        const popupWidth = 650;
        const popupMaxHeight = 350;
        
        let left = rect.left + rect.width / 2 - popupWidth / 2;
        let top = rect.bottom + 8;

        // Đảm bảo popup không vượt quá viewport
        const padding = 16;
        if (left < padding) {
          left = padding;
        }
        if (left + popupWidth > window.innerWidth - padding) {
          left = window.innerWidth - popupWidth - padding;
        }
        
        // Kiểm tra xem có đủ chỗ bên dưới không
        const spaceBelow = window.innerHeight - rect.bottom - padding;
        const spaceAbove = rect.top - padding;
        const estimatedPopupHeight = Math.min(popupMaxHeight, 200);
        
        if (spaceBelow < estimatedPopupHeight) {
          // Không đủ chỗ bên dưới - đặt popup ở phía trên văn bản
          top = rect.top - estimatedPopupHeight - 8;
          
          // Đảm bảo popup không vượt quá viewport phía trên
          if (top < padding) {
            top = padding;
            // Nếu vẫn không đủ chỗ, scroll để hiển thị popup
            if (rect.top < estimatedPopupHeight + padding + 8) {
              window.scrollTo({
                top: window.scrollY + (rect.top - estimatedPopupHeight - padding - 8),
                behavior: 'smooth'
              });
            }
          }
          
          // Remove padding nếu có (không cần padding nữa)
          this.removePaddingFromBody();
        } else {
          // Đủ chỗ bên dưới, đặt popup bên dưới text
          top = rect.bottom + 8;
          // Remove padding nếu không cần
          this.removePaddingFromBody();
        }

        // Cập nhật vị trí popup
        this.popupElement.style.left = `${left}px`;
        this.popupElement.style.top = `${top}px`;
      }
    } catch (error) {
      // Nếu range không còn hợp lệ (element đã bị xóa), đóng popup
      console.warn('Range is no longer valid, closing popup');
      this.closePopup();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

