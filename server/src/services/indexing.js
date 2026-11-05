import { KnowledgeChunk } from '../models/KnowledgeChunk.js';
import { extractText } from './extractText.js';
import { resolveStorageKey } from './storage.js';
import { chunkText } from '../utils/text.js';
import { embedTexts } from './ai/embeddings.js';

export async function indexDocument(document) {
  const absolutePath = resolveStorageKey(document.storageKey);
  const text = (await extractText(absolutePath, document.mimeType)).replace(/\u0000/g, '').trim();

  if (!text) {
    const error = new Error('No readable text was found in this file.');
    error.publicMessage = error.message;
    throw error;
  }

  const chunks = chunkText(text);
  const embeddings = await embedTexts(chunks);
  await KnowledgeChunk.deleteMany({ document: document._id });
  await KnowledgeChunk.insertMany(
    chunks.map((chunk, position) => ({
      document: document._id,
      text: chunk,
      position,
      embedding: embeddings[position] || undefined,
    })),
  );

  document.chunkCount = chunks.length;
  document.processingError = '';
  document.processingStatus = 'indexed';
}

export async function indexProject(project) {
  const absolutePath = resolveStorageKey(project.documentKey);
  const text = (await extractText(absolutePath, project.mimeType)).replace(/\u0000/g, '').trim();

  if (!text) {
    const error = new Error('No readable text was found in this file.');
    error.publicMessage = error.message;
    throw error;
  }

  const chunks = chunkText(text);
  const embeddings = await embedTexts(chunks);
  await KnowledgeChunk.deleteMany({ project: project._id });
  await KnowledgeChunk.insertMany(
    chunks.map((chunk, position) => ({
      project: project._id,
      text: chunk,
      position,
      embedding: embeddings[position] || undefined,
    })),
  );

  project.chunkCount = chunks.length;
  project.processingError = '';
  project.processingStatus = 'indexed';
}
