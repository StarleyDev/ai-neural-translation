import { Injectable, signal } from '@angular/core';

export type AppLang = 'pt' | 'en';

const STORAGE_KEY = 'ia-translate-lang';

const DICTIONARY: Record<AppLang, Record<string, string>> = {
  pt: {
    'nav.translate': 'Traduzir',
    'nav.settings': 'Configurações',
    'nav.account': 'Conta',
    'nav.logout': 'Sair',

    'login.title': 'Acesso restrito',
    'login.subtitle': 'Entre com seu usuário e senha para continuar.',
    'login.username': 'Usuário',
    'login.password': 'Senha',
    'login.submit': 'Entrar',
    'login.loading': 'Entrando...',
    'login.remember': 'Lembrar senha neste dispositivo',
    'login.error': 'Usuário ou senha inválidos.',

    'translate.eyebrow': 'AI · Neural Translation',
    'translate.title': 'Tradução de Legendas',
    'translate.subtitle': 'Envie um arquivo .srt e receba a tradução para o idioma desejado.',
    'translate.file': 'Arquivo .srt',
    'translate.targetLanguage': 'Idioma de destino',
    'translate.removeBrackets': 'Remover anotações [entre colchetes] (ex.: [música tensa])',
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
    'settings.model.customPlaceholder': 'Nome do modelo (ex.: llama3.1)',
    'settings.baseUrl': 'URL do servidor',
    'settings.baseUrl.placeholder': 'http://localhost:11434/v1',
    'settings.baseUrl.hint': 'Qualquer servidor compatível com a API de chat da OpenAI: Ollama, LM Studio, vLLM, LocalAI, etc.',
    'settings.apiKey': 'Chave de API',
    'settings.apiKey.configured': 'configurada: {value}',
    'settings.apiKey.missing': 'não configurada',
    'settings.apiKey.optional': 'opcional',
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

    'settings.batchSize.title': 'Tamanho do lote',
    'settings.batchSize.default': 'padrão para este provedor: {value}',
    'settings.batchSize.hint': 'Quantas legendas são enviadas de uma vez pra IA em cada requisição. Modelos locais/pequenos costumam precisar de lotes menores pra não cortar a resposta; provedores em nuvem aguentam lotes maiores.',
    'settings.batchSize.save': 'Salvar tamanho do lote',
    'settings.batchSize.reset': 'Restaurar padrão',
    'settings.batchSize.saved': 'Tamanho do lote atualizado.',

    'account.eyebrow': 'Conta',
    'account.title': 'Usuário e senha',
    'account.subtitle': 'Gerencie as credenciais usadas para acessar o painel.',
    'account.saving': 'Salvando...',
    'account.username.title': 'Alterar usuário',
    'account.username.subtitle': 'Usuário atual: {value}',
    'account.username.new': 'Novo usuário',
    'account.username.password': 'Senha atual',
    'account.username.save': 'Alterar usuário',
    'account.username.saved': 'Usuário alterado com sucesso.',
    'account.password.title': 'Alterar senha',
    'account.password.subtitle': 'Atualize a senha usada para acessar o painel.',
    'account.password.current': 'Senha atual',
    'account.password.new': 'Nova senha',
    'account.password.confirm': 'Confirmar nova senha',
    'account.password.save': 'Alterar senha',
    'account.password.saved': 'Senha alterada com sucesso.',
    'account.password.error.mismatch': 'A confirmação não confere com a nova senha.',
  },
  en: {
    'nav.translate': 'Translate',
    'nav.settings': 'Settings',
    'nav.account': 'Account',
    'nav.logout': 'Log out',

    'login.title': 'Restricted access',
    'login.subtitle': 'Sign in with your username and password to continue.',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.loading': 'Signing in...',
    'login.remember': 'Remember password on this device',
    'login.error': 'Invalid username or password.',

    'translate.eyebrow': 'AI · Neural Translation',
    'translate.title': 'Subtitle Translation',
    'translate.subtitle': 'Upload an .srt file and get it translated into the language you need.',
    'translate.file': '.srt file',
    'translate.targetLanguage': 'Target language',
    'translate.removeBrackets': 'Remove [bracketed] annotations (e.g.: [tense music])',
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
    'settings.model.customPlaceholder': 'Model name (e.g.: llama3.1)',
    'settings.baseUrl': 'Server URL',
    'settings.baseUrl.placeholder': 'http://localhost:11434/v1',
    'settings.baseUrl.hint': 'Any server compatible with the OpenAI chat API: Ollama, LM Studio, vLLM, LocalAI, etc.',
    'settings.apiKey': 'API key',
    'settings.apiKey.configured': 'configured: {value}',
    'settings.apiKey.missing': 'not configured',
    'settings.apiKey.optional': 'optional',
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

    'settings.batchSize.title': 'Batch size',
    'settings.batchSize.default': 'default for this provider: {value}',
    'settings.batchSize.hint': 'How many subtitles are sent to the AI at once per request. Local/small models usually need smaller batches to avoid a cut-off response; cloud providers handle larger batches fine.',
    'settings.batchSize.save': 'Save batch size',
    'settings.batchSize.reset': 'Reset to default',
    'settings.batchSize.saved': 'Batch size updated.',

    'account.eyebrow': 'Account',
    'account.title': 'Username and password',
    'account.subtitle': 'Manage the credentials used to access the panel.',
    'account.saving': 'Saving...',
    'account.username.title': 'Change username',
    'account.username.subtitle': 'Current username: {value}',
    'account.username.new': 'New username',
    'account.username.password': 'Current password',
    'account.username.save': 'Change username',
    'account.username.saved': 'Username changed successfully.',
    'account.password.title': 'Change password',
    'account.password.subtitle': 'Update the password used to access the panel.',
    'account.password.current': 'Current password',
    'account.password.new': 'New password',
    'account.password.confirm': 'Confirm new password',
    'account.password.save': 'Change password',
    'account.password.saved': 'Password changed successfully.',
    'account.password.error.mismatch': 'Confirmation does not match the new password.',
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
