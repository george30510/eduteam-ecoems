import * as XLSX from 'xlsx';

export const SUBJECTS = [
  'Habilidad verbal',
  'Habilidad matemática',
  'Español',
  'Historia',
  'Geografía',
  'Formación cívica y ética',
  'Matemáticas',
  'Física',
  'Química',
  'Biología'
];

export interface QuestionRow {
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  purpose: 'diagnostic' | 'exam' | 'both';
  question_text: string;
  question_equation?: string;
  question_image?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation_text?: string;
  explanation_equation?: string;
}

export interface ValidationResult {
  row: number;
  data: QuestionRow;
  isValid: boolean;
  errors: string[];
}

export const validateQuestionRow = (row: any, rowNumber: number): ValidationResult => {
  const errors: string[] = [];
  
  // Required fields
  if (!row.subject || row.subject.trim() === '') {
    errors.push('Subject is required');
  } else if (!SUBJECTS.includes(row.subject.trim())) {
    errors.push('Invalid subject');
  }
  
  if (!row.topic || row.topic.trim() === '') {
    errors.push('Topic is required');
  }
  
  if (!row.difficulty || !['easy', 'medium', 'hard'].includes(row.difficulty)) {
    errors.push('Difficulty must be: easy, medium, or hard');
  }
  
  if (!row.purpose || !['diagnostic', 'exam', 'both'].includes(row.purpose)) {
    errors.push('Purpose must be: diagnostic, exam, or both');
  }
  
  if (!row.question_text || row.question_text.trim() === '') {
    errors.push('Question text is required');
  } else if (row.question_text.length > 1000) {
    errors.push('Question text too long (max 1000 chars)');
  }
  
  if (!row.option_a || row.option_a.trim() === '') errors.push('Option A is required');
  if (!row.option_b || row.option_b.trim() === '') errors.push('Option B is required');
  if (!row.option_c || row.option_c.trim() === '') errors.push('Option C is required');
  if (!row.option_d || row.option_d.trim() === '') errors.push('Option D is required');
  
  if (!row.correct_option || !['A', 'B', 'C', 'D'].includes(row.correct_option)) {
    errors.push('Correct option must be: A, B, C, or D');
  }
  
  // URL validation if image is provided
  if (row.question_image && row.question_image.trim() !== '') {
    try {
      new URL(row.question_image);
    } catch {
      errors.push('Invalid image URL');
    }
  }
  
  return {
    row: rowNumber,
    data: {
      subject: row.subject?.trim() || '',
      topic: row.topic?.trim() || '',
      subtopic: row.subtopic?.trim() || undefined,
      difficulty: row.difficulty,
      purpose: row.purpose,
      question_text: row.question_text?.trim() || '',
      question_equation: row.question_equation?.trim() || undefined,
      question_image: row.question_image?.trim() || undefined,
      option_a: row.option_a?.trim() || '',
      option_b: row.option_b?.trim() || '',
      option_c: row.option_c?.trim() || '',
      option_d: row.option_d?.trim() || '',
      correct_option: row.correct_option,
      explanation_text: row.explanation_text?.trim() || undefined,
      explanation_equation: row.explanation_equation?.trim() || undefined,
    },
    isValid: errors.length === 0,
    errors
  };
};

export const parseExcelFile = (file: File): Promise<ValidationResult[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const results = jsonData.map((row, index) => 
          validateQuestionRow(row, index + 2) // +2 because row 1 is headers, Excel is 1-indexed
        );
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsBinaryString(file);
  });
};

export const generateExcelTemplate = () => {
  const template = [
    {
      subject: 'Matemáticas',
      topic: 'Álgebra',
      subtopic: 'Ecuaciones lineales',
      difficulty: 'medium',
      purpose: 'both',
      question_text: 'Resuelve la ecuación: 2x + 5 = 13',
      question_equation: '2x + 5 = 13',
      question_image: '',
      option_a: 'x = 3',
      option_b: 'x = 4',
      option_c: 'x = 5',
      option_d: 'x = 6',
      correct_option: 'B',
      explanation_text: 'Restamos 5 de ambos lados: 2x = 8, luego dividimos entre 2: x = 4',
      explanation_equation: 'x = \\frac{8}{2} = 4'
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // subject
    { wch: 20 }, // topic
    { wch: 20 }, // subtopic
    { wch: 12 }, // difficulty
    { wch: 12 }, // purpose
    { wch: 50 }, // question_text
    { wch: 30 }, // question_equation
    { wch: 40 }, // question_image
    { wch: 30 }, // option_a
    { wch: 30 }, // option_b
    { wch: 30 }, // option_c
    { wch: 30 }, // option_d
    { wch: 10 }, // correct_option
    { wch: 50 }, // explanation_text
    { wch: 30 }, // explanation_equation
  ];
  
  XLSX.writeFile(workbook, 'ECOEMS_Questions_Template.xlsx');
};