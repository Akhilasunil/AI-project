export const DOCUMENT_CATEGORIES = ['Leave', 'WFH', 'Holidays', 'HR', 'Policy', 'Process', 'Other'];

export const LEARNING_DOCUMENT_CATEGORIES = ['AI', 'AWS', 'Frontend', 'Accessibility', 'Process', 'Other'];

export const RESOURCE_TYPES = ['Document', 'Video', 'Course', 'Presentation', 'Other'];

export const RESOURCE_CATEGORIES = ['AI', 'AWS', 'Frontend', 'Accessibility', 'Process', 'Other'];

export function formatBytes(size) {
  if (!Number.isFinite(size)) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}
