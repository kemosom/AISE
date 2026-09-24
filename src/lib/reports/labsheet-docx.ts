import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import type { LabManifest } from '../../../labs/types';

export interface StickyNoteItem {
  id: string;
  x: number;
  y: number;
  text: string;
  timestamp: string;
}

export interface LabsheetDocxOptions {
  manifest: LabManifest;
  studentName?: string;
  studentId?: string;
  canvasImageBase64?: string | null;
  notes?: StickyNoteItem[];
}

/**
 * Generates an institutional Word (.docx) file containing the complete
 * laboratory theory, instructions, student notes, and annotated drawing overlay.
 */
export async function generateLabsheetDocx(options: LabsheetDocxOptions): Promise<Blob> {
  const { manifest, studentName, studentId, canvasImageBase64, notes = [] } = options;

  const displayName = studentName?.trim() || 'Student / Learner';
  const displayId = studentId?.trim() || 'Open Access';
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Parse markdown instructions into paragraphs and code blocks
  const markdownSections = manifest.instructionsMarkdown.split('\n\n');
  const bodyParagraphs: Paragraph[] = [];

  for (const block of markdownSections) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      bodyParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^# /, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 120 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      bodyParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^## /, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 100 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      bodyParagraphs.push(
        new Paragraph({
          text: trimmed.replace(/^### /, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        })
      );
    } else if (trimmed.startsWith('```')) {
      const codeLines = trimmed.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
      bodyParagraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          shading: { fill: 'F1F5F9' },
          children: [
            new TextRun({
              text: codeLines,
              font: 'Courier New',
              size: 19,
              color: '0F172A',
            }),
          ],
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n');
      for (const item of items) {
        const clean = item.replace(/^[-*]\s+/, '').trim();
        if (clean) {
          bodyParagraphs.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: clean,
                  font: 'Arial',
                  size: 21,
                  color: '334155',
                }),
              ],
            })
          );
        }
      }
    } else {
      // Standard narrative paragraph
      bodyParagraphs.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text: trimmed,
              font: 'Arial',
              size: 21,
              color: '1E293B',
            }),
          ],
        })
      );
    }
  }

  // Build Learning Outcomes Table
  const outcomeRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [
            new Paragraph({
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({
                  text: 'Target Academic Competencies & Learning Outcomes',
                  bold: true,
                  color: 'FFFFFF',
                  font: 'Arial',
                  size: 20,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  if (manifest.learningOutcomes && manifest.learningOutcomes.length > 0) {
    manifest.learningOutcomes.forEach((outcome: string, idx: number) => {
      outcomeRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    new TextRun({
                      text: `• ${outcome}`,
                      font: 'Arial',
                      size: 20,
                      color: '334155',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  // Student Marginalia / Notes Paragraphs
  const notesParagraphs: Paragraph[] = [];
  if (notes && notes.length > 0) {
    notesParagraphs.push(
      new Paragraph({
        text: 'Student Annotations & Marginalia Notes',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
      })
    );

    notes.forEach((n, idx) => {
      notesParagraphs.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          shading: { fill: 'FEF3C7' },
          children: [
            new TextRun({
              text: `[Note #${idx + 1}] (${n.timestamp}): `,
              bold: true,
              font: 'Arial',
              size: 20,
              color: '92400E',
            }),
            new TextRun({
              text: n.text,
              font: 'Arial',
              size: 20,
              color: '78350F',
            }),
          ],
        })
      );
    });
  }

  // Drawing Canvas Image
  const canvasParagraphs: Paragraph[] = [];
  if (canvasImageBase64) {
    try {
      const cleanBase64 = canvasImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const binaryString = atob(cleanBase64);
      const imgBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imgBuffer[i] = binaryString.charCodeAt(i);
      }

      canvasParagraphs.push(
        new Paragraph({
          text: 'Student Canvas Drawing & Inking Layer',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 120 },
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: {
                width: 520,
                height: 320,
              },
            } as any),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 200 },
          children: [
            new TextRun({
              text: 'Figure: Embedded pen circles, underlines, and visual annotations.',
              italics: true,
              font: 'Arial',
              size: 19,
              color: '64748B',
            }),
          ],
        })
      );
    } catch (err) {
      console.warn('Could not embed canvas drawing into docx:', err);
    }
  }

  // Construct Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `MAI5124: AI in Software Engineering | Lab ${manifest.labNumber} Sheet`,
                    font: 'Arial',
                    size: 17,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Page ',
                    font: 'Arial',
                    size: 17,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Arial',
                    size: 17,
                    color: '64748B',
                  }),
                  new TextRun({
                    text: ' of ',
                    font: 'Arial',
                    size: 17,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Arial',
                    size: 17,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Header Institutional Meta
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: 'SUNWAY UNIVERSITY • DEPARTMENT OF COMPUTING',
                bold: true,
                font: 'Arial',
                size: 20,
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 60 },
            children: [
              new TextRun({
                text: 'MAI5124 Artificial Intelligence in Software Engineering',
                bold: true,
                font: 'Arial',
                size: 26,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 180 },
            children: [
              new TextRun({
                text: `Lab ${manifest.labNumber}: ${manifest.title}`,
                bold: true,
                font: 'Arial',
                size: 28,
                color: '1E3A8A',
              }),
            ],
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 60, after: 60 },
                        children: [
                          new TextRun({ text: 'Student Name: ', bold: true, font: 'Arial', size: 20 }),
                          new TextRun({ text: displayName, font: 'Arial', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 40, after: 60 },
                        children: [
                          new TextRun({ text: 'Student ID: ', bold: true, font: 'Arial', size: 20 }),
                          new TextRun({ text: displayId, font: 'Arial', size: 20 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 60, after: 60 },
                        children: [
                          new TextRun({ text: 'Date: ', bold: true, font: 'Arial', size: 20 }),
                          new TextRun({ text: currentDate, font: 'Arial', size: 20 }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { before: 40, after: 60 },
                        children: [
                          new TextRun({ text: 'Estimated Duration: ', bold: true, font: 'Arial', size: 20 }),
                          new TextRun({ text: manifest.estimatedDuration || '3 Hours', font: 'Arial', size: 20 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // Learning Outcomes
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: outcomeRows,
          }),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // Markdown Content
          ...bodyParagraphs,

          // Student Notes if any
          ...notesParagraphs,

          // Canvas Drawings if any
          ...canvasParagraphs,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
