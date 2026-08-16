import { Injectable, signal } from '@angular/core';

export type AppLang = 'pt' | 'en';

const STORAGE_KEY = 'ia-translate-lang';

const DICTIONARY: Record<AppLang, Record<string, string>> = {
  pt: {
    'nav.translate': 'Traduzir',
    'nav.settings': 'Configurações',

    'translate.eyebrow': 'AI · Neural Translation',
    'translate.title': 'Tradução de Legendas',
    'translate.subtitle': 'Envie um arquivo .srt e receba a tradução para o idioma desejado.',
    'translate.file': 'Arquivo .srt',
    'translate.targetLanguage': 'Idioma de destino',
    'translate.button': 'Traduzir',
    'translate.buttonLoading': 'Traduzindo...',
    'translate.cancel': 'Cancelar tradução',
    'translate.cancelled': 'Tradução cancelada.',
    'translate.hint.batch': 'Lote {current} de {total} — {percent}%',
    'translate.hint.preparing': 'Preparando tradução...',
    'translate.download': 'Baixar {name}',
    'translate.error.selectFile': 'Selecione um arquivo .srt.',
    'translate.error.onlySrt': 'Apenas arquivos .srt são aceitos.',
    'translate.error.generic': 'Falha ao traduzir a legenda.',
    'translate.error.connectionLost': 'Conexão perdida durante a tradução.',

    'settings.eyebrow': 'Configuração',
    'settings.title': 'Provedor de IA',
    'settings.subtitle': 'Escolha o provedor e o modelo usados para traduzir as legendas.',
    'settings.provider': 'Provedor',
    'settings.model': 'Modelo',
    'settings.apiKey': 'Chave de API',
    'settings.apiKey.configured': 'configurada: {value}',
    'settings.apiKey.missing': 'não configurada',
    'settings.apiKey.placeholder': 'Cole uma nova chave para substituir',
    'settings.save': 'Salvar configurações',
    'settings.saving': 'Salvando...',
    'settings.saved': 'Configurações salvas.',
    'settings.version': 'Versão',
    'settings.docs': '📖 Documentação',
    'settings.author': 'Desenvolvido por',
    'settings.prompt.title': 'Prompt de tradução',
    'settings.prompt.subtitle':
      'Texto enviado à IA a cada lote de legendas. Use {targetLanguage} e {items} como placeholders.',
    'settings.prompt.default': 'usando o padrão do .env',
    'settings.prompt.custom': 'personalizado',
    'settings.prompt.save': 'Salvar prompt',
    'settings.prompt.reset': 'Restaurar padrão',
    'settings.prompt.saved': 'Prompt atualizado.',
  },
  en: {
    'nav.translate': 'Translate',
    'nav.settings': 'Settings',

    'translate.eyebrow': 'AI · Neural Translation',
    'translate.title': 'Subtitle Translation',
    'translate.subtitle': 'Upload an .srt file and get it translated into the language you need.',
    'translate.file': '.srt file',
    'translate.targetLanguage': 'Target language',
    'translate.button': 'Translate',
    'translate.buttonLoading': 'Translating...',
    'translate.cancel': 'Cancel translation',
    'translate.cancelled': 'Translation cancelled.',
    'translate.hint.batch': 'Batch {current} of {total} — {percent}%',
    'translate.hint.preparing': 'Preparing translation...',
    'translate.download': 'Download {name}',
    'translate.error.selectFile': 'Select an .srt file.',
    'translate.error.onlySrt': 'Only .srt files are accepted.',
    'translate.error.generic': 'Failed to translate the subtitle.',
    'translate.error.connectionLost': 'Connection lost during translation.',

    'settings.eyebrow': 'Settings',
    'settings.title': 'AI Provider',
    'settings.subtitle': 'Choose the provider and model used to translate subtitles.',
    'settings.provider': 'Provider',
    'settings.model': 'Model',
    'settings.apiKey': 'API key',
    'settings.apiKey.configured': 'configured: {value}',
    'settings.apiKey.missing': 'not configured',
    'settings.apiKey.placeholder': 'Paste a new key to replace it',
    'settings.save': 'Save settings',
    'settings.saving': 'Saving...',
    'settings.saved': 'Settings saved.',
    'settings.version': 'Version',
    'settings.docs': '📖 Documentation',
    'settings.author': 'Developed by',
    'settings.prompt.title': 'Translation prompt',
    'settings.prompt.subtitle':
      'Text sent to the AI for every batch of subtitles. Use {targetLanguage} and {items} as placeholders.',
    'settings.prompt.default': 'using the .env default',
    'settings.prompt.custom': 'customized',
    'settings.prompt.save': 'Save prompt',
    'settings.prompt.reset': 'Reset to default',
    'settings.prompt.saved': 'Prompt updated.',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  lang = signal<AppLang>(this.loadInitialLang());

  setLang(lang: AppLang): void {
    this.lang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const dict = DICTIONARY[this.lang()];
    let text = dict[key] ?? key;

    if (params) {
      for (const [param, value] of Object.entries(params)) {
        text = text.replace(`{${param}}`, String(value));
      }
    }

    return text;
  }

  private loadInitialLang(): AppLang {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'pt';
  }
}
