// Albatros Protect — client API /api/v1 (OkHttp + org.json, sessions cookies)
// Même contrat que le portail web (spécification technique §6.1).
package bj.albatrosprotect.core

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.CookieManager
import java.net.CookiePolicy

class ApiException(val code: String, message: String) : Exception(message)

object ApiClient {
    // En émulateur : 10.0.2.2 = localhost hôte. En production : URL HTTPS du pilote.
    var baseUrl: String = "http://10.0.2.2:3000/api/v1"

    private val cookies = CookieManager().apply { setCookiePolicy(CookiePolicy.ACCEPT_ALL) }
    private val client = okhttp3.OkHttpClient.Builder()
        .cookieJar(java.net.CookieJar { url, cookieList ->
            if (url.host.contains("10.0.2.2") || url.host.contains("albatros")) {
                cookieList.forEach { cookies.put(url.toURI(), java.net.HttpCookie(it.name, it.value)) }
            }
        })
        .build()

    private fun buildRequest(method: String, path: String, body: JSONObject?): okhttp3.Request {
        val url = "$baseUrl$path"
        val reqBody = body?.let { okhttp3.RequestBody.create(it.toString().toByteArray(), okhttp3.MediaType.parse("application/json")) }
        return when (method) {
            "POST" -> okhttp3.Request.Builder().url(url).post(reqBody ?: okhttp3.RequestBody.create(ByteArray(0), null)).build()
            "PATCH" -> okhttp3.Request.Builder().url(url).patch(reqBody ?: okhttp3.RequestBody.create(ByteArray(0), null)).build()
            "DELETE" -> okhttp3.Request.Builder().url(url).delete().build()
            else -> okhttp3.Request.Builder().url(url).get().build()
        }
    }

    suspend fun request(method: String, path: String, body: JSONObject? = null): JSONObject =
        withContext(Dispatchers.IO) {
            val res = client.newCall(buildRequest(method, path, body)).execute()
            val data = res.body()?.string()?.let {
                if (it.isBlank()) JSONObject() else JSONObject(it)
            } ?: JSONObject()
            if (!res.isSuccessful) {
                throw ApiException(
                    data.optString("error", "INTERNAL_ERROR"),
                    data.optString("message", "Erreur ${res.code()}"),
                )
            }
            data
        }

    // ---- Auth (F-001, F-003) ----
    suspend fun otpStart(identifier: String, purpose: String = "login"): JSONObject =
        request("POST", "/auth/otp/start", JSONObject().put("identifier", identifier).put("purpose", purpose))

    suspend fun otpVerify(identifier: String, code: String, purpose: String = "login"): JSONObject =
        request("POST", "/auth/otp/verify", JSONObject()
            .put("identifier", identifier).put("code", code).put("purpose", purpose))

    suspend fun session(): JSONObject = request("GET", "/auth/session")
    suspend fun logout() = request("DELETE", "/auth/session")

    // ---- Appareils ----
    suspend fun devices(): JSONArray = request("GET", "/devices").optJSONArray("devices") ?: JSONArray()
    suspend fun enrollDevice(id: String): JSONObject = request("POST", "/devices/$id/enrollment")

    // ---- Observations (F-030, §11) ----
    suspend fun sendLocation(deviceId: String, lat: Double, lng: Double, accuracy: Double?, incidentId: String? = null): JSONObject =
        request("POST", "/observations/location", JSONObject()
            .put("device_id", deviceId)
            .put("source", "native_location")
            .put("latitude", lat).put("longitude", lng)
            .apply { accuracy?.let { put("accuracy_radius_m", it) }; incidentId?.let { put("incident_id", it) } })

    suspend fun sendBleEncounter(targetDeviceId: String, detLat: Double, detLng: Double, rssi: Int?): JSONObject =
        request("POST", "/observations/ble", JSONObject()
            .put("device_id", targetDeviceId)
            .put("detector_latitude", detLat).put("detector_longitude", detLng)
            .apply { rssi?.let { put("rssi", it) } })

    // ---- Incidents (F-060, F-003) ----
    suspend fun incidents(): JSONArray = request("GET", "/incidents").optJSONArray("incidents") ?: JSONArray()
    suspend fun createIncident(payload: JSONObject): JSONObject = request("POST", "/incidents", payload)
    suspend fun incidentMap(id: String): JSONObject = request("GET", "/incidents/$id/map")
}
