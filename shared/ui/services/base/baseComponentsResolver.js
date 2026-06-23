function cx(...values) {
  return values.filter(Boolean)
}

function resolvePanelClasses({ tone = 'default' } = {}) {
  return {
    root: cx('base-panel', tone === 'flat' ? 'base-panel--flat' : ''),
    title: 'base-panel__title',
    subtitle: 'base-panel__subtitle',
    content: 'base-panel__content',
    actions: 'base-panel__actions'
  }
}

function resolveEmptyStateClasses() {
  return {
    root: 'base-empty-state',
    message: 'base-empty-state__message'
  }
}

function resolveFeedPostCardClasses() {
  return {
    root: 'base-feed-card',
    debugChip: 'base-feed-card__debug-chip',
    debugScore: 'base-feed-card__debug-score',
    debugReason: 'base-feed-card__debug-reason',
    head: 'base-feed-card__head',
    avatar: 'base-feed-card__avatar',
    meta: 'base-feed-card__meta',
    author: 'base-feed-card__author',
    tags: 'base-feed-card__tags',
    tag: 'base-feed-card__tag',
    tagVenue: 'base-feed-card__tag--venue',
    tagDish: 'base-feed-card__tag--dish',
    tagMoment: 'base-feed-card__tag--moment',
    mediaWrap: 'base-feed-card__media-wrap',
    media: 'base-feed-card__media',
    body: 'base-feed-card__body',
    caption: 'base-feed-card__caption',
    verdicts: 'base-feed-card__verdicts',
    verdictRow: 'base-feed-card__verdict-row',
    verdictIcon: 'base-feed-card__verdict-icon',
    verdictText: 'base-feed-card__verdict-text',
    actions: 'base-feed-card__actions'
  }
}

function resolveFeedGalleryClasses({ variant = 'default', stage = 'S1' } = {}) {
  return {
    root: cx('base-feed-gallery', `base-feed-gallery--${variant}`, `base-feed-gallery--stage-${String(stage).toLowerCase()}`),
    header: 'base-feed-gallery__header',
    filters: 'base-feed-gallery__filters',
    loading: 'base-feed-gallery__loading',
    grid: 'base-feed-gallery__grid',
    cell: 'base-feed-gallery__cell',
    empty: 'base-feed-gallery__empty',
    emptyMessage: 'base-feed-gallery__empty-message'
  }
}

function resolveFeedPostClasses({ emphasis = 'default' } = {}) {
  return {
    root: cx('base-feed-post', emphasis === 'hero' ? 'base-feed-post--hero' : ''),
    media: 'base-feed-post__media',
    mediaOverlay: 'base-feed-post__media-overlay',
    body: 'base-feed-post__body',
    header: 'base-feed-post__header',
    title: 'base-feed-post__title',
    subtitle: 'base-feed-post__subtitle',
    content: 'base-feed-post__content',
    actions: 'base-feed-post__actions',
    comments: 'base-feed-post__comments',
    footer: 'base-feed-post__footer'
  }
}

function resolveFeedFullscreenClasses({ variant = 'default', stage = 'S3', presentation = 'dialog' } = {}) {
  return {
    root: cx(
      'base-feed-fullscreen',
      `base-feed-fullscreen--${variant}`,
      `base-feed-fullscreen--${presentation}`,
      `base-feed-fullscreen--stage-${String(stage).toLowerCase()}`,
    ),
    close: 'base-feed-fullscreen__close',
    media: 'base-feed-fullscreen__media',
    body: 'base-feed-fullscreen__body',
    actions: 'base-feed-fullscreen__actions',
    comments: 'base-feed-fullscreen__comments',
    footer: 'base-feed-fullscreen__footer'
  }
}

function resolveFeedFlowClasses({ variant = 'publish', stage = 'S3' } = {}) {
  return {
    root: cx('base-feed-flow', `base-feed-flow--${variant}`, `base-feed-flow--stage-${String(stage).toLowerCase()}`),
    stepper: 'base-feed-flow__stepper',
    step: 'base-feed-flow__step',
    stepActive: 'base-feed-flow__step--active',
    stepDone: 'base-feed-flow__step--done',
    content: 'base-feed-flow__content',
    actions: 'base-feed-flow__actions'
  }
}

function resolvePostActionRailClasses({ mode = 'brandGlow', density = 'normal' } = {}) {
  return {
    root: cx(
      'base-post-action-rail',
      mode === 'monoAccent' ? 'base-post-action-rail--mono' : '',
      density === 'compact' ? 'base-post-action-rail--compact' : '',
    ),
    track: 'base-post-action-rail__track',
    item: 'base-post-action-rail__item',
    iconBtn: 'base-post-action-rail__icon-btn',
    icon: 'base-post-action-rail__icon',
    label: 'base-post-action-rail__label',
    count: 'base-post-action-rail__count'
  }
}

function resolveEntityGridClasses() {
  return {
    root: 'base-entity-grid',
    header: 'base-entity-grid__header',
    body: 'base-entity-grid__body',
    row: 'base-entity-grid__row',
    rowSelected: 'base-entity-grid__row--selected',
    empty: 'base-entity-grid__empty',
    cell: 'base-entity-grid__cell'
  }
}

function resolveFieldEditorClasses() {
  return {
    root: 'base-field-editor',
    title: 'base-field-editor__title',
    fields: 'base-field-editor__fields',
    info: 'base-field-editor__info',
    actions: 'base-field-editor__actions'
  }
}

function resolveTopBarTabsClasses({ grid = false } = {}) {
  return {
    root: cx('topbar-tabs-base', grid ? 'topbar-tabs-base--grid' : ''),
    tab: 'topbar-tabs-base__tab'
  }
}

function resolveComponentTabsClasses({ grid = false } = {}) {
  return {
    root: cx('tabbar-component-base', grid ? 'tabbar-component-base--grid' : ''),
    tab: 'tabbar-component-base__tab'
  }
}

function resolveSubdimensionTabsClasses({ grid = false } = {}) {
  return {
    root: cx('tabbar-subdimension-base', grid ? 'tabbar-subdimension-base--grid' : ''),
    tab: 'tabbar-subdimension-base__tab'
  }
}

function resolveButtonBarClasses({ grid = false, scrollable = false } = {}) {
  return {
    root: 'buttonbar-base',
    actions: cx(
      'buttonbar-base__actions',
      grid ? 'buttonbar-base__actions--grid' : '',
      !grid && scrollable ? 'buttonbar-base__actions--scrollable' : '',
    ),
    action: 'buttonbar-base__action',
    actionActive: 'buttonbar-base__action--active'
  }
}

export function resolveBaseComponentClasses(componentName, options = {}) {
  switch (componentName) {
  case 'panel':
    return resolvePanelClasses(options)
  case 'emptyState':
    return resolveEmptyStateClasses(options)
  case 'feedPostCard':
    return resolveFeedPostCardClasses(options)
  case 'feedGallery':
    return resolveFeedGalleryClasses(options)
  case 'feedPost':
    return resolveFeedPostClasses(options)
  case 'feedFullscreen':
    return resolveFeedFullscreenClasses(options)
  case 'feedFlow':
    return resolveFeedFlowClasses(options)
  case 'postActionRail':
    return resolvePostActionRailClasses(options)
  case 'entityGrid':
    return resolveEntityGridClasses(options)
  case 'fieldEditor':
    return resolveFieldEditorClasses(options)
  case 'topBarTabs':
    return resolveTopBarTabsClasses(options)
  case 'componentTabs':
    return resolveComponentTabsClasses(options)
  case 'subdimensionTabs':
    return resolveSubdimensionTabsClasses(options)
  case 'buttonBar':
    return resolveButtonBarClasses(options)
  default:
    throw new Error(`Componente base no soportado: ${componentName}`)
  }
}
