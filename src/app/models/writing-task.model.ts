// Writing Task 1 Types
export type Task1Type = 
  | 'line-graph'
  | 'bar-chart' 
  | 'pie-chart'
  | 'table'
  | 'mixed-graph'
  | 'map'
  | 'process';

// Writing Task 2 Types  
export type Task2Type =
  | 'agree-disagree'
  | 'discussion'
  | 'advantages-disadvantages'
  | 'causes-problems-solutions'
  | 'two-part-question'
  | 'positive-negative-development';

// Base Writing Task Interface
export interface BaseWritingTask {
  id: string;
  title: string;
  instruction: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in minutes
  wordCount: number; // target word count
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  tags: string[];
  sampleAnswer?: string;
  writingGuide?: string; // Rich text HTML guide
  tips?: string[];
}

// Task 1 Specific Interface
export interface WritingTask1 extends BaseWritingTask {
  type: 'task1';
  task1Type: Task1Type;
  data: Task1Data;
  description: string; // Description of the chart/graph/table
  imageUrl?: string; // URL or Base64 string of the image/chart for Task 1
}

// Task 2 Specific Interface
export interface WritingTask2 extends BaseWritingTask {
  type: 'task2';
  task2Type: Task2Type;
  question: string;
  additionalQuestions?: string[]; // For two-part questions
}

// Union type for all writing tasks
export type WritingTask = WritingTask1 | WritingTask2;

// Task 1 Data Types
export interface Task1Data {
  // For charts and graphs
  chartData?: ChartData;
  // For tables
  tableData?: TableData;
  // For maps
  mapData?: MapData;
  // For processes
  processData?: ProcessData;
}

export interface ChartData {
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  categories: string[];
  series: ChartSeries[];
  units?: string;
}

export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface TableData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  units?: string;
}

export interface MapData {
  title: string;
  locations: MapLocation[];
  changes?: MapChange[];
}

export interface MapLocation {
  name: string;
  coordinates: { x: number; y: number };
  description?: string;
}

export interface MapChange {
  location: string;
  before: string;
  after: string;
  year?: number;
}

export interface ProcessData {
  title: string;
  steps: ProcessStep[];
}

export interface ProcessStep {
  id: number;
  name: string;
  description: string;
  inputs?: string[];
  outputs?: string[];
}

// Writing Task Management
export interface WritingTaskFilter {
  type?: 'task1' | 'task2';
  task1Type?: Task1Type;
  task2Type?: Task2Type;
  difficulty?: 'easy' | 'medium' | 'hard';
  isActive?: boolean;
  search?: string;
}

export interface WritingTaskSort {
  field: 'title' | 'createdAt' | 'updatedAt' | 'difficulty';
  direction: 'asc' | 'desc';
}

// Writing Task Statistics
export interface WritingTaskStats {
  totalTasks: number;
  task1Count: number;
  task2Count: number;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  byTask1Type: Record<Task1Type, number>;
  byTask2Type: Record<Task2Type, number>;
  recentTasks: WritingTask[];
}
