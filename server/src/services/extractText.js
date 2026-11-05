import fs from 'fs/promises';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function extractText(absolutePath, mimeType) {
  const buffer = await fs.readFile(absolutePath);

  if (mimeType === 'text/plain') {
    return buffer.toString('utf8');
  }

  if (mimeType === 'application/pdf') {
    // Import the parser directly. The package entry runs a sample file when
    // Node loads it from ESM, and that throws before any PDF is read.
    const loaded = await import('pdf-parse/lib/pdf-parse.js');
    const pdfParse = loaded.default || loaded;
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  }

  if (mimeType === DOCX) {
    const mammoth = await import('mammoth');
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value || '';
  }

  throw new Error('Unsupported file type.');
}
