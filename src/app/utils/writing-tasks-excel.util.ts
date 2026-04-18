import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { WritingTask, Task1Type, Task2Type, WritingTaskSource } from '../models/writing-task.model';

/** Dòng bắt đầu nhập dữ liệu; áp dụng dropdown từ đây đến DATA_END_ROW */
const TEMPLATE_DATA_START_ROW = 3;
const TEMPLATE_DATA_END_ROW = 2000;

export type WritingTaskCreateInput = Omit<WritingTask, 'id' | 'createdAt' | 'updatedAt'>;

/** Row 2 keys — align with DB / API (snake_case) */
export const WRITING_IMPORT_KEYS = [
  'task_kind',
  'title',
  'instruction',
  'difficulty',
  'time_limit',
  'word_count',
  'source',
  'is_active',
  'tags',
  'tips',
  'sample_answer',
  'writing_guide',
  'task1_type',
  'description',
  'image_url',
  'task2_type',
  'question',
  'additional_questions'
] as const;

export type WritingImportKey = (typeof WRITING_IMPORT_KEYS)[number];

const VI_HEADER: string[] = [
  'Loại bài (task_kind: TASK1 | TASK2)',
  'Tiêu đề (title)',
  'Đề bài / instruction',
  'Độ khó (difficulty)',
  'Thời gian — phút (time_limit)',
  'Số từ mục tiêu (word_count)',
  'Nguồn đề (source)',
  'Đang hoạt động (is_active)',
  'Tags — phân tách bằng dấu phẩy (tags)',
  'Mẹo — phân tách bằng | (tips)',
  'Câu trả lời mẫu (sample_answer)',
  'Hướng dẫn viết (writing_guide)',
  'Dạng Task 1 (task1_type)',
  'Mô tả Task 1 (description)',
  'URL ảnh Task 1 (image_url)',
  'Dạng Task 2 (task2_type)',
  'Câu hỏi chính Task 2 (question)',
  'Câu hỏi bổ sung Task 2 — phân tách ; (additional_questions)'
];

const TASK1_ENUM_TO_KEBAB: Record<string, Task1Type> = {
  LINE_GRAPH: 'line-graph',
  BAR_CHART: 'bar-chart',
  PIE_CHART: 'pie-chart',
  TABLE: 'table',
  MIXED_GRAPH: 'mixed-graph',
  MAP: 'map',
  PROCESS: 'process',
  'LINE-GRAPH': 'line-graph',
  'BAR-CHART': 'bar-chart',
  'PIE-CHART': 'pie-chart',
  'MIXED-GRAPH': 'mixed-graph',
  line_graph: 'line-graph',
  bar_chart: 'bar-chart',
  pie_chart: 'pie-chart',
  mixed_graph: 'mixed-graph',
  'line-graph': 'line-graph',
  'bar-chart': 'bar-chart',
  'pie-chart': 'pie-chart',
  'mixed-graph': 'mixed-graph',
  table: 'table',
  map: 'map',
  process: 'process'
};

const TASK2_ENUM_TO_KEBAB: Record<string, Task2Type> = {
  AGREE_DISAGREE: 'agree-disagree',
  DISCUSSION: 'discussion',
  ADVANTAGES_DISADVANTAGES: 'advantages-disadvantages',
  CAUSES_PROBLEMS_SOLUTIONS: 'causes-problems-solutions',
  TWO_PART_QUESTION: 'two-part-question',
  POSITIVE_NEGATIVE_DEVELOPMENT: 'positive-negative-development',
  'AGREE-DISAGREE': 'agree-disagree',
  'ADVANTAGES-DISADVANTAGES': 'advantages-disadvantages',
  'CAUSES-PROBLEMS-SOLUTIONS': 'causes-problems-solutions',
  'TWO-PART-QUESTION': 'two-part-question',
  'POSITIVE-NEGATIVE-DEVELOPMENT': 'positive-negative-development',
  agree_disagree: 'agree-disagree',
  advantages_disadvantages: 'advantages-disadvantages',
  causes_problems_solutions: 'causes-problems-solutions',
  two_part_question: 'two-part-question',
  positive_negative_development: 'positive-negative-development',
  'agree-disagree': 'agree-disagree',
  discussion: 'discussion',
  'advantages-disadvantages': 'advantages-disadvantages',
  'causes-problems-solutions': 'causes-problems-solutions',
  'two-part-question': 'two-part-question',
  'positive-negative-development': 'positive-negative-development'
};

export interface WritingImportRowResult {
  /** Số dòng trên sheet Excel (1-based) */
  excelRow: number;
  task: WritingTaskCreateInput | null;
  parseError?: string;
}

function cell(row: unknown[], colMap: Map<string, number>, key: string): string {
  const idx = colMap.get(key);
  if (idx === undefined) return '';
  const v = row[idx];
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function parseBool(s: string): boolean {
  if (s === '' || s == null) return true;
  const v = s.toLowerCase();
  if (['false', '0', 'no', 'không', 'off'].includes(v)) return false;
  return true;
}

function parseDifficulty(s: string): 'easy' | 'medium' | 'hard' {
  const u = s.toUpperCase().replace(/-/g, '_');
  if (u === 'EASY') return 'easy';
  if (u === 'HARD') return 'hard';
  return 'medium';
}

function parseSource(s: string): WritingTaskSource | undefined {
  if (!s) return undefined;
  const u = s.toUpperCase().replace(/-/g, '_').replace(/\s/g, '_');
  const allowed: WritingTaskSource[] = [
    'CAMBRIDGE',
    'VOL',
    'ACTUAL_TESTS',
    'FORECAST',
    'OTHERS'
  ];
  if (allowed.includes(u as WritingTaskSource)) return u as WritingTaskSource;
  return undefined;
}

function normalizeTask1Type(raw: string): Task1Type | null {
  if (!raw) return null;
  const k = raw.trim();
  if (TASK1_ENUM_TO_KEBAB[k]) return TASK1_ENUM_TO_KEBAB[k];
  const up = k.toUpperCase().replace(/-/g, '_');
  return TASK1_ENUM_TO_KEBAB[up] ?? null;
}

function normalizeTask2Type(raw: string): Task2Type | null {
  if (!raw) return null;
  const k = raw.trim();
  if (TASK2_ENUM_TO_KEBAB[k]) return TASK2_ENUM_TO_KEBAB[k];
  const up = k.toUpperCase().replace(/-/g, '_');
  return TASK2_ENUM_TO_KEBAB[up] ?? null;
}

function buildColMap(headerRow: unknown[]): Map<string, number> {
  const map = new Map<string, number>();
  headerRow.forEach((cell, i) => {
    const key = String(cell ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    if (key) map.set(key, i);
  });
  return map;
}

function rowIsEmpty(row: unknown[]): boolean {
  return !row.some(c => c !== undefined && c !== null && String(c).trim() !== '');
}

/**
 * Dòng 1: tiêu đề tiếng Việt, dòng 2: tên cột (tiếng Anh / DB).
 * Dữ liệu từ dòng 3 trở đi.
 */
export async function parseWritingTasksExcel(file: File): Promise<WritingImportRowResult[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName =
    wb.SheetNames.find(n => /bài\s*viết/i.test(n)) ||
    wb.SheetNames.find(n => !/chú\s*thích/i.test(n)) ||
    wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    return [{ excelRow: 0, task: null, parseError: 'Không tìm thấy sheet dữ liệu.' }];
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: ''
  }) as unknown[][];

  if (rows.length < 3) {
    return [{ excelRow: 0, task: null, parseError: 'File cần ít nhất 2 dòng tiêu đề và 1 dòng dữ liệu.' }];
  }

  const headerEn = rows[1] as unknown[];
  const colMap = buildColMap(headerEn);
  if (!colMap.has('task_kind') || !colMap.has('title')) {
    return [
      {
        excelRow: 0,
        task: null,
        parseError:
          'Dòng 2 phải chứa các khóa tiếng Anh: task_kind, title, ... (tải file mẫu để đúng định dạng).'
      }
    ];
  }

  const out: WritingImportRowResult[] = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const excelRow = i + 1;
    if (rowIsEmpty(row)) continue;

    const kind = cell(row, colMap, 'task_kind').toUpperCase();
    const title = cell(row, colMap, 'title');

    if (!kind && !title) continue;

    if (!kind || (kind !== 'TASK1' && kind !== 'TASK2')) {
      out.push({
        excelRow,
        task: null,
        parseError: `task_kind phải là TASK1 hoặc TASK2 (dòng ${excelRow}).`
      });
      continue;
    }

    if (!title) {
      out.push({ excelRow, task: null, parseError: `Thiếu title (dòng ${excelRow}).` });
      continue;
    }

    const instruction = cell(row, colMap, 'instruction');
    const difficulty = parseDifficulty(cell(row, colMap, 'difficulty') || 'MEDIUM');
    const timeLimit = parseInt(cell(row, colMap, 'time_limit'), 10);
    const wordCount = parseInt(cell(row, colMap, 'word_count'), 10);
    const source = parseSource(cell(row, colMap, 'source'));
    const isActive = parseBool(cell(row, colMap, 'is_active'));
    const tagsStr = cell(row, colMap, 'tags');
    const tags = tagsStr
      ? tagsStr
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
      : [];
    const tipsStr = cell(row, colMap, 'tips');
    const tips = tipsStr
      ? tipsStr
          .split('|')
          .map(t => t.trim())
          .filter(Boolean)
      : [];
    const sampleAnswer = cell(row, colMap, 'sample_answer');
    const writingGuide = cell(row, colMap, 'writing_guide');

    const tl = Number.isFinite(timeLimit) ? timeLimit : kind === 'TASK1' ? 20 : 40;
    const wc = Number.isFinite(wordCount) ? wordCount : kind === 'TASK1' ? 150 : 250;

    const base = {
      title,
      instruction: instruction || '',
      difficulty,
      timeLimit: tl,
      wordCount: wc,
      source,
      isActive,
      tags,
      tips,
      sampleAnswer: sampleAnswer || '',
      writingGuide: writingGuide || ''
    };

    if (kind === 'TASK1') {
      const t1 = normalizeTask1Type(cell(row, colMap, 'task1_type'));
      if (!t1) {
        out.push({
          excelRow,
          task: null,
          parseError: `task1_type không hợp lệ (dòng ${excelRow}). Ví dụ: LINE_GRAPH, BAR_CHART...`
        });
        continue;
      }
      const task = {
        type: 'task1' as const,
        ...base,
        task1Type: t1,
        description: cell(row, colMap, 'description') || '',
        imageUrl: cell(row, colMap, 'image_url') || '',
        data: {}
      } as WritingTaskCreateInput;
      out.push({ excelRow, task });
    } else {
      const t2 = normalizeTask2Type(cell(row, colMap, 'task2_type'));
      const question = cell(row, colMap, 'question');
      if (!t2) {
        out.push({
          excelRow,
          task: null,
          parseError: `task2_type không hợp lệ (dòng ${excelRow}).`
        });
        continue;
      }
      if (!question) {
        out.push({ excelRow, task: null, parseError: `Thiếu question cho Task 2 (dòng ${excelRow}).` });
        continue;
      }
      const addStr = cell(row, colMap, 'additional_questions');
      const additionalQuestions = addStr
        ? addStr
            .split(';')
            .map(s => s.trim())
            .filter(Boolean)
        : [];
      const task = {
        type: 'task2' as const,
        ...base,
        task2Type: t2,
        question,
        additionalQuestions
      } as WritingTaskCreateInput;
      out.push({ excelRow, task });
    }
  }

  if (out.length === 0) {
    return [{ excelRow: 0, task: null, parseError: 'Không có dòng dữ liệu hợp lệ.' }];
  }

  return out;
}

/** Tải file mẫu .xlsx: dropdown (data validation) cho các cột enum; 2 dòng ví dụ + sheet chú thích ngắn. */
export async function downloadWritingTasksTemplate(): Promise<void> {
  const exampleTask1 = [
    'TASK1',
    'Ví dụ Task 1 — Biểu đồ dân số',
    'The chart shows population changes in three cities. Summarize...',
    'MEDIUM',
    '20',
    '150',
    'CAMBRIDGE',
    'TRUE',
    'population,cities',
    'So sánh xu hướng|Dùng số liệu chính xác',
    '',
    '',
    'LINE_GRAPH',
    'Line graph — population 1990–2020',
    'https://example.com/chart.png',
    '',
    '',
    ''
  ];

  const exampleTask2 = [
    'TASK2',
    'Ví dụ Task 2 — Discussion',
    'Some people believe that technology improves lives. Discuss both views.',
    'MEDIUM',
    '40',
    '250',
    'VOL',
    'TRUE',
    'technology,society',
    'Lập luận hai phía|Kết luận rõ',
    '',
    '',
    '',
    '',
    '',
    'DISCUSSION',
    'Discuss both views and give your opinion.',
    'What are the advantages?;What are the disadvantages?'
  ];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Bài viết', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  ws.addRow(VI_HEADER);
  ws.addRow([...WRITING_IMPORT_KEYS]);
  ws.addRow(exampleTask1);
  ws.addRow(exampleTask2);

  for (let c = 1; c <= WRITING_IMPORT_KEYS.length; c++) {
    ws.getColumn(c).width = 28;
  }

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0F2F1' }
  };
  ws.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = headerFill;
  });
  ws.getRow(2).eachCell(cell => {
    cell.font = { bold: true, italic: true, color: { argb: 'FF0F766E' } };
    cell.fill = headerFill;
  });

  const dvs = (
    ws as ExcelJS.Worksheet & {
      dataValidations: { add: (a: string, v: ExcelJS.DataValidation) => void };
    }
  ).dataValidations;

  const colRange = (colLetter: string): string =>
    `${colLetter}${TEMPLATE_DATA_START_ROW}:${colLetter}${TEMPLATE_DATA_END_ROW}`;

  const listDv = (colLetter: string, csvOptions: string, prompt?: string) => {
    dvs.add(colRange(colLetter), {
      type: 'list',
      allowBlank: true,
      formulae: [`"${csvOptions}"`],
      showInputMessage: true,
      promptTitle: 'Chọn giá trị',
      prompt: prompt || 'Chọn một giá trị trong danh sách.',
      showErrorMessage: true,
      errorTitle: 'Không hợp lệ',
      error: 'Chọn đúng một giá trị trong danh sách hoặc để trống (nếu cho phép).'
    });
  };

  listDv('A', 'TASK1,TASK2', 'Loại bài: TASK1 (Academic Task 1) hoặc TASK2 (Essay).');
  listDv('D', 'EASY,MEDIUM,HARD', 'Độ khó bài.');
  listDv('G', 'CAMBRIDGE,VOL,ACTUAL_TESTS,FORECAST,OTHERS', 'Nguồn đề (có thể để trống nếu không áp).');
  listDv('H', 'TRUE,FALSE', 'TRUE = hiển thị cho học viên, FALSE = ẩn.');
  listDv(
    'M',
    'LINE_GRAPH,BAR_CHART,PIE_CHART,TABLE,MIXED_GRAPH,MAP,PROCESS',
    'Chỉ dùng khi task_kind = TASK1 (có thể để trống nếu là TASK2).'
  );
  listDv(
    'P',
    'AGREE_DISAGREE,DISCUSSION,ADVANTAGES_DISADVANTAGES,CAUSES_PROBLEMS_SOLUTIONS,TWO_PART_QUESTION,POSITIVE_NEGATIVE_DEVELOPMENT',
    'Chỉ dùng khi task_kind = TASK2 (có thể để trống nếu là TASK1).'
  );

  const legend = wb.addWorksheet('Chú thích');
  legend.getColumn(1).width = 96;
  legend.addRow(['Gợi ý nhanh']);
  legend.getRow(1).font = { bold: true, size: 12 };
  legend.addRow([]);
  legend.addRow([
    'Trên sheet "Bài viết", các cột task_kind (A), difficulty (D), source (G), is_active (H), task1_type (M), task2_type (P) đã có sẵn dropdown từ dòng 3 đến 2000 — bạn không cần mở sheet này để tra enum.'
  ]);
  legend.addRow([]);
  legend.addRow([
    'Các cột nhập tay (không dropdown): title, instruction, time_limit, word_count, tags, tips, sample_answer, writing_guide, description, image_url, question, additional_questions.'
  ]);
  legend.addRow([]);
  legend.addRow(['• tags: phân tách bằng dấu phẩy']);
  legend.addRow(['• tips: phân tách bằng dấu |']);
  legend.addRow(['• additional_questions: phân tách bằng dấu ;']);

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mau-import-bai-writing.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}
