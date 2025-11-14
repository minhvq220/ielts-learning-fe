import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import Quill from 'quill';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rich-text-editor-wrapper">
      <div #editorContainer class="editor-container"></div>
    </div>
  `,
  styles: [`
    .rich-text-editor-wrapper {
      width: 100%;
    }

    .editor-container {
      min-height: 300px;
    }

    :host ::ng-deep .ql-editor {
      min-height: 300px;
      font-size: 14px;
      line-height: 1.6;
    }

    :host ::ng-deep .ql-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    :host ::ng-deep .ql-snow .ql-stroke {
      stroke: #374151;
    }

    :host ::ng-deep .ql-snow .ql-fill {
      fill: #374151;
    }

    :host ::ng-deep .ql-snow.ql-toolbar {
      border: 1px solid #d1d5db;
      border-radius: 8px 8px 0 0;
      background: #f9fafb;
    }

    :host ::ng-deep .ql-snow .ql-container {
      border: 1px solid #d1d5db;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
  `]
})
export class RichTextEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;

  private quill!: Quill;

  ngOnInit() {
    // Component initialization
  }

  ngAfterViewInit() {
    this.initializeEditor();
  }

  private initializeEditor() {
    const toolbarOptions = [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ];

    this.quill = new Quill(this.editorContainer.nativeElement, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions
      },
      placeholder: 'Nhập hướng dẫn viết bài...'
    });

    // Set initial value
    if (this.value) {
      this.quill.root.innerHTML = this.value;
    }

    // Listen for text changes
    this.quill.on('text-change', () => {
      const html = this.quill.root.innerHTML;
      this.valueChange.emit(html);
    });
  }

  ngOnDestroy() {
    if (this.quill) {
      // Clean up if needed
    }
  }

  public getValue(): string {
    return this.quill ? this.quill.root.innerHTML : '';
  }

  public setValue(value: string): void {
    if (this.quill && value) {
      this.quill.root.innerHTML = value;
    }
  }
}

