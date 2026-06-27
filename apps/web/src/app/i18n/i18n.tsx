import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Supported UI languages. German is the default. */
export type Lang = 'de' | 'en';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
];

const STORAGE_KEY = 'feldpro.lang';
const DEFAULT_LANG: Lang = 'de';

/**
 * Flat dotted-key dictionaries. German is the source of truth (default); English
 * mirrors it. Missing keys fall back to the key itself so nothing renders blank.
 */
const dict: Record<Lang, Record<string, string>> = {
  de: {
    'common.save': 'Speichern',
    'common.saving': 'Speichern…',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.back': 'Zurück',
    'common.name': 'Name',
    'common.email': 'E-Mail',
    'common.role': 'Rolle',
    'common.loading': 'Lädt…',
    'role.ADMIN': 'Administrator',
    'role.EMPLOYEE': 'Mitarbeiter',

    'nav.catalogue': 'Katalog',
    'nav.offers': 'Angebote',
    'nav.assistant': 'Assistent',
    'nav.invoices': 'Rechnungen',
    'nav.account': 'Konto',

    'login.eyebrow': 'Werkzeug für Angebote vor Ort',
    'login.headline': 'Kalkuliere den Auftrag, bevor du die Baustelle verlässt.',
    'login.subtitle':
      'Erstelle Angebote und Rechnungen aus einem kalkulierten Gewerke-Katalog – oder beschreibe die Arbeit und lass den Assistenten entwerfen.',
    'login.feature1': '2.869 Katalogpositionen, kalkuliert',
    'login.feature2': 'Angebote → Rechnungen mit einem Tipp',
    'login.feature3': 'Sprich oder tippe für ein Angebot',
    'login.passwordLabel': 'Passwort',
    'login.signIn': 'Anmelden',
    'login.signingIn': 'Anmeldung…',
    'login.supabaseNote': 'Angemeldet über Supabase.',

    'account.eyebrow': 'Angemeldet',
    'account.title': 'Konto',
    'account.userId': 'Benutzer-ID',
    'account.organisation': 'Organisation',
    'account.language': 'Sprache',
    'account.team': 'Team verwalten',
    'account.signOut': 'Abmelden',

    'team.eyebrow': 'Organisation',
    'team.title': 'Team',
    'team.subtitle': 'Mitarbeiter und Administratoren verwalten',
    'team.add': 'Mitglied',
    'team.empty': 'Noch keine Teammitglieder',
    'team.emptyHint': 'Füge dein erstes Teammitglied hinzu.',
    'team.new': 'Neues Mitglied',
    'team.edit': 'Mitglied bearbeiten',
    'team.you': 'Du',
    'team.adminOnly': 'Nur Administratoren können das Team verwalten.',

    'common.new': 'Neu',
    'cat.eyebrow': 'Kalkulierter Katalog',
    'cat.title': 'Katalog',
    'offers.eyebrow': 'Kundenangebote',
    'offers.title': 'Angebote',
    'invoices.eyebrow': 'Abrechnung',
    'invoices.title': 'Rechnungen',
    'assistant.eyebrow': 'KI-Assistent',
    'assistant.title': 'Assistent',

    'common.edit': 'Bearbeiten',
    'common.creating': 'Erstellen…',
    'common.working': 'Arbeitet…',
    'common.unit': 'Einheit',
    'common.items': '{n} Positionen',

    'status.DRAFT': 'Entwurf',
    'status.SENT': 'Gesendet',
    'status.ACCEPTED': 'Angenommen',
    'status.REJECTED': 'Abgelehnt',
    'status.PAID': 'Bezahlt',
    'status.CANCELLED': 'Storniert',

    'doc.billTo': 'Rechnung an',
    'doc.notes': 'Notizen',
    'doc.subtotal': 'Zwischensumme',
    'doc.vat': 'MwSt.',
    'doc.total': 'Gesamt',

    'cat.subtitle': '2.869 Positionen · kalkuliert',
    'cat.searchAll': 'Alle Positionen durchsuchen…',
    'cat.categoriesBack': 'Kategorien',
    'cat.resultsFor': 'Ergebnisse für „{q}“',
    'cat.itemsGroups': '{items} Positionen · {groups} Gruppen',
    'cat.addItem': 'Position',
    'cat.newItem': 'Neue Position',
    'cat.editItem': 'Position bearbeiten',
    'cat.description': 'Beschreibung',
    'cat.price': 'Preis (€)',
    'cat.saveItem': 'Position speichern',
    'cat.deleteItem': 'Position löschen',
    'cat.noItems': 'Keine Positionen gefunden',
    'cat.tryAnother': 'Versuche einen anderen Suchbegriff.',
    'cat.itemMeta': 'pro {unit}',

    'offers.empty': 'Noch keine Angebote',
    'offers.emptyHint': 'Erstelle manuell eines oder lass den Assistenten entwerfen.',
    'offers.untitled': 'Angebot ohne Titel',
    'offers.new': 'Neues Angebot',
    'offers.create': 'Angebot erstellen',
    'offers.edit': 'Angebot bearbeiten',
    'offers.save': 'Änderungen speichern',
    'offers.generateInvoice': 'Rechnung erstellen',
    'offers.delete': 'Angebot löschen',
    'offers.notFound': 'Angebot nicht gefunden',
    'offers.confirmDelete': 'Dieses Angebot löschen?',
    'offers.fallback': 'Angebot',

    'invoices.empty': 'Noch keine Rechnungen',
    'invoices.emptyHint':
      'Erstelle eine, oder öffne ein angenommenes Angebot und tippe „Rechnung erstellen“.',
    'invoices.new': 'Neue Rechnung',
    'invoices.create': 'Rechnung erstellen',
    'invoices.delete': 'Rechnung löschen',
    'invoices.notFound': 'Rechnung nicht gefunden',
    'invoices.confirmDelete': 'Diese Rechnung löschen?',
    'invoices.fallback': 'Rechnung',
    'invoices.issued': 'Ausgestellt',
    'invoices.due': 'Fällig',
    'invoices.paid': 'Bezahlt',
    'invoices.issuedShort': 'ausgestellt {date}',
    'invoices.viewSource': 'Quellangebot ansehen',
    'invoices.dueDate': 'Fälligkeitsdatum',

    'form.title': 'Titel',
    'form.titlePlaceholder': 'z. B. Badsanierung',
    'form.customer': 'Kunde',
    'form.customerEmail': 'Kunden-E-Mail',
    'form.vat': 'MwSt. %',
    'form.lineItems': 'Positionen',

    'line.empty': 'Noch keine Positionen. Füge unten aus dem Katalog hinzu.',
    'line.add': 'Katalogposition hinzufügen',
    'line.subtotal': 'Zwischensumme',
    'line.removeLine': 'Position entfernen',
    'line.qty': '× Menge',
    'line.quantity': 'Menge',
    'line.addItem': 'Position hinzufügen',
    'line.searchCatalogue': 'Katalog durchsuchen…',
    'line.noMatch': 'Keine Positionen passen zu „{q}“.',
    'line.perUnit': 'pro {unit}',
    'line.unitFallback': 'Einheit',

    'assistant.coreFeature': 'Kernfunktion',
    'assistant.describeJob': 'Beschreibe den Auftrag.',
    'assistant.describeHint':
      'Nenne mir die Arbeit und die Mengen – ich ordne Katalogpositionen zu und entwerfe ein kalkuliertes Angebot.',
    'assistant.suggestion1': 'Angebot für 100m² Hausabbruch',
    'assistant.suggestion2': '50 m² Putz und 20 m² Fliesen',
    'assistant.suggestion3': '8 Stunden Aushub und Entsorgung',
    'assistant.drafting': 'Entwirft…',
    'assistant.saveAsOffer': 'Als Angebot speichern',
    'assistant.saving': 'Speichern…',
    'assistant.noMatch': 'keine Zuordnung',
    'assistant.subtotal': 'Zwischensumme',
    'assistant.vat': 'MwSt.',
    'assistant.total': 'Gesamt',
    'assistant.voiceInput': 'Spracheingabe',
    'assistant.insertExample': 'Beispiel einfügen',
    'assistant.voiceUnsupported':
      'Sprache nicht unterstützt – fügt ein Beispiel ein',
    'assistant.listening': 'Hört zu…',
    'assistant.placeholder': 'Beschreibe die Arbeit…',
    'assistant.send': 'Senden',
    'assistant.error': 'Etwas ist schiefgelaufen.',
  },
  en: {
    'common.save': 'Save',
    'common.saving': 'Saving…',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.back': 'Back',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.role': 'Role',
    'common.loading': 'Loading…',
    'role.ADMIN': 'Administrator',
    'role.EMPLOYEE': 'Employee',

    'nav.catalogue': 'Catalogue',
    'nav.offers': 'Offers',
    'nav.assistant': 'Assistant',
    'nav.invoices': 'Invoices',
    'nav.account': 'Account',

    'login.eyebrow': 'Field quoting tool',
    'login.headline': 'Quote the job before you leave the site.',
    'login.subtitle':
      'Build offers and invoices from a priced trade catalogue — or just describe the work and let the assistant draft it for you.',
    'login.feature1': '2,869 catalogue items, priced',
    'login.feature2': 'Offers → invoices in one tap',
    'login.feature3': 'Talk or type to draft a quote',
    'login.passwordLabel': 'Password',
    'login.signIn': 'Sign in',
    'login.signingIn': 'Signing in…',
    'login.supabaseNote': 'Signed in with Supabase.',

    'account.eyebrow': 'Signed in',
    'account.title': 'Account',
    'account.userId': 'User ID',
    'account.organisation': 'Organisation',
    'account.language': 'Language',
    'account.team': 'Manage team',
    'account.signOut': 'Sign out',

    'team.eyebrow': 'Organisation',
    'team.title': 'Team',
    'team.subtitle': 'Manage employees and administrators',
    'team.add': 'Member',
    'team.empty': 'No team members yet',
    'team.emptyHint': 'Add your first team member.',
    'team.new': 'New member',
    'team.edit': 'Edit member',
    'team.you': 'You',
    'team.adminOnly': 'Only administrators can manage the team.',

    'common.new': 'New',
    'cat.eyebrow': 'Priced catalogue',
    'cat.title': 'Catalogue',
    'offers.eyebrow': 'Customer proposals',
    'offers.title': 'Offers',
    'invoices.eyebrow': 'Billing',
    'invoices.title': 'Invoices',
    'assistant.eyebrow': 'AI assistant',
    'assistant.title': 'Assistant',

    'common.edit': 'Edit',
    'common.creating': 'Creating…',
    'common.working': 'Working…',
    'common.unit': 'Unit',
    'common.items': '{n} items',

    'status.DRAFT': 'Draft',
    'status.SENT': 'Sent',
    'status.ACCEPTED': 'Accepted',
    'status.REJECTED': 'Rejected',
    'status.PAID': 'Paid',
    'status.CANCELLED': 'Cancelled',

    'doc.billTo': 'Bill to',
    'doc.notes': 'Notes',
    'doc.subtotal': 'Subtotal',
    'doc.vat': 'VAT',
    'doc.total': 'Total',

    'cat.subtitle': '2,869 items · priced',
    'cat.searchAll': 'Search all items…',
    'cat.categoriesBack': 'Categories',
    'cat.resultsFor': 'Results for “{q}”',
    'cat.itemsGroups': '{items} items · {groups} groups',
    'cat.addItem': 'Item',
    'cat.newItem': 'New item',
    'cat.editItem': 'Edit item',
    'cat.description': 'Description',
    'cat.price': 'Price (€)',
    'cat.saveItem': 'Save item',
    'cat.deleteItem': 'Delete item',
    'cat.noItems': 'No items found',
    'cat.tryAnother': 'Try another search term.',
    'cat.itemMeta': 'per {unit}',

    'offers.empty': 'No offers yet',
    'offers.emptyHint': 'Create one manually, or let the assistant draft it.',
    'offers.untitled': 'Untitled offer',
    'offers.new': 'New offer',
    'offers.create': 'Create offer',
    'offers.edit': 'Edit offer',
    'offers.save': 'Save changes',
    'offers.generateInvoice': 'Generate invoice',
    'offers.delete': 'Delete offer',
    'offers.notFound': 'Offer not found',
    'offers.confirmDelete': 'Delete this offer?',
    'offers.fallback': 'Offer',

    'invoices.empty': 'No invoices yet',
    'invoices.emptyHint':
      'Create one, or open an accepted offer and tap “Generate invoice”.',
    'invoices.new': 'New invoice',
    'invoices.create': 'Create invoice',
    'invoices.delete': 'Delete invoice',
    'invoices.notFound': 'Invoice not found',
    'invoices.confirmDelete': 'Delete this invoice?',
    'invoices.fallback': 'Invoice',
    'invoices.issued': 'Issued',
    'invoices.due': 'Due',
    'invoices.paid': 'Paid',
    'invoices.issuedShort': 'issued {date}',
    'invoices.viewSource': 'View source offer',
    'invoices.dueDate': 'Due date',

    'form.title': 'Title',
    'form.titlePlaceholder': 'e.g. Bathroom renovation',
    'form.customer': 'Customer',
    'form.customerEmail': 'Customer email',
    'form.vat': 'VAT %',
    'form.lineItems': 'Line items',

    'line.empty': 'No line items yet. Add from the catalogue below.',
    'line.add': 'Add catalogue item',
    'line.subtotal': 'Subtotal',
    'line.removeLine': 'Remove line',
    'line.qty': '× qty',
    'line.quantity': 'Quantity',
    'line.addItem': 'Add item',
    'line.searchCatalogue': 'Search catalogue…',
    'line.noMatch': 'No items match “{q}”.',
    'line.perUnit': 'per {unit}',
    'line.unitFallback': 'unit',

    'assistant.coreFeature': 'Core feature',
    'assistant.describeJob': 'Describe the job.',
    'assistant.describeHint':
      'Tell me the work and the quantities — I’ll match catalogue items and draft a priced offer.',
    'assistant.suggestion1': 'Offer for 100m² house demolition',
    'assistant.suggestion2': '50 m² plaster and 20 m² tiling',
    'assistant.suggestion3': '8 hours excavation and disposal',
    'assistant.drafting': 'Drafting…',
    'assistant.saveAsOffer': 'Save as offer',
    'assistant.saving': 'Saving…',
    'assistant.noMatch': 'no match',
    'assistant.subtotal': 'Subtotal',
    'assistant.vat': 'VAT',
    'assistant.total': 'Total',
    'assistant.voiceInput': 'Voice input',
    'assistant.insertExample': 'Insert example',
    'assistant.voiceUnsupported': 'Voice not supported — inserts an example',
    'assistant.listening': 'Listening…',
    'assistant.placeholder': 'Describe the work…',
    'assistant.send': 'Send',
    'assistant.error': 'Something went wrong.',
  },
};

type Vars = Record<string, string | number>;

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

const readStored = (): Lang => {
  const v = (
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  ) as Lang | null;
  return v === 'de' || v === 'en' ? v : DEFAULT_LANG;
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage failures */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Vars): string => {
      const template = dict[lang][key] ?? dict[DEFAULT_LANG][key] ?? key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (_, k: string) =>
        k in vars ? String(vars[k]) : `{${k}}`,
      );
    },
    [lang],
  );

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}
