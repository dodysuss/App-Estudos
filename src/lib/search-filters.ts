export type StandardSearchQuery = {
  search: string;
  semantic: string;
  category: string;
  tags: string[];
};

type SearchableItem = {
  text: Array<string | null | undefined>;
  category?: string | null;
  tags?: string[];
};

const SEMANTIC_GROUPS = [
  ["ia", "ai", "inteligencia artificial", "chatgpt", "gpt", "prompt", "llm", "modelo"],
  ["codigo", "programacao", "dev", "desenvolvimento", "script", "api", "typescript", "javascript", "python"],
  ["marketing", "vendas", "copy", "funil", "conteudo", "social media"],
  ["automacao", "workflow", "n8n", "zapier", "make", "processo"],
  ["design", "ui", "ux", "produto", "interface", "experiencia"],
  ["estudo", "curso", "aula", "aprendizado", "treinamento", "playlist"],
  ["documento", "pdf", "arquivo", "material", "referencia", "link"],
  ["hack", "atalho", "truque", "solucao", "problema", "ideia"],
];

export function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function tokenize(value: string) {
  return normalizeSearchText(value)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function expandSemanticTokens(value: string) {
  const baseTokens = new Set(tokenize(value));

  for (const token of [...baseTokens]) {
    for (const group of SEMANTIC_GROUPS) {
      if (group.some((term) => normalizeSearchText(term).includes(token) || token.includes(normalizeSearchText(term)))) {
        group.flatMap(tokenize).forEach((expanded) => baseTokens.add(expanded));
      }
    }
  }

  return [...baseTokens];
}

function textCorpus(values: Array<string | null | undefined>) {
  return normalizeSearchText(values.filter(Boolean).join(" "));
}

export function matchesTextSearch(values: Array<string | null | undefined>, search: string) {
  const query = normalizeSearchText(search);
  if (!query) return true;
  return textCorpus(values).includes(query);
}

export function matchesSemanticSearch(values: Array<string | null | undefined>, semantic: string) {
  const tokens = expandSemanticTokens(semantic);
  if (!tokens.length) return true;

  const corpus = textCorpus(values);
  const corpusTokens = new Set(tokenize(corpus));

  return tokens.some((token) =>
    corpus.includes(token) ||
    [...corpusTokens].some((candidate) => candidate.includes(token) || token.includes(candidate)),
  );
}

export function matchesStandardFilters(item: SearchableItem, query: StandardSearchQuery) {
  return (
    matchesTextSearch(item.text, query.search) &&
    matchesSemanticSearch(item.text, query.semantic) &&
    (!query.category || item.category === query.category) &&
    (!query.tags.length || query.tags.every((tag) => item.tags?.includes(tag)))
  );
}

export function normalizeStandardSearchQuery(query: {
  search?: string;
  semantic?: string;
  category?: string;
  tag?: string | string[];
}) {
  const tags = (Array.isArray(query.tag) ? query.tag : query.tag ? [query.tag] : [])
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    search: query.search?.trim() ?? "",
    semantic: query.semantic?.trim() ?? "",
    category: query.category?.trim() ?? "",
    tags,
  };
}

export function uniqueSorted(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}
