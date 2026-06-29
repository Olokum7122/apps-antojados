# 10 — Build & Release

Version: 1.0.0
Status: baseline
Applies to: Android New, iOS, shared/

## 1. Proposito

Define el proceso de build y release para las apps AntojadosMX V2.
Cubre: web, APK, AAB (Google Play), IPA (App Store), Firebase App Distribution,
TestFlight y firmas.

## 2. Estructura del Proyecto

```
apps-antojados/
├── apps/
│   ├── android-new/          ← Android app (Capacitor + Quasar)
│   │   └── src-capacitor/
│   │       ├── android/
│   │       │   ├── app/
│   │       │   │   └── build.gradle    ← VersionCode, VersionName, signing
│   │       │   └── ...
│   │       └── capacitor.config.json   ← appId, appName
│   └── app-ios/              ← iOS app (Capacitor + Quasar)
│       └── src-capacitor/
│           ├── ios/
│           └── capacitor.config.json
├── shared/
│   └── ...
└── package.json               ← Workspace root
```

## 3. Variables de Entorno

```env
# API
VITE_API_URL=http://185.187.235.253:8010
VITE_APP_ENV=development
VITE_APP_VERSION=0.0.1
VITE_API_TIMEOUT=30000
VITE_AUTH_REFRESH_PATH=

# Media Engine
VITE_MEDIA_ENGINE_URL=http://localhost:4100

# Build
ANDROID_KEYSTORE_PATH=          # Ruta al keystore (no subir al repo)
ANDROID_KEYSTORE_PASSWORD=      # Password del keystore
ANDROID_KEY_ALIAS=              # Alias de la key
ANDROID_KEY_PASSWORD=           # Password de la key
```

## 4. Build Web

Para pruebas rapidas en navegador:

```bash
# Desarrollo
cd apps/android-new
quasar dev

# Produccion
quasar build
```

El build web se genera en `apps/android-new/dist/spa/`.
No se sube a produccion (solo para pruebas locales).

## 5. Build Android

### 5.1 Pre-requisitos

- Android Studio (ultima version estable)
- SDK 34+
- Build Tools 34+
- JDK 17
- Keystore de release (firmado)
- Gradle 8.x

### 5.2 Configuracion de Version

Archivo: `apps/android-new/src-capacitor/android/app/build.gradle`

```groovy
android {
    defaultConfig {
        applicationId "com.atlx.antojadosmx"
        minSdk 24
        targetSdk 34
        versionCode 8               // Incrementar en cada release
        versionName "2.0.1"         // Version semantica (sincronizada con iOS)
    }
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "antojados-release.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
}
```

**Regla de versionCode:**
- Android New V2 debe ser MAYOR que Android Old (versionCode 6)
- Version actual: `versionCode 8`, `versionName 2.0.1`
- Para nuevo release: incrementar versionCode en 1
- iOS `CURRENT_PROJECT_VERSION` debe coincidir con `versionCode` de Android

### 5.3 APK de Debug (pruebas locales)

```bash
cd apps/android-new/src-capacitor/android
./gradlew assembleDebug
```

El APK se genera en:
`apps/android-new/src-capacitor/android/app/build/outputs/apk/debug/`

### 5.4 APK de Release (Firebase Distribution)

```bash
cd apps/android-new
npx cap sync android
cd src-capacitor/android
./gradlew assembleRelease
```

El APK se genera en:
`apps/android-new/src-capacitor/android/app/build/outputs/apk/release/`

### 5.5 AAB (Google Play Store)

```bash
cd apps/android-new/src-capacitor/android
./gradlew bundleRelease
```

El AAB se genera en:
`apps/android-new/src-capacitor/android/app/build/outputs/bundle/release/`

### 5.6 Flujo Completo Android

```bash
# 1. Sincronizar web con Capacitor
cd apps/android-new
npx cap sync android

# 2. Incrementar versionCode en build.gradle

# 3. Build AAB
cd src-capacitor/android
./gradlew bundleRelease

# 4. El AAB se firma automaticamente con el keystore configurado

# 5. Subir a Google Play Console
#    - Ir a "Produccion" o "Pruebas cerradas"
#    - Subir el AAB
#    - Completar el formulario de revision
```

## 6. Build iOS

### 6.1 Pre-requisitos

- Xcode 15+
- macOS 14+
- Apple Developer account (paga)
- Certificados de distribucion
- Provisioning profile
- CocoaPods (gem install cocoapods)

### 6.2 Configuracion de Version

En Xcode (project.pbxproj):
- `MARKETING_VERSION` = `2.0.1` (version visible, sincronizada con Android)
- `CURRENT_PROJECT_VERSION` = `8` (build number, debe coincidir con versionCode de Android)
- `Bundle Identifier` = `com.atlx.antojadosmx` (mismo appId que Android)

### 6.3 Sincronizar y Abrir en Xcode

```bash
cd apps/app-ios
npx cap sync ios
npx cap open ios
```

### 6.4 Build para Simulador

En Xcode:
- Scheme: `App`
- Destination: Simulador iOS
- Product → Build (Cmd+B)

### 6.5 Build para Dispositivo (Debug)

En Xcode:
- Conectar dispositivo fisico
- Scheme: `App`
- Destination: dispositivo
- Product → Run (Cmd+R)

### 6.6 Archive para TestFlight / App Store

```bash
# 1. Sincronizar
cd apps/app-ios
npx cap sync ios

# 2. Abrir Xcode
npx cap open ios

# 3. En Xcode:
#    - Product → Archive
#    - El archivo aparecera en Organizer
#
# 4. Distribuir:
#    - "Distribute App" → "App Store Connect"
#    - O "Export" para distribucion manual
```

### 6.7 Flujo Completo iOS

```bash
# 1. Sincronizar web con Capacitor
cd apps/app-ios
npx cap sync ios

# 2. Incrementar CFBundleVersion en Xcode

# 3. Archive
#    - Product → Archive

# 4. Subir a App Store Connect
#    - Validate App
#    - Distribute App
#    - Esperar procesamiento (15-30 min)

# 5. TestFlight
#    - En App Store Connect, ir a TestFlight
#    - Agregar testers internos/externos
#    - Enviar invitacion

# 6. App Store Review
#    - Ir a "App Store" → "Nueva version"
#    - Completar formulario
#    - Enviar para revision
```

## 7. Pruebas Cerradas

### 7.1 Firebase App Distribution (Android)

```bash
# 1. Build APK de release
cd apps/android-new/src-capacitor/android
./gradlew assembleRelease

# 2. Subir a Firebase
#    Usando Firebase CLI:
firebase appdistribution:distribute \
    app/build/outputs/apk/release/app-release.apk \
    --app 1:123456789:android:abc123def456 \
    --groups "qa-team" \
    --release-notes "Version 2.0.0 build 7"
```

### 7.2 TestFlight (iOS)

```bash
# El proceso es via Xcode → Archive → App Store Connect → TestFlight
# No hay CLI directa, pero se puede usar:

# 1. Archive
# 2. Distribuir a App Store Connect
# 3. En App Store Connect:
#    - Ir a TestFlight
#    - Activar la build
#    - Agregar testers internos (Apple ID)
#    - Agregar testers externos (email)
#    - Enviar invitacion
```

## 8. Versionado

### 8.1 Android

| Elemento | Donde | Valor actual |
|---|---|---|
| versionCode | build.gradle (defaultConfig) | 8 |
| versionName | build.gradle (defaultConfig) | 2.0.1 |
| appId | capacitor.config.json | com.atlx.antojadosmx |
| appName | capacitor.config.json | AntojadosMX |

### 8.2 iOS

| Elemento | Donde | Valor actual |
|---|---|---|
| CURRENT_PROJECT_VERSION | project.pbxproj | 8 (debe coincidir con versionCode) |
| MARKETING_VERSION | project.pbxproj | 2.0.1 (debe coincidir con versionName) |
| Bundle Identifier | project.pbxproj / capacitor.config.json | com.atlx.antojadosmx |
| appName | capacitor.config.json / Info.plist | AntojadosMX |

### 8.3 Regla de Compatibilidad (OBLIGATORIA)

- Android y iOS deben tener el MISMO `versionName` / `MARKETING_VERSION` (visible al usuario)
- Android `versionCode` e iOS `CURRENT_PROJECT_VERSION` deben coincidir
- Android `appId` e iOS `Bundle Identifier` deben ser el mismo
- Ambos `appName` / `CFBundleDisplayName` deben ser iguales

## 9. Firmas

### 9.1 Android Keystore

El keystore de release NO se sube al repositorio.
Debe estar en una ubicacion segura fuera del proyecto.

```bash
# Generar keystore (solo la primera vez)
keytool -genkey -v \
    -keystore antojados-release.keystore \
    -alias antojados \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000

# Verificar
keytool -list -v -keystore antojados-release.keystore
```

### 9.2 iOS Certificados

Los certificados y provisioning profiles se gestionan via Apple Developer Portal:
- Development certificate
- Distribution certificate
- Development provisioning profile
- Distribution provisioning profile

## 10. CI/CD (Recomendado)

### 10.1 GitHub Actions (Android)

```yaml
name: Build Android Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
      - run: npm ci
      - run: npx cap sync android
      - run: cd apps/android-new/src-capacitor/android && ./gradlew bundleRelease
        env:
          ANDROID_KEYSTORE_PATH: ${{ secrets.ANDROID_KEYSTORE_PATH }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with:
          name: app-release.aab
          path: apps/android-new/src-capacitor/android/app/build/outputs/bundle/release/
```

### 10.2 GitHub Actions (iOS)

Requiere macOS runner. Recomendado: usar Fastlane + GitHub Actions.

## 11. Checklist de Release

- [ ] versionCode incrementado (Android)
- [ ] CFBundleVersion incrementado (iOS)
- [ ] versionName actualizado (ambos)
- [ ] CHANGELOG.md actualizado
- [ ] Variables de entorno configuradas
- [ ] Media Engine funcionando en produccion
- [ ] Build web exitoso
- [ ] APK debug exitoso (Android)
- [ ] Archive exitoso (iOS)
- [ ] Pruebas cerradas en Firebase (Android)
- [ ] Pruebas cerradas en TestFlight (iOS)
- [ ] Review de Play Console (si es produccion)
- [ ] Review de App Store (si es produccion)

## 12. Problemas Conocidos

| Problema | Causa | Solucion |
|---|---|---|
| APK no se instala | versionCode menor que Play Store | Incrementar versionCode |
| AAB rechazado | Keystore incorrecto | Usar el mismo keystore que Android Old |
| Archive falla | Provisioning profile vencido | Renovar en Apple Developer |
| TestFlight no acepta build | CFBundleVersion repetido | Incrementar build number |
| Firebase Distribution falla | APK sin firmar | Usar assembleRelease no assembleDebug |

## 13. ⚠️ Deuda Tecnica Identificada

- No hay pipeline CI/CD automatizado (builds manuales)
- No hay scripts de build unificados (cada paso es manual)
- Los secretos (keystore, passwords) no estan en un vault seguro
- No hay un `fastlane` configurado para iOS
- No hay pruebas automatizadas antes del build

## 14. Historial

| Version | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 28/06/2026 | Contrato inicial. Build Android, iOS, Firebase, TestFlight |
| 1.1.0 | 29/06/2026 | Sincronizacion Android/iOS: appId, versionName, appName unificados |
