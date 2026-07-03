## Android Version Reference

Referencia para unificar datos de identificacion y version entre Android old, Android New e iOS.

## Android Old Produccion

- Proyecto: `AntojadosMxQuasar`
- Capacitor config: `AntojadosMxQuasar/src-capacitor/capacitor.config.json`
- Gradle app: `AntojadosMxQuasar/src-capacitor/android/app/build.gradle`
- `appId`: `com.atlx.antojadosmx`
- `appName`: `AntojadosMx Social`
- `namespace`: `com.atlx.antojadosmx`
- `applicationId`: `com.atlx.antojadosmx`
- `versionCode`: `6`
- `versionName`: `1.2.0.4`

## Android New V2

- Proyecto: `Apps_antojados/apps/android-new`
- Capacitor config: `Apps_antojados/apps/android-new/src-capacitor/capacitor.config.json`
- Gradle app: `Apps_antojados/apps/android-new/src-capacitor/android/app/build.gradle`
- `appId`: `com.atlx.antojadosmx`
- `appName`: `AntojadosMx Social`
- `namespace`: `com.atlx.antojadosmx`
- `applicationId`: `com.atlx.antojadosmx`
- `versionCode`: `8` ← incrementado desde 7
- `versionName`: `2.0.1`

## iOS

- Proyecto: `Apps_antojados/apps/app-ios`
- Capacitor config: `Apps_antojados/apps/app-ios/src-capacitor/capacitor.config.json`
- Xcode project: `Apps_antojados/apps/app-ios/src-capacitor/ios/App/App.xcodeproj`
- `appId`: `com.atlx.antojadosmx`
- `appName`: `AntojadosMx Social`
- `Bundle Identifier`: `com.atlx.antojadosmx`
- `MARKETING_VERSION`: `2.0.1`
- `CURRENT_PROJECT_VERSION`: `2`
## Criterio Para Play Store

- Android New debe conservar `com.atlx.antojadosmx` para actualizar la app existente.
- `versionCode` debe ser mayor que Android old; por eso V2 usa `7`.
- La firma release/upload key debe ser la misma que Android old.
- No subir `.env`, keystores, APK ni AAB al repo.

## Dato Para iOS

Para mantener consistencia comercial con Android New V2:

- Nombre visible recomendado: `AntojadosMx Social`
- Version visible recomendada: `2.0.0`
- Build interno iOS recomendado: equivalente mayor al build publicado actual en App Store/TestFlight.

