// Agent Albatros — client API typé pour /api/v1
// Même contrat que le portail web (spécification technique §6.1).
import 'dart:convert';
import 'package:http/http.dart' as http;

import 'config.dart';

class ApiException implements Exception {
  final String code;
  final String message;
  ApiException(this.code, this.message);
  @override
  String toString() => message;
}

class ApiClient {
  String? _sessionCookie;

  void setSessionCookie(String? raw) {
    if (raw == null) return;
    _sessionCookie = raw.split(';').first;
  }

  void clearSession() => _sessionCookie = null;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_sessionCookie != null) 'Cookie': _sessionCookie!,
      };

  Future<Map<String, dynamic>> _req(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$kApiBaseUrl$path');
    http.Response res;
    switch (method) {
      case 'POST':
        res = await http.post(uri, headers: _headers, body: jsonEncode(body ?? {}));
        break;
      case 'PATCH':
        res = await http.patch(uri, headers: _headers, body: jsonEncode(body ?? {}));
        break;
      case 'DELETE':
        res = await http.delete(uri, headers: _headers);
        break;
      default:
        res = await http.get(uri, headers: _headers);
    }
    final raw = res.headers['set-cookie'];
    if (raw != null) setSessionCookie(raw);

    final data = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw ApiException(
        (data['error'] as String?) ?? 'INTERNAL_ERROR',
        (data['message'] as String?) ?? 'Erreur ${res.statusCode}',
      );
    }
    return data;
  }

  // ---- Auth (F-001, F-002, F-003) ----
  Future<Map<String, dynamic>> otpStart(String identifier, {String purpose = 'login'}) =>
      _req('POST', '/auth/otp/start', body: {'identifier': identifier, 'purpose': purpose});

  Future<Map<String, dynamic>> otpVerify(String identifier, String code, {String purpose = 'login'}) =>
      _req('POST', '/auth/otp/verify', body: {
        'identifier': identifier,
        'code': code,
        'purpose': purpose,
      });

  Future<Map<String, dynamic>> session() => _req('GET', '/auth/session');
  Future<void> logout() => _req('DELETE', '/auth/session');

  // ---- Appareils ----
  Future<Map<String, dynamic>> devices() => _req('GET', '/devices');
  Future<Map<String, dynamic>> deviceDetail(String id) => _req('GET', '/devices/$id');
  Future<Map<String, dynamic>> createDevice(Map<String, dynamic> payload) =>
      _req('POST', '/devices', body: payload);
  Future<Map<String, dynamic>> updateDevice(String id, Map<String, dynamic> payload) =>
      _req('PATCH', '/devices/$id', body: payload);
  Future<Map<String, dynamic>> enrollDevice(String id) =>
      _req('POST', '/devices/$id/enrollment');

  // ---- Observations (F-030 … F-038) ----
  /// Transmission d'une position native collectée par l'application mobile.
  Future<Map<String, dynamic>> sendLocationObservation({
    required String deviceId,
    required double latitude,
    required double longitude,
    double? accuracyRadiusM,
    String? incidentId,
    String? idempotencyKey,
  }) =>
      _req('POST', '/observations/location', body: {
        'device_id': deviceId,
        'source': 'native_location',
        'latitude': latitude,
        'longitude': longitude,
        if (accuracyRadiusM != null) 'accuracy_radius_m': accuracyRadiusM,
        if (incidentId != null) 'incident_id': incidentId,
        if (idempotencyKey != null) 'idempotency_key': idempotencyKey,
        'quality': 'estimated',
      });

  /// Relais d'une rencontre BLE du réseau communautaire (§11).
  Future<Map<String, dynamic>> sendBleEncounter({
    required String targetDeviceId,
    required double detectorLatitude,
    required double detectorLongitude,
    double? detectorAccuracyM,
    int? rssi,
  }) =>
      _req('POST', '/observations/ble', body: {
        'device_id': targetDeviceId,
        'detector_latitude': detectorLatitude,
        'detector_longitude': detectorLongitude,
        if (detectorAccuracyM != null) 'detector_accuracy_m': detectorAccuracyM,
        if (rssi != null) 'rssi': rssi,
      });

  // ---- Incidents (F-060 …) ----
  Future<Map<String, dynamic>> incidents() => _req('GET', '/incidents');
  Future<Map<String, dynamic>> incidentDetail(String id) => _req('GET', '/incidents/$id');
  Future<Map<String, dynamic>> createIncident(Map<String, dynamic> payload) =>
      _req('POST', '/incidents', body: payload);
  Future<Map<String, dynamic>> incidentMap(String id, {String? query}) =>
      _req('GET', '/incidents/$id/map${query ?? ''}');
}
