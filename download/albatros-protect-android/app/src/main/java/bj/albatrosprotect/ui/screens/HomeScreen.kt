// Albatros Protect — Accueil §7.3 : préparation, appareils, actions rapides, activité
package bj.albatrosprotect.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import bj.albatrosprotect.core.ApiClient
import bj.albatrosprotect.core.Device
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(modifier: Modifier = Modifier) {
    var devices by remember { mutableStateOf<List<Device>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                devices = ApiClient.devices().let { arr ->
                    (0 until arr.length()).map { Device.fromJson(arr.getJSONObject(it)) }
                }
            } catch (_: Exception) {
                // État réseau indisponible §7.9 : expliciter, proposer une action réaliste
            } finally { loading = false }
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text("Bonjour 👋", style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(top = 24.dp))
            Text("Votre protection au quotidien — sans jauge arbitraire.", style = MaterialTheme.typography.bodySmall)
        }

        // Carte de préparation §7.3 — fondée sur des critères réels (agents enrôlés)
        item {
            val enrolled = devices.count { it.enrolled }
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Préparation", style = MaterialTheme.typography.titleMedium)
                    Text(
                        if (devices.isEmpty()) "Aucun appareil enregistré."
                        else "$enrolled appareil(s) correctement enrôlé(s) sur ${devices.size}.",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
            }
        }

        item { Text("Mes appareils", style = MaterialTheme.typography.titleLarge) }
        if (loading) item { CircularProgressIndicator() }
        items(devices) { d ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(14.dp)) {
                    Text("${d.brand} ${d.model}", style = MaterialTheme.typography.titleSmall)
                    Text(
                        if (d.enrolled) "Agent actif" else "Non enrôlé — localisation impossible après vol",
                        color = if (d.enrolled) MaterialTheme.colorScheme.primary
                               else MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }

        item {
            Text("Actions rapides", style = MaterialTheme.typography.titleLarge)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                OutlinedButton(onClick = { /* TODO : parcours d'ajout §7.4 */ }, modifier = Modifier.fillMaxWidth()) {
                    Text("Ajouter un appareil")
                }
                OutlinedButton(onClick = { /* TODO : parcours de signalement §7.5 */ }, modifier = Modifier.fillMaxWidth()) {
                    Text("Signaler une perte ou un vol")
                }
            }
        }

        // §12.3 — jamais de conclusion automatique de vol sur perte de contact
        item {
            Text(
                "Aucune position n'est fabriquée : une absence de donnée reste une absence d'information.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
