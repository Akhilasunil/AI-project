import { NOT_FOUND_ANSWER } from '../../utils/catalog.js';
import { expandQueryTerms, selectSentences, tokenize } from '../../utils/text.js';

function resourceSentence(resources) {
  const titles = resources.map((resource) => resource.title).join(', ');
  const hasVideo = resources.some((resource) => resource.resourceType === 'Video');
  if (hasVideo) {
    return `A related video is available: ${titles}. This suggestion uses the saved title and description. The video itself has not been watched.`;
  }
  return `A related learning resource is available: ${titles}. The linked file was not opened. Only the saved title and description were used.`;
}

export function composeMockAnswer({ question, passages, resources }) {
  if (!passages.length && !resources.length) {
    return {
      answer: NOT_FOUND_ANSWER,
      sufficientEvidence: false,
    };
  }

  const parts = [];
  if (passages.length) {
    const excerpt = selectSentences(passages[0].excerpt, expandQueryTerms(tokenize(question)));
    parts.push(excerpt || passages[0].excerpt.slice(0, 700));
  }
  if (resources.length) parts.push(resourceSentence(resources));

  return {
    answer: parts.join('\n\n'),
    sufficientEvidence: true,
  };
}
