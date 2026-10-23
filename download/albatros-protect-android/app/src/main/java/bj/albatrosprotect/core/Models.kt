// Albatros Protect — modèles de données (miroir API /api/v1)
package bj.albatrosprotect.core

import org.json.JSONObject

data class SessionUser(
    val id: String,
    val fullName: String,
    val role: String,
    val phone: String?,
    val email: String?,
) {
    companion object {
        fun fromJson(j: JSONObject) = SessionUser(
            id = j.optString("id"),
            fullName = j.optString("fullName", ""),
            role = j.optString("role", "citizen"),
            phone = if (j.isNull("phone")) null else j.optString("phone"),
            email = if (j.isNull("email")) null else j.optString("email"),
        )
    }
}

data class Observation(
    val id: String,
    val source: String,
    val latitude: Double,
    val longitude: Double,
    val accuracyRadiusM: Double?,
    val capturedAt: String,
    val note: String?,
) {
    companion object {
        fun fromJson(j: JSONObject) = Observation(
            id = j.optString("id"),
            source = j.optString("source", "native_location"),
            latitude = j.optDouble("latitude"),
            longitude = j.optDouble("longitude"),
            accuracyRadiusM = if (j.isNull("accuracyRadiusM")) null else j.optDouble("accuracyRadiusM"),
            capturedAt = j.optString("capturedAt"),
            note = if (j.isNull("note")) null else j.optString("note"),
        )
    }

    // §6.5 — vocabulaire officiel, jamais de transformation trompeuse
    val sourceLabel: String
        get() = when (source) {
            "native_location" -> "Position reçue de l'appareil"
            "google_geolocation" -> "Estimation Wi-Fi/cellulaire"
            "ble_witness" -> "Détection Bluetooth à proximité"
            "operator_authorized" -> "Position communiquée par un partenaire autorisé"
            else -> "Source inconnue"
        }
}

data class Device(
    val id: String,
    val deviceId: String,
    val category: String,
    val brand: String,
    val model: String,
    val osName: String?,
    val enrolled: Boolean,
    val lastTransmissionAt: String?,
    val lastObservation: Observation?,
) {
    companion object {
        fun fromJson(j: JSONObject): Device {
            val lastObs = j.optJSONObject("lastObservation")
            return Device(
                id = j.optString("id"),
                deviceId = j.optString("deviceId"),
                category = j.optString("category", "smartphone"),
                brand = j.optString("brand", ""),
                model = j.optString("model", ""),
                osName = if (j.isNull("osName")) null else j.optString("osName"),
                enrolled = j.optBoolean("enrolled", false),
                lastTransmissionAt = if (j.isNull("lastTransmissionAt")) null else j.optString("lastTransmissionAt"),
                lastObservation = lastObs?.let { Observation.fromJson(it) },
            )
        }
    }
}

data class Incident(
    val id: String,
    val refNumber: String,
    val type: String,
    val status: String,
    val occurredAt: String,
    val locationText: String,
    val lastObservation: Observation?,
) {
    val isOpen: Boolean get() = status != "closed" && status != "draft"
    val statusLabel: String
        get() = when (status) {
            "draft" -> "Brouillon"
            "submitted" -> "Soumis"
            "verification_required" -> "Vérification requise"
            "ready_to_transmit" -> "Prêt à transmettre"
            "transmitted" -> "Transmis au partenaire"
            "processing" -> "En traitement"
            "response_received" -> "Réponse reçue"
            "closed" -> "Clôturé"
            "disputed" -> "Contesté"
            else -> status
        }

    companion object {
        fun fromJson(j: JSONObject): Incident {
            val lastObs = j.optJSONObject("lastObservation")
            return Incident(
                id = j.optString("id"),
                refNumber = j.optString("refNumber"),
                type = j.optString("type", "loss"),
                status = j.optString("status", "submitted"),
                occurredAt = j.optString("occurredAt"),
                locationText = j.optString("locationText"),
                lastObservation = lastObs?.let { Observation.fromJson(it) },
            )
        }
    }
}
