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
  UnderlineType,
} from 'docx';

export interface DocxReportInput {
  courseCode: string;
  courseTitle: string;
  labNumber: number;
  labTitle: string;
  studentName: string;
  studentId?: string;
  studentEmail?: string;
  submissionDate: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    codeSnapshots?: Array<{ title?: string; code: string; language?: string }>;
    images?: Array<{ base64Data: string; caption?: string }>;
  }>;
}

export async function generateDocxReport(input: DocxReportInput): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch / ~2.54 cm
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
                    text: `${input.courseCode}: ${input.courseTitle} | Laboratory Technical Report`,
                    font: 'Arial',
                    size: 18, // 9pt
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
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Page ',
                    font: 'Arial',
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Arial',
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    text: ' of ',
                    font: 'Arial',
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Arial',
                    size: 18,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Document Header / Course Banner
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: `${input.courseCode} - ${input.courseTitle}`,
                font: 'Arial',
                size: 24, // 12pt
                bold: true,
                color: '1E3A8A', // Deep academic blue
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { before: 120, after: 240 },
            children: [
              new TextRun({
                text: `Lab ${String(input.labNumber).padStart(2, '0')}: ${input.labTitle}`,
                font: 'Arial',
                size: 36, // 18pt
                bold: true,
                color: '0F172A',
              }),
            ],
          }),

          // Academic Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F1F5F9' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Student Name:', bold: true, font: 'Arial', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: input.studentName, font: 'Arial', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    shading: { fill: 'F1F5F9' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Student ID:', bold: true, font: 'Arial', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: input.studentId || 'N/A', font: 'Arial', size: 20 })],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F1F5F9' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Institutional Email:', bold: true, font: 'Arial', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: input.studentEmail || 'N/A', font: 'Arial', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    shading: { fill: 'F1F5F9' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Date Generated:', bold: true, font: 'Arial', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: input.submissionDate, font: 'Arial', size: 20 })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 240, after: 120 }, children: [] }),

          // Report Sections
          ...input.sections.flatMap((section) => {
            const sectionElements: (Paragraph | Table)[] = [];

            // Section Heading
            sectionElements.push(
              new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 360, after: 140 },
                children: [
                  new TextRun({
                    text: section.title,
                    bold: true,
                    font: 'Arial',
                    size: 26, // 13pt
                    color: '1E3A8A',
                  }),
                ],
              })
            );

            // Section Body Text (paragraphs)
            const textParagraphs = section.content.split('\n\n').filter((p) => p.trim().length > 0);
            if (textParagraphs.length === 0) {
              sectionElements.push(
                new Paragraph({
                  spacing: { before: 60, after: 120 },
                  children: [
                    new TextRun({
                      text: '[No description entered for this section]',
                      italics: true,
                      font: 'Arial',
                      size: 22,
                      color: '94A3B8',
                    }),
                  ],
                })
              );
            } else {
              for (const p of textParagraphs) {
                sectionElements.push(
                  new Paragraph({
                    spacing: { before: 60, after: 140 },
                    children: [
                      new TextRun({
                        text: p,
                        font: 'Arial',
                        size: 22, // 11pt
                        color: '1E293B',
                      }),
                    ],
                  })
                );
              }
            }

            // Attached Code Snapshots
            if (section.codeSnapshots && section.codeSnapshots.length > 0) {
              for (const codeItem of section.codeSnapshots) {
                if (codeItem.title) {
                  sectionElements.push(
                    new Paragraph({
                      spacing: { before: 180, after: 60 },
                      children: [
                        new TextRun({
                          text: `Listing: ${codeItem.title}`,
                          bold: true,
                          font: 'Arial',
                          size: 20,
                          color: '475569',
                        }),
                      ],
                    })
                  );
                }

                // Monospace code box
                const codeLines = codeItem.code.split('\n');
                sectionElements.push(
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    margins: { top: 120, bottom: 120, left: 160, right: 160 },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            shading: { fill: 'F8FAFC' },
                            borders: {
                              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                              left: { style: BorderStyle.SINGLE, size: 12, color: '3B82F6' }, // Accent border
                              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                            },
                            children: codeLines.map(
                              (line) =>
                                new Paragraph({
                                  spacing: { before: 20, after: 20 },
                                  children: [
                                    new TextRun({
                                      text: line || ' ',
                                      font: 'Consolas',
                                      size: 19, // 9.5pt
                                      color: '0F172A',
                                    }),
                                  ],
                                })
                            ),
                          }),
                        ],
                      }),
                    ],
                  })
                );
              }
            }

            // Attached Images / Plots
            if (section.images && section.images.length > 0) {
              for (const img of section.images) {
                try {
                  const base64Data = img.base64Data.replace(/^data:image\/\w+;base64,/, '');
                  const imgBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

                  sectionElements.push(
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 200, after: 80 },
                      children: [
                        new ImageRun({
                          data: imgBuffer,
                          transformation: {
                            width: 520,
                            height: 280,
                          },
                        } as any),
                      ],
                    })
                  );

                  if (img.caption) {
                    sectionElements.push(
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 40, after: 200 },
                        children: [
                          new TextRun({
                            text: `Figure: ${img.caption}`,
                            italics: true,
                            font: 'Arial',
                            size: 19,
                            color: '475569',
                          }),
                        ],
                      })
                    );
                  }
                } catch (imgErr) {
                  console.warn('Failed to embed image in docx:', imgErr);
                }
              }
            }

            return sectionElements;
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
