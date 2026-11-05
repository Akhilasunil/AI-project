export const DOCUMENT_CATEGORIES = ['Leave', 'WFH', 'Holidays', 'HR', 'Policy', 'Process', 'Other'];

export const LEARNING_DOCUMENT_CATEGORIES = ['AI', 'AWS', 'Frontend', 'Accessibility', 'Process', 'Other'];

export const ALL_DOCUMENT_CATEGORIES = [...new Set([...DOCUMENT_CATEGORIES, ...LEARNING_DOCUMENT_CATEGORIES])];

export const RESOURCE_TYPES = ['Document', 'Video', 'Course', 'Presentation', 'Other'];

export const RESOURCE_CATEGORIES = ['AI', 'AWS', 'Frontend', 'Accessibility', 'Process', 'Other'];

export const NOT_FOUND_ANSWER = "I couldn't find this information in the approved company sources.";

export function displayProjectStatus(project) {
  if (project.processingStatus === 'failed') return 'Failed';
  if (project.processingStatus === 'processing') return 'Processing';
  if (project.processingStatus === 'uploaded') return 'Uploaded';
  if (project.status === 'published' && project.processingStatus === 'indexed') return 'Published';
  if (project.processingStatus === 'indexed') return 'Indexed';
  return 'Uploaded';
}

export function displayDocumentStatus(document) {
  if (document.processingStatus === 'failed') return 'Failed';
  if (document.processingStatus === 'processing') return 'Processing';
  if (document.processingStatus === 'uploaded') return 'Uploaded';
  if (document.approvalStatus === 'pending_review') return 'Pending Review';
  if (document.approvalStatus === 'published' && document.processingStatus === 'indexed') return 'Published';
  if (document.processingStatus === 'indexed') return 'Indexed';
  return 'Uploaded';
}
