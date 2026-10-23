// Albatros Protect — MainActivity : navigation basse §7.2 (Accueil, Appareils, Carte, Dossiers, Profil)
package bj.albatrosprotect

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import bj.albatrosprotect.ui.screens.*
import bj.albatrosprotect.ui.theme.AlbatrosTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AlbatrosTheme {
                AlbatrosApp()
            }
        }
    }
}

@Composable
fun AlbatrosApp() {
    var selected by remember { mutableIntStateOf(0) }
    val items = listOf(
        "Accueil" to Icons.Default.Home,
        "Appareils" to Icons.Default.Devices,
        "Carte" to Icons.Default.Map,
        "Dossiers" to Icons.Default.Menu,
        "Profil" to Icons.Default.Person,
    )
    Scaffold(
        bottomBar = {
            NavigationBar {
                items.forEachIndexed { index, (label, icon) ->
                    NavigationBarItem(
                        selected = selected == index,
                        onClick = { selected = index },
                        icon = { Icon(icon, contentDescription = label) },
                        label = { Text(label) },
                    )
                }
            }
        },
    ) { padding ->
        val modifier = Modifier.padding(padding)
        when (selected) {
            0 -> HomeScreen(modifier)
            1 -> DevicesScreen(modifier)
            2 -> MapScreen(modifier)
            3 -> HomeScreen(modifier) // TODO Phase 2 : DossiersScreen (liste + fiche)
            else -> LoginScreen(modifier) // TODO Phase 2 : ProfilScreen (paramètres + confidentialité)
        }
    }
}
