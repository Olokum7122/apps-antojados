# Refactor y Auditoría del Ecosistema Antojados v2

## Contrato Maestro de Integración entre Dominios

## Objetivo

Establecer un contrato único de responsabilidades y productos entre
Antojados, Engine Media y Explorer antes del cierre técnico para App
Store.

------------------------------------------------------------------------

# Arquitectura

## Dominio 1 - Antojados

Responsabilidad:

-   Crear publicaciones.
-   Consumir productos de Engine.
-   Consumir productos de Explorer.
-   Organizar canales.
-   Publicar.
-   Renderizar Feed S1, S2 y Fullscreen.
-   Gestionar interacción social.

No procesa multimedia.

No genera modelos documentales.

No construye URLs.

------------------------------------------------------------------------

## Dominio 2 - Engine Media

Responsabilidad exclusiva:

-   Procesar foto y video.
-   Aplicar looks oficiales.
-   Normalizar multimedia.
-   Generar variantes.
-   Publicar productos multimedia.

Nunca conoce:

-   usuarios
-   sponsors
-   posts
-   feed
-   Explorer

## Productos Multimedia

Cada media debe producir un paquete identificable.

Campos mínimos:

-   media_id
-   version
-   status

Productos:

-   thumbnail
-   gallery_vertical
-   gallery_horizontal
-   hero
-   fullscreen
-   short_video
-   short_poster

Cada producto debe publicar:

-   product_code
-   media_type
-   orientation
-   width
-   height
-   mime_type
-   public_url HTTPS
-   version

Prohibido publicar:

-   localhost
-   IP
-   HTTP
-   raw
-   uploads legacy

------------------------------------------------------------------------

## Dominio 3 - Explorer

Responsabilidad exclusiva:

-   Editor avanzado.
-   Body editorial.
-   Plantillas oficiales.
-   Document JSON.
-   Estilos documentales.

## Productos Documentales

Explorer debe publicar únicamente productos documentales.

Inicialmente:

-   user_s1_post_doc
-   sponsor_s1_post_doc

Cada producto debe definir:

-   document_code
-   schema_version
-   body
-   metadata
-   body_style_code
-   media_look_code
-   campos editables

Explorer no gobierna Feed.

------------------------------------------------------------------------

# Ciclo Oficial S1

1.  Usuario captura o selecciona media.
2.  Antojados envía media a Engine.
3.  Engine devuelve Media Package.
4.  Antojados solicita plantilla S1 a Explorer.
5.  Usuario completa campos simples.
6.  Antojados liga:

-   Document Package
-   Media Package

7.  Publica.

------------------------------------------------------------------------

# Consumo

Feed S1

Render documental.

Feed S2

Render documental enriquecido.

Fullscreen

Hero + multimedia + galería secundaria.

Galería deja de ser renderer principal.

------------------------------------------------------------------------

# Contrato de Productos

Antojados no consume implementaciones.

Consume productos.

Media:

Media Package.

Documento:

Document Package.

Los contratos deben ser estables aunque cambie la implementación
interna.

------------------------------------------------------------------------

# API Pública

Único dominio permitido:

https://api.antojadosmx.mx

Gateway único.

Nunca exponer:

-   localhost
-   HTTP
-   IP
-   puertos internos

------------------------------------------------------------------------

# Auditoría

## Engine

-   Productos correctamente identificados.
-   Variantes completas.
-   HTTPS.
-   Sin formatos legacy.

## Explorer

-   Productos documentales identificados.
-   Plantillas S1.
-   Compatibilidad con Antojados.

## Antojados

-   Consume únicamente productos.
-   No construye URLs.
-   No procesa multimedia.
-   No redefine modelos.

------------------------------------------------------------------------

# Criterios de Cierre

-   Engine publica productos multimedia versionados.
-   Explorer publica productos documentales versionados.
-   Antojados consume únicamente contratos.
-   Web, Android e iOS renderizan igual.
-   Feed S1/S2 estable.
-   Fullscreen consume Hero + Galería.
-   Responsabilidades completamente separadas por dominio.
