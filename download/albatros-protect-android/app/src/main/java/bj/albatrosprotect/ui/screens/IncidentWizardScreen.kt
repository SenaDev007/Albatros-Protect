// Albatros Protect — Parcours de signalement §7.5 (5 étapes courtes + réauthentification F-003)
package bj.albatrosprotect.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import bj.albatrosprotect.core.ApiClient
import kotlinx.coroutines.launch

@Composable
fun IncidentWizardScreen(modifier: Modifier = Modifier) {
    var step by remember { mutableIntStateOf(0) }
    var device by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("loss") }
    var location by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val steps = listOf("Appareil", "Type", "Lieu & circonstances", "Confirmation", "Référence")
    var stepUpTicket by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("Signaler une perte ou un vol", style = MaterialTheme.typography.headlineSmall)
        LinearProgressIndicator(
            progress = { (step + 1) / steps.size.toFloat() },
            modifier = Modifier.fillMaxWidth(),
        )

        when (step) {
            0 -> {
                OutlinedTextField(value = device, onValueChange = { device = it },
                    label = { Text("ID de l'appareil (ALB-XXXXXX)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
            1 -> {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    FilterChip(selected = type == "loss", onClick = { type = "loss" }, label = { Text("Perte") })
                    FilterChip(selected = type == "theft", onClick = { type = "theft" }, label = { Text("Vol") })
                }
            }
            2 -> {
                OutlinedTextField(value = location, onValueChange = { location = it },
                    label = { Text("Lieu déclaré (si connu)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = description, onValueChange = { description = it },
                    label = { Text("Circonstances (facultatif)") }, modifier = Modifier.fillMaxWidth(), maxLines = 4)
            }
            3 -> {
                // §7.5 : confirmation qui indique ce qui a réellement été enregistré
                Text(
                    "Le dossier enregistrera : $type, $location, description \"${description.ifBlank { "—" }}\".\n" +
                    "Aucune plainte officielle n'est déposée et aucun opérateur n'est contacté automatiquement.\n" +
                    "Une vérification renforcée (code à usage unique) est requise avant l'enregistrement.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                Button(
                    onClick = {
                        scope.launch {
                            loading = true
                            try {
                                // F-003 — vérification renforcée : OTP step-up délivre un ticket
                                val identifier = "" // TODO : identifiant vérifié du compte connecté
                                ApiClient.otpStart(identifier, "step_up")
                                // TODO : saisir le code reçu puis :
                                // val res = ApiClient.otpVerify(identifier, code, "step_up")
                                // stepUpTicket = res.optString("step_up_ticket")
                                step++
                            } catch (e: Exception) { error = e.message }
                            finally { loading = false }
                        }
                    },
                    enabled = !loading && device.isNotBlank(),
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Demander le code de vérification") }
            }
            else -> {
                stepUpTicket?.let { ticket ->
                    Button(
                        onClick = {
                            scope.launch {
                                loading = true
                                try {
                                    val res = ApiClient.createIncident(
                                        org.json.JSONObject()
                                            .put("device_id", device)
                                            .put("type", type)
                                            .put("location_text", location.ifBlank { "Non précisé" })
                                            .put("occurred_at", java.time.Instant.now().toString())
                                            .put("description", description)
                                            .put("step_up_ticket", ticket)
                                    )
                                    result = "Dossier ${res.getJSONObject("incident").optString("refNumber")} créé."
                                    step = 4
                                } catch (e: Exception) { error = e.message }
                                finally { loading = false }
                            }
                        },
                        enabled = !loading,
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Confirmer le signalement") }
                }
            }
        }

        error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
        result?.let {
            Text(it, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.titleSmall)
            Text(
                "Actions immédiates : sécurisez vos comptes, contactez votre opérateur pour la SIM, " +
                    "déposez plainte en cas de vol. Ne vous rendez jamais seul vers une position.",
                style = MaterialTheme.typography.bodySmall,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            if (step in 1..3) {
                OutlinedButton(onClick = { step-- }, enabled = !loading) { Text("Retour") }
            }
            if (step in 0..2) {
                Button(onClick = { step++ }, enabled = !loading) { Text("Continuer") }
            }
        }
    }
}
