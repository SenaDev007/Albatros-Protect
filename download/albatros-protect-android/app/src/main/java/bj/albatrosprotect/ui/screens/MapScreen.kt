// Albatros Protect — Carte §6.5/§7.6 : fond Google Maps, sources différenciées,
// état vide honnête si aucune clé n'est configurée (jamais de carte trompeuse).
package bj.albatrosprotect.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import bj.albatrosprotect.core.ApiClient
import bj.albatrosprotect.core.Observation
import kotlinx.coroutines.launch

// Pilote Parakou — centre par défaut (Google Maps Platform en production, clé restreinte)
private const val PARAKOU_LAT = 9.3433
private const val PARAKOU_LNG = 2.6089

@Composable
fun MapScreen(modifier: Modifier = Modifier) {
    var observations by remember { mutableStateOf<List<Observation>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                // Point d'intégration : incidents() → incidentMap(id) pour les observations autorisées
                // Google Maps SDK : clé dans AndroidManifest (com.google.android.geo.API_KEY),
                // jamais dans le code — voir README.
                val incidents = ApiClient.incidents()
                if (incidents.length() > 0) {
                    val id = incidents.getJSONObject(0).optString("id")
                    val map = ApiClient.incidentMap(id)
                    val arr = map.optJSONArray("observations")
                    observations = arr?.let { a -> (0 until a.length()).map { Observation.fromJson(a.getJSONObject(it)) } } ?: emptyList()
                }
            } catch (_: Exception) { }
            loading = false
        }
    }

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        Text("Carte et observations", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Dernière mise à jour : chargée depuis le service — aucune position fabriquée.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(12.dp))

        // TODO Phase 2 : GoogleMap(com.google.android.gms.maps) quand la clé est configurée.
        // Sans clé ni observation : état vide explicite (§7.9), pas de fond de carte factice.
        Card(Modifier.fillMaxWidth().weight(1f)) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                if (loading) CircularProgressIndicator()
                else if (observations.isEmpty()) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Aucune position disponible", style = MaterialTheme.typography.titleSmall)
                        Text(
                            "Aucune observation réelle n'a été reçue. Rien n'est extrapolé — " +
                                "vérifiez que l'agent est enrôlé et les permissions accordées.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 24.dp),
                        )
                    }
                } else {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        observations.take(6).forEach { o ->
                            Text("• ${o.sourceLabel} — ${o.capturedAt.take(16).replace("T", " à ")}", style = MaterialTheme.typography.bodySmall)
                        }
                        Text(
                            "Légende : rouge = position reçue de l'appareil · orange = estimation Wi-Fi/cellulaire · " +
                                "violet = détection Bluetooth à proximité · teal = partenaire autorisé.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}
