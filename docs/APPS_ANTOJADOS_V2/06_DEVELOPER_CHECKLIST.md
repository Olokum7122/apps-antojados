# 06 — Developer Checklist

Version: 1.0.0
Status: baseline

## 1. Antes de Empezar

- [ ] Leer 01_ARCHITECTURE_SPEC.md — entender el ecosistema
- [ ] Leer 05_GUARDRAILS_FOR_CODEX.md — conocer las reglas
- [ ] Identificar que contrato aplica al cambio (02a-02g, 03a-03e)
- [ ] Verificar que el contrato exista (si no, crearlo primero)

## 2. Al Crear un Nuevo Servicio

- [ ] Definir tipos de input y output en shared/api/types/
- [ ] Crear el servicio en shared/api/services/{nombre}/
- [ ] Usar API_ENDPOINTS para las rutas (nunca strings hardcodeadas)
- [ ] Inyectar httpClient como dependencia
- [ ] Agregar mappers para transformar respuesta API a tipos de app
- [ ] Exportar desde services/index.ts
- [ ] Actualizar 02b_API_SERVICES_CONTRACT.md

## 3. Al Crear un Nuevo Componente

- [ ] Si es reutilizable: crearlo en shared/ui/base/
- [ ] Si es de una vista: crearlo en shared/ui/app/areas/{modulo}/{area}/
- [ ] Definir props y emits tipados con TypeScript
- [ ] No importar servicios API directamente
- [ ] No usar useRouter o useRoute (recibir rutas via props)
- [ ] Usar variables CSS (nunca colores hardcodeados)
- [ ] Usar scoped styles
- [ ] Si aplica: agregar codigo de dimension en navigationDimensions.js
- [ ] Actualizar 02c_COMPONENT_BASE_CONTRACT.md (si es base)

## 4. Al Modificar la Navegacion

- [ ] No modificar MAIN_TABS sin aprobacion
- [ ] Si es un tab secundario: agregar a la lista correspondiente
- [ ] Registrar el codigo de dimension
- [ ] Agregar la ruta en routes.js
- [ ] Actualizar 01_ARCHITECTURE_SPEC.md y 02d_DIMENSIONS_LOCATIONS_CONTRACT.md

## 5. Al Integrar Media

- [ ] No subir media directo a la API (siempre via Media Engine)
- [ ] No crear el post antes de que la media este lista
- [ ] No exponer errores internos del engine al usuario
- [ ] Verificar que el engine responde antes de crear el post
- [ ] Seguir el flujo: createMediaRequest → rightsOrigin → uploadOriginal → waitForReadyPayload → createPost

## 6. Al Tocar Autenticacion

- [ ] No almacenar tokens en localStorage
- [ ] No enviar contrasenas en texto plano
- [ ] Probar refresh token
- [ ] Probar cierre de sesion (limpia tokens, sesion y cache GT)
- [ ] Verificar que el contexto (sponsor vs user) se resuelve correctamente

## 7. Antes de Hacer un PR

- [ ] TypeScript compila sin errores
- [ ] Las rutas funcionan correctamente
- [ ] El feed carga en menos de 3 segundos
- [ ] Las imagenes cargan lazy
- [ ] Los estados de carga/error/vacio se muestran correctamente
- [ ] No hay console.logs de debug
- [ ] El codigo sigue los guardrails
- [ ] Los contratos afectados estan actualizados

## 8. Checklist de Release

- [ ] Version actualizada en package.json
- [ ] CHANGELOG.md actualizado
- [ ] Pruebas de humo en iOS y Android
- [ ] Media Engine funcionando (si aplica)
- [ ] .env configurado correctamente
- [ ] Build exitoso (npm run apps:build)

## 9. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Version inicial |
