// Albatros Protect — configuration Gradle (app)
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "bj.albatrosprotect"
    compileSdk = 35

    defaultConfig {
        applicationId = "bj.albatrosprotect"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        // buildConfigField("String", "API_URL", "\"https://api-pilote.example/\"") — après hébergement
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.02")
    implementation(composeBom)
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    // Google Maps SDK (décommenter après création de la clé restreinte) :
    // implementation("com.google.android.gms:play-services-maps:19.0.0")
    // Location (Phase 2) :
    // implementation("com.google.android.gms:play-services-location:21.3.0")
}
