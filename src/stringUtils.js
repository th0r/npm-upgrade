export function toSentence(items) {
  if (items.length <= 1) {
    return items[0] || '';
  }

  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

export function toTimespan(string) {
  const match = string.match(/^(\d+)([smhd])$/);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}
