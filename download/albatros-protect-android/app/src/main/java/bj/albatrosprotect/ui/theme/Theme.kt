// Albatros Protect — thème Compose (modes clair ET sombre, §2.3)
package bj.albatrosprotect.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightScheme = lightColorScheme(
    primary = RougePrincipal,
    onPrimary = Blanc,
    secondary = GrisFonce,
    background = GrisClair,
    onBackground = NoirPrincipal,
    surface = Blanc,
    onSurface = NoirPrincipal,
    surfaceVariant = GrisClair,
    onSurfaceVariant = GrisMoyen,
    outline = Bordure,
    error = RougeFonce,
)

private val DarkScheme = darkColorScheme(
    primary = RougePrincipal,
    onPrimary = Blanc,
    secondary = GrisMoyen,
    background = NoirPrincipal,
    onBackground = Blanc,
    surface = NoirSecondaire,
    onSurface = Blanc,
    surfaceVariant = NoirSecondaire,
    onSurfaceVariant = Color(0xFFB8BAC3),
    outline = Color(0xFF26282F),
    error = RougePrincipal,
)

@Composable
fun AlbatrosTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkScheme else LightScheme,
        content = content,
    )
}
