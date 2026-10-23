// Albatros Protect — Login OTP (§8.1 : sobre, identifiant vérifiable, pas de codes réaffichés)
package bj.albatrosprotect.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import bj.albatrosprotect.core.ApiClient
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(modifier: Modifier = Modifier) {
    var identifier by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var codeSent by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var demoCode by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = modifier.fillMaxSize().padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("ALBATROS", style = MaterialTheme.typography.headlineLarge)
        Text(
            "PROTECT",
            color = MaterialTheme.colorScheme.primary,
            style = MaterialTheme.typography.headlineLarge,
        )
        Text(
            "Protéger. Localiser. Récupérer.",
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(top = 4.dp),
        )

        Spacer(Modifier.height(32.dp))

        if (!codeSent) {
            OutlinedTextField(
                value = identifier,
                onValueChange = { identifier = it },
                label = { Text("Téléphone ou email") },
                placeholder = { Text("+229 97 00 00 01") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Button(
                onClick = {
                    scope.launch {
                        loading = true
                        try {
                            val res = ApiClient.otpStart(identifier)
                            demoCode = res.optString("demo_code", null) // pilote uniquement
                            codeSent = true
                            message = res.optString("demo_notice")
                        } catch (e: Exception) {
                            message = e.message
                        } finally { loading = false }
                    }
                },
                enabled = identifier.length >= 5 && !loading,
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            ) { Text("Recevoir le code") }
        } else {
            OutlinedTextField(
                value = code,
                onValueChange = { if (it.length <= 6) code = it.filter(Char::isDigit) },
                label = { Text("Code à 6 chiffres") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            demoCode?.let {
                Text(
                    "Mode pilote — code : $it",
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(vertical = 8.dp),
                )
            }
            Button(
                onClick = {
                    scope.launch {
                        loading = true
                        try {
                            ApiClient.otpVerify(identifier, code)
                            message = "Connecté — branchez la session sur l'état applicatif."
                        } catch (e: Exception) {
                            message = e.message
                        } finally { loading = false }
                    }
                },
                enabled = code.length == 6 && !loading,
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
            ) { Text("Vérifier et continuer") }
            TextButton(onClick = { codeSent = false; code = ""; demoCode = null }) {
                Text("Changer d'identifiant")
            }
        }

        message?.let {
            Text(
                it,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 12.dp),
            )
        }
    }
}
