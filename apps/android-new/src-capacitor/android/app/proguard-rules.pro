# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ── AntojadosMX: proteger WebView y assets JS ──────────────────────────
# No ofuscar clases de Capacitor usadas desde JS
-keep class com.getcapacitor.** { *; }
-keep class com.atlx.antojadosmx.** { *; }

# Preservar la interface JS → Native (bridge de Capacitor)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# No ofuscar assets web (Vue/Quasar)
-keep class **.R$* { *; }
-keepattributes JavascriptInterface
-keepattributes *Annotation*

