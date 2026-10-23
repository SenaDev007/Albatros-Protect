// Albatros Protect — Appareils : inventaire privé, identifiants masqués (§6.4, F-015)
package bj.albatrosprotect.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import bj.albatrosprotect.core.ApiClient
import bj.albatrosprotect.core.Device
import kotlinx.coroutines.launch

// Masquage des identifiants sensibles — jamais affichés intégralement sans nécessité (§6.4)
fun masked(v: String): String =
    if (v.length <= 6) v.first() + "•".repeat(maxOf(v.length - 1, 0))
    else v.take(3) + "•".repeat(v.length - 5) + v.takeLast(2)

@Composable
fun DevicesScreen(modifier: Modifier = Modifier) {
    var devices by remember { mutableStateOf<List<Device>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                devices = ApiClient.devices().let { arr ->
                    (0 until arr.length()).map { Device.fromJson(arr.getJSONObject(it)) }
                }
            } catch (_: Exception) { }
            loading = false
        }
    }

    LazyColumn(
        modifier = modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Text("Mes appareils", style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(top = 24.dp))
        }
        if (loading) item { CircularProgressIndicator() }
        if (!loading && devices.isEmpty()) {
            item {
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Aucun appareil enregistré", style = MaterialTheme.typography.titleSmall)
                        Text(
                            "Ajoutez vos appareils, leurs identifiants et une preuve de propriété avant tout incident.",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
        items(devices) { d ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(14.dp)) {
                    Text("${d.brand} ${d.model}", style = MaterialTheme.typography.titleSmall)
                    Text("ID de service : ${masked(d.deviceId)}", style = MaterialTheme.typography.bodySmall)
                    Text(
                        "Catégorie : ${d.category} · ${d.osName ?: "OS inconnu"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}
