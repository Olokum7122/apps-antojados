# Changelog — apps antojados

## v2.0.0

### Documentación

Se han agregado y actualizado los documentos:

| Documento | Cambio |
|---|---|
| `03b_FEED_SYSTEM.md` | Documentación del feed existente |
| `03f_EXPLORER_FEED_INTEGRATION.md` | **NUEVO**: Integración con Explorer Feed para consumo de publicaciones con composición JSON interactiva |

### Novedades — Explorer Feed Integration

**Contexto:** Las apps ya no consumen posts desde `soc_posts` para el contenido creado en Explorer. En su lugar, consumen directamente desde Explorer DB a través de un endpoint dedicado.

**Qué cambió para las apps:**
- Nuevo endpoint: `GET /api/v1/explorer/tenants/{tenantId}/feed/{feedType}`
- Cada item del feed incluye `composicion.blocks[]` con la información completa de diseño
- Se requiere implementar un visor interactivo que renderice los blocks y responda a gestos táctiles
- El comportamiento táctil es: tap en imagen → fullscreen, tap en otros elementos → zoom al frente

**Qué NO cambió:**
- El feed legacy de `soc_posts` sigue funcionando para contenido existente
- Los componentes actuales (QuePexView, PachangaView, etc.) no se modifican
- La integración es aditiva: el Explorer Feed es una fuente de datos adicional

### Pendiente para siguiente versión

- [ ] Implementar `ExplorerPostRenderer` en shared/ui (componente Vue para web)
- [ ] Implementar visor interactivo en Android (nativo)
- [ ] Implementar visor interactivo en iOS (nativo)
- [ ] Agregar cache de feed en las apps
- [ ] Migrar contenido existente de `soc_posts` a Explorer DB (opcional)