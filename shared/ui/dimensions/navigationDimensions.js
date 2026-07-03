const DIMENSION_CONTEXTS = {
  MAIN: { level: 'MODULE', code: 'ANTOJADOSMX', label: 'AntojadosMX' },
  ANTOJO: { level: 'MODULE', code: 'ANTOJADOSMX.ANTOJO', label: 'Antojo' },
  RED: { level: 'MODULE', code: 'ANTOJADOS', label: 'Antojados' },
  PARA_TI: { level: 'AREA', code: 'ANTOJADOS.PARA_TI', label: 'Para Ti' },
  COMUNIDAD: { level: 'AREA', code: 'ANTOJADOS.COMUNIDAD', label: 'Comunidad' },
  VAS_IR: { level: 'AREA', code: 'ANTOJO.VAS_IR', label: 'Vas Ir' },
  ARRE: { level: 'AREA', code: 'ANTOJO.ARRE', label: 'Arre' },
  MI_CHAMBA: { level: 'COMPONENT', code: 'ANTOJO.MI_CHAMBA', label: 'Mi Chamba' },
  YO: { level: 'MODULE', code: 'TRAGON', label: 'Tragon' },
}

const MAIN_TABS = [
  {
    name: 'antojo',
    to: '/antojo/vas-ir/gallery',
    label: 'Antojo',
    icon: 'storefront',
    ik: 'ANTOJO',
    pc: 'ANTOJADOSMX',
    dim_code: 'ANTOJADOSMX.ANTOJO',
    subdimType: 'MODULE',
    codeComponent: 'MAIN.ANTOJO.TAB',
  },
  {
    name: 'red',
    to: '/red/barrio',
    label: 'Antojados',
    icon: 'groups',
    ik: 'ANTOJADOS',
    pc: 'ANTOJADOSMX',
    dim_code: 'ANTOJADOSMX.ANTOJADOS',
    subdimType: 'MODULE',
    codeComponent: 'MAIN.RED.TAB',
  },
  {
    name: 'yo',
    to: '/yo',
    label: 'Tragon',
    icon: 'person',
    ik: 'TRAGON',
    pc: 'ANTOJADOSMX',
    dim_code: 'ANTOJADOSMX.TRAGON',
    subdimType: 'MODULE',
    codeComponent: 'MAIN.YO.TAB',
  },
]

const ANTOJO_TABS = [
  {
    name: 'vas-ir',
    to: '/antojo/vas-ir/gallery',
    label: 'Vas Ir',
    ik: 'VAS_IR',
    pc: 'ANTOJADOSMX.ANTOJO',
    dim_code: 'ANTOJO.VAS_IR',
    subdimType: 'AREA',
    codeComponent: 'ANTOJO.VAS_IR.TAB',
  },
  {
    name: 'arre',
    to: '/antojo/arre/agenda',
    label: 'Arre',
    ik: 'ARRE',
    pc: 'ANTOJADOSMX.ANTOJO',
    dim_code: 'ANTOJO.ARRE',
    subdimType: 'AREA',
    codeComponent: 'ANTOJO.ARRE.TAB',
  },
  {
    name: 'los-chidos',
    to: '/antojo/los-chidos',
    label: 'Los Chidos',
    ik: 'LOS_CHIDOS',
    pc: 'ANTOJADOSMX.ANTOJO',
    dim_code: 'ANTOJO.LOS_CHIDOS',
    subdimType: 'AREA',
    codeComponent: 'ANTOJO.LOS_CHIDOS.TAB',
  },
  {
    name: 'no-vas-ir',
    to: '/antojo/no-vas-ir',
    label: 'No Vas Ir',
    ik: 'NO_VAS_IR',
    pc: 'ANTOJADOSMX.ANTOJO',
    dim_code: 'ANTOJO.NO_VAS_IR',
    subdimType: 'AREA',
    codeComponent: 'ANTOJO.NO_VAS_IR.TAB',
  },
  {
    name: 'mi-chamba',
    to: '/antojo/mi-chamba',
    label: 'Mi Chamba',
    ik: 'MI_CHAMBA',
    pc: 'ANTOJADOSMX.ANTOJO',
    dim_code: 'ANTOJO.MI_CHAMBA',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'ANTOJO.MI_CHAMBA.TAB',
  },
]

const RED_TABS = [
  {
    name: 'barrio',
    to: '/red/barrio',
    label: 'Barrio',
    ik: 'BARRIO',
    pc: 'ANTOJADOS',
    dim_code: 'ANTOJADOS.BARRIO',
    subdimType: 'AREA',
    codeComponent: 'ANTOJADOS.BARRIO.TAB',
  },
  {
    name: 'pa-ti',
    to: '/red/pa-ti/pachanga',
    label: 'Para Ti',
    ik: 'PARA_TI',
    pc: 'ANTOJADOS',
    dim_code: 'ANTOJADOS.PARA_TI',
    subdimType: 'AREA',
    codeComponent: 'ANTOJADOS.PARA_TI.TAB',
  },
  {
    name: 'en-el-desma',
    to: '/red/en-el-desma',
    label: 'En el Desma',
    ik: 'EN_EL_DESMA',
    pc: 'ANTOJADOS',
    dim_code: 'ANTOJADOS.EN_EL_DESMA',
    subdimType: 'AREA',
    codeComponent: 'ANTOJADOS.EN_EL_DESMA.TAB',
  },
  {
    name: 'la-banda',
    to: '/red/la-banda/acarreados',
    label: 'Acarreados',
    ik: 'COMUNIDAD',
    pc: 'ANTOJADOS',
    dim_code: 'ANTOJADOS.COMUNIDAD',
    subdimType: 'AREA',
    codeComponent: 'ANTOJADOS.COMUNIDAD.TAB',
  },
  {
    name: 'mi-rollo',
    to: '/red/mi-rollo',
    label: 'Mi Rollo',
    ik: 'MI_ROLLO',
    pc: 'ANTOJADOS',
    dim_code: 'ANTOJADOS.MI_ROLLO',
    subdimType: 'AREA',
    codeComponent: 'ANTOJADOS.MI_ROLLO.TAB',
  },
]

const PA_TI_TABS = [
  {
    name: 'pachanga',
    label: 'Pachanga',
    ik: 'PACHANGA',
    pc: 'ANTOJADOS.PARA_TI',
    dim_code: 'ANTOJADOS.PARA_TI.PACHANGA',
    subdimType: 'COMPONENT',
    codeComponent: 'PARA_TI.PACHANGA.TAB',
    to: '/red/pa-ti/pachanga',
  },
  {
    name: 'que-pex',
    label: 'Qué Pex',
    ik: 'QUE_PEX',
    pc: 'ANTOJADOS.PARA_TI',
    dim_code: 'ANTOJADOS.PARA_TI.QUE_PEX',
    subdimType: 'COMPONENT',
    codeComponent: 'PARA_TI.QUE_PEX.TAB',
    to: '/red/pa-ti/que-pex',
  },
]

const LA_BANDA_TABS = [
  {
    name: 'acarreados',
    to: '/red/la-banda/acarreados',
    label: 'Acarreados',
    ik: 'ACARREADOS',
    pc: 'ANTOJADOS.COMUNIDAD',
    dim_code: 'ANTOJADOS.COMUNIDAD.ACARREADOS',
    subdimType: 'COMPONENT',
    codeComponent: 'COMUNIDAD.ACARREADOS.TAB',
  },
]

const MI_CHAMBA_TABS = [
  {
    name: 'registro',
    label: 'Registro',
    ik: 'REGISTRO',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.REGISTRO',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.REGISTRO.TAB',
    route: '/antojo/mi-chamba/registro',
  },
  {
    name: 'e-firma',
    label: 'E firma',
    ik: 'E_FIRMA',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.E_FIRMA',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.E_FIRMA.TAB',
    route: '/antojo/mi-chamba/e-firma',
  },
  {
    name: 'contrato',
    label: 'Contrato',
    ik: 'CONTRATO',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.CONTRATO',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.CONTRATO.TAB',
    route: '/antojo/mi-chamba/contrato',
  },
  {
    name: 'atencion',
    label: 'Atencion',
    ik: 'ATENCION',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.ATENCION',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.ATENCION.TAB',
    route: '/antojo/mi-chamba/atencion',
  },
  {
    name: 'cuenta',
    label: 'Cuenta',
    ik: 'CUENTA_PAGOS',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.CUENTA_PAGOS',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.CUENTA_PAGOS.TAB',
    route: '/antojo/mi-chamba/cuenta',
  },
  {
    name: 'modulos',
    label: 'Modulos',
    ik: 'MODULOS',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.MODULOS',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.MODULOS.TAB',
    route: '/antojo/mi-chamba/modulos',
  },
  {
    name: 'tiles',
    label: 'Tiles',
    ik: 'TILES',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.TILES',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.TILES.TAB',
    route: '/antojo/mi-chamba/tiles',
  },
  {
    name: 'metricas',
    label: 'Metricas',
    ik: 'METRICAS',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.METRICAS',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.METRICAS.TAB',
    route: '/antojo/mi-chamba/metricas',
  },
  {
    name: 'equipo',
    label: 'Equipo',
    ik: 'EQUIPO',
    pc: 'ANTOJO.MI_CHAMBA',
    dim_code: 'ANTOJO.MI_CHAMBA.EQUIPO',
    subdimType: 'COMPONENT',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'MI_CHAMBA.EQUIPO.TAB',
    route: '/antojo/mi-chamba/equipo',
  },
]

const TRAGON_TABS = [
  {
    name: 'bandeja',
    label: 'Bandeja',
    ik: 'BANDEJA',
    pc: 'TRAGON',
    dim_code: 'TRAGON.BANDEJA',
    subdimType: 'AREA',
    codeComponent: 'TRAGON.BANDEJA.TAB',
  },
  {
    name: 'perfil',
    label: 'Perfil',
    ik: 'PERFIL',
    pc: 'TRAGON',
    dim_code: 'TRAGON.PERFIL',
    subdimType: 'AREA',
    codeComponent: 'TRAGON.PERFIL.TAB',
  },
]

const GRANULAR_BUTTONS = [
  {
    name: 'vas-ir-publicar-fab',
    label: 'Publicar',
    ik: 'BTN_PUBLICAR',
    pc: 'ANTOJO.VAS_IR.BIZ_FEED',
    dim_code: 'ANTOJO.VAS_IR.BIZ_FEED.BTN_PUBLICAR',
    subdimType: 'BUTTON',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'ANTOJO.VAS_IR.BIZ_FEED.FAB_PUBLICAR',
  },
  {
    name: 'arre-publicar-fab',
    label: 'Publicar',
    ik: 'BTN_PUBLICAR',
    pc: 'ANTOJO.ARRE.ARRE_FEED',
    dim_code: 'ANTOJO.ARRE.ARRE_FEED.BTN_PUBLICAR',
    subdimType: 'BUTTON',
    subdimAppliesTo: 'sponsor',
    codeComponent: 'ANTOJO.ARRE.ARRE_FEED.FAB_PUBLICAR',
  },
]

function findTabByName(tabs, name) {
  return tabs.find((item) => item.name === name) || null
}

function resolveAntojoTab(path) {
  if (path.includes('/arre')) return 'arre'
  if (path.includes('/los-chidos')) return 'los-chidos'
  if (path.includes('/no-vas-ir')) return 'no-vas-ir'
  if (path.includes('/mi-chamba')) return 'mi-chamba'
  return 'vas-ir'
}

function resolveRedTab(path) {
  if (path.includes('/pa-ti')) return 'pa-ti'
  if (path.includes('/en-el-desma')) return 'en-el-desma'
  if (path.includes('/la-banda')) return 'la-banda'
  if (path.includes('/mi-rollo')) return 'mi-rollo'
  return 'barrio'
}

function resolvePaTiTab(path) {
  if (path.includes('/que-pex') || path.includes('/la-neta')) return 'que-pex'
  return 'pachanga'
}

function resolveLaBandaTab(path) {
  if (path.includes('/acarreados')) return 'acarreados'
  return 'acarreados'
}

export {
  ANTOJO_TABS,
  DIMENSION_CONTEXTS,
  GRANULAR_BUTTONS,
  LA_BANDA_TABS,
  MAIN_TABS,
  MI_CHAMBA_TABS,
  PA_TI_TABS,
  RED_TABS,
  TRAGON_TABS,
  findTabByName,
  resolveAntojoTab,
  resolveLaBandaTab,
  resolvePaTiTab,
  resolveRedTab,
}

