# Apps Antojados V2

Workspace limpio para las apps moviles V2 de AntojadosMX.

## Estructura

```txt
Apps_antojados/
├── apps/
│   ├── app-ios/
│   └── android-new/
└── shared/
    ├── api/
    ├── http/
    └── ui/
```

## Comandos

```bash
npm install
npm run v2:build
```

## iOS

```bash
cd apps/app-ios
npx cap sync ios
npx cap open ios
```

Abrir en Xcode desde `apps/app-ios/src-capacitor/ios`.

## Android

```bash
cd apps/android-new
npx cap sync android
npx cap open android
```

Abrir en Android Studio desde `apps/android-new/src-capacitor/android`.

## Nota

El Android legacy no forma parte de este workspace.
