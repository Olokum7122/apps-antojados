import { httpClient } from '@antojados/http'
import { AuthService } from '@antojados/api/services/auth/auth.service'
import { BizFeedService } from '@antojados/api/services/feed/biz-feed.service'
import { EfirmaService } from '@antojados/api/services/efirma/efirma.service'
import { EquipoService } from '@antojados/api/services/equipo/equipo.service'
import { ExplorersService } from '@antojados/api/services/explorers/explorers.service'
import { GeoService } from '@antojados/api/services/geo/geo.service'
import { MiRolloService } from '@antojados/api/services/feed/mi-rollo.service'
import { ModulosService } from '@antojados/api/services/modulos/modulos.service'
import { PlacesService } from '@antojados/api/services/places/places.service'
import { RegistroService } from '@antojados/api/services/registro/registro.service'
import { SocialActionsService } from '@antojados/api/services/feed/social-actions.service'
import { SocialFeedService } from '@antojados/api/services/feed/social-feed.service'
import { SystemService } from '@antojados/api/services/system/system.service'
import { TenantsService } from '@antojados/api/services/tenants/tenants.service'
import { DocumentPackageService } from '@antojados/api/services/explorer/document-package.service'
import * as mediaService from '@antojados/api/services/media/media.service'
import * as publishService from '@antojados/api/services/publish/publish.service'
import * as rankingsService from '@antojados/api/services/rankings/rankings.service'
import * as rewardsService from '@antojados/api/services/rewards/rewards.service'
import * as sponsorsService from '@antojados/api/services/sponsors/sponsors.service'
import * as usersService from '@antojados/api/services/users/users.service'

const authService = new AuthService(httpClient)
const bizFeedService = new BizFeedService(httpClient)
const efirmaService = new EfirmaService(httpClient)
const equipoService = new EquipoService(httpClient)
const explorersService = new ExplorersService(httpClient)
const geoService = new GeoService(httpClient)
const miRolloService = new MiRolloService(httpClient)
const modulosService = new ModulosService(httpClient)
const placesService = new PlacesService(httpClient)
const registroService = new RegistroService(httpClient)
const socialActionsService = new SocialActionsService(httpClient)
const socialFeedService = new SocialFeedService(httpClient)
const systemService = new SystemService(httpClient)
const tenantsService = new TenantsService(httpClient)
const documentPackageService = new DocumentPackageService(httpClient)

export {
  authService,
  bizFeedService,
  documentPackageService,
  efirmaService,
  equipoService,
  explorersService,
  geoService,
  httpClient,
  mediaService,
  miRolloService,
  modulosService,
  placesService,
  publishService,
  rankingsService,
  registroService,
  rewardsService,
  socialActionsService,
  socialFeedService,
  sponsorsService,
  systemService,
  tenantsService,
  usersService,
}

export { AuthService } from '@antojados/api/services/auth/auth.service'
export { BizFeedService } from '@antojados/api/services/feed/biz-feed.service'
export { EfirmaService } from '@antojados/api/services/efirma/efirma.service'
export { EquipoService } from '@antojados/api/services/equipo/equipo.service'
export { ExplorersService } from '@antojados/api/services/explorers/explorers.service'
export { GeoService } from '@antojados/api/services/geo/geo.service'
export { MiRolloService } from '@antojados/api/services/feed/mi-rollo.service'
export { ModulosService } from '@antojados/api/services/modulos/modulos.service'
export { PlacesService } from '@antojados/api/services/places/places.service'
export { RegistroService } from '@antojados/api/services/registro/registro.service'
export { SocialActionsService } from '@antojados/api/services/feed/social-actions.service'
export { SocialFeedService } from '@antojados/api/services/feed/social-feed.service'
export { SystemService } from '@antojados/api/services/system/system.service'
export { TenantsService } from '@antojados/api/services/tenants/tenants.service'
export * from '@antojados/api/services/auth/auth.service'
export * from '@antojados/api/services/auth/auth-crypto'
export * from '@antojados/api/services/feed/biz-feed.service'
export * from '@antojados/api/services/feed/mi-rollo.service'
export * from '@antojados/api/services/feed/social-actions.service'
export * from '@antojados/api/services/feed/social-feed.service'
export * from '@antojados/api/services/efirma/efirma.service'
export * from '@antojados/api/services/equipo/equipo.service'
export * from '@antojados/api/services/explorers/explorers.service'
export * from '@antojados/api/services/geo/geo.service'
export * from '@antojados/api/services/modulos/modulos.service'
export * from '@antojados/api/services/modulos/modulos-transversal-bridge'
export * from '@antojados/api/services/places/places.service'
export * from '@antojados/api/services/registro/registro.service'
export * from '@antojados/api/services/system/system.service'
export * from '@antojados/api/services/tenants/tenants.service'
