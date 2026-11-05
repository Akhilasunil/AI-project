import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Company AI` : 'Company AI';
  }, [title]);
}
