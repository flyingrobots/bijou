import {
  createI18nRuntime,
  FRAME_I18N_CATALOG,
  pushNotification,
  seedNotificationHistory,
  type Msg,
} from './app-frame.test-support.js';

export function createFrenchNotificationCenter() {
  const runtime = createI18nRuntime({ locale: 'fr', direction: 'ltr' });
  runtime.loadCatalog(FRAME_I18N_CATALOG);
  runtime.loadCatalog({
    namespace: 'bijou.shell',
    entries: [
      {
        key: { namespace: 'bijou.shell', id: 'key.group.frame' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: 'Frame', fr: 'Cadre' },
      },
      {
        key: { namespace: 'bijou.shell', id: 'key.toggleHelp' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: 'Toggle help', fr: 'Basculer l’aide' },
      },
      {
        key: { namespace: 'bijou.shell', id: 'help.group.general' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: 'General', fr: 'Général' },
      },
      {
        key: { namespace: 'bijou.shell', id: 'notifications.filter.all' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: 'All', fr: 'Toutes' },
      },
      {
        key: { namespace: 'bijou.shell', id: 'notifications.summary.liveArchived' },
        kind: 'message',
        sourceLocale: 'en',
        values: {
          en: 'Live: {liveCount} • Archived: {archivedCount}',
          fr: 'Actives : {liveCount} • Archivées : {archivedCount}',
        },
      },
      {
        key: { namespace: 'bijou.shell', id: 'notifications.summary.filter' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: 'Filter: {filter}', fr: 'Filtre : {filter}' },
      },
      {
        key: { namespace: 'bijou.shell', id: 'notifications.currentStack' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: 'Current stack', fr: 'Pile actuelle' },
      },
      {
        key: { namespace: 'bijou.shell', id: 'notifications.history.title' },
        kind: 'message',
        sourceLocale: 'en',
        values: {
          en: 'History • {filter} • {range}',
          fr: 'Historique • {filter} • {range}',
        },
      },
      {
        key: { namespace: 'bijou.shell', id: 'notifications.history.range.window' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: '{start}-{end} of {total}', fr: '{start}-{end} sur {total}' },
      },
      {
        key: { namespace: 'bijou.shell', id: 'notifications.history.action' },
        kind: 'message',
        sourceLocale: 'en',
        values: { en: 'Action: {label}', fr: 'Action : {label}' },
      },
    ],
  });

  let notifications = seedNotificationHistory<Msg>([{
    title: 'Deploy failed',
    message: 'The worker crashed.',
    variant: 'ACTIONABLE',
    tone: 'ERROR',
  }]);
  notifications = pushNotification(notifications, {
    title: 'Live issue',
    message: 'Needs review.',
    variant: 'ACTIONABLE',
    tone: 'WARNING',
    durationMs: null,
    action: {
      label: 'Retry',
      payload: { type: 'noop' },
    },
  }, 999);

  return {
    runtime,
    notificationCenter: () => ({ state: notifications }),
  };
}
