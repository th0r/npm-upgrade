export function toSentence(items) {
  if (items.length <= 1) {
    return items[0] || '';
  }

  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}
