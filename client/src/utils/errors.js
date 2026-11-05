export function getErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (error?.response) return fallback;
  return 'Unable to reach Company AI. Check your connection and try again.';
}

export function getFieldErrors(error) {
  const errors = error?.response?.data?.errors;
  if (!Array.isArray(errors)) return {};

  return errors.reduce((fieldErrors, item) => {
    if (item?.field && item?.message && !fieldErrors[item.field]) {
      fieldErrors[item.field] = item.message;
    }
    return fieldErrors;
  }, {});
}
