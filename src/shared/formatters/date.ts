export const formatDate = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

export const formatDateTime = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
