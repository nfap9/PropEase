export type TranslationValues = Record<string, string | number | boolean | null | undefined>;

export type TranslationLeaf =
  | string
  | ((values?: TranslationValues) => string);

export interface TranslationDictionary {
  [key: string]: TranslationLeaf | TranslationDictionary;
}

function getTranslationEntry(messages: TranslationDictionary, key: string): TranslationLeaf {
  const entry = key.split('.').reduce<TranslationLeaf | TranslationDictionary | undefined>(
    (current, segment) => {
      if (!current || typeof current === 'string' || typeof current === 'function') {
        return undefined;
      }

      return current[segment];
    },
    messages
  );

  if (typeof entry === 'string' || typeof entry === 'function') {
    return entry;
  }

  throw new Error(`Missing translation entry for key: ${key}`);
}

export function formatTranslation(
  template: string,
  values?: TranslationValues
): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = values[token];
    return value === undefined || value === null ? '' : String(value);
  });
}

export function createI18n<T extends TranslationDictionary>(messages: T) {
  return {
    messages,
    t: (key: string, values?: TranslationValues) => {
      const entry = getTranslationEntry(messages, key);
      if (typeof entry === 'function') {
        return entry(values);
      }

      return formatTranslation(entry, values);
    },
  };
}
