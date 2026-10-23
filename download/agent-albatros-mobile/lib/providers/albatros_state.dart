// Agent Albatros — état applicatif (ChangeNotifier)
import 'package:flutter/foundation.dart';
import '../core/api_client.dart';
import '../models/models.dart';

/// État global : session, appareils, incidents.
/// Les actions sensibles (signalement, partage) passent par [startStepUp] /
/// [verifyStepUp] pour obtenir un ticket à usage unique (F-003).
class AlbatrosState extends ChangeNotifier {
  final ApiClient api = ApiClient();

  SessionUser? user;
  List<Device> devices = [];
  List<Incident> incidents = [];
  bool loading = false;
  String? error;
  String? stepUpTicket;

  bool get authenticated => user != null;

  void _guard(Future<void> Function() fn) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      await fn();
    } on ApiException catch (e) {
      error = e.message;
    } catch (e) {
      error = 'Erreur réseau — vérifiez la connexion.';
      debugPrint('[albatros] $e');
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  // ---- Session ----
  Future<void> restoreSession() => _guard(() async {
        final res = await api.session();
        user = SessionUser.fromJson(res['user'] as Map<String, dynamic>);
      });

  Future<void> login(String identifier, String code) => _guard(() async {
        final res = await api.otpVerify(identifier, code);
        user = SessionUser.fromJson(res['user'] as Map<String, dynamic>);
        await refreshAll();
      });

  Future<void> logout() => _guard(() async {
        await api.logout();
        user = null;
        devices = [];
        incidents = [];
      });

  // ---- Vérification renforcée (F-003) ----
  /// Étape 1 : déclenche l'envoi du code step-up (renvoie le code en mode pilote).
  Future<String?> startStepUp() async {
    final identifier = user?.phone ?? user?.email ?? '';
    final res = await api.otpStart(identifier, purpose: 'step_up');
    return res['demo_code'] as String?; // en production : null (SMS/email réels)
  }

  /// Étape 2 : vérifie le code et stocke le ticket pour l'action sensible.
  Future<void> verifyStepUp(String code) async {
    final identifier = user?.phone ?? user?.email ?? '';
    final res = await api.otpVerify(identifier, code, purpose: 'step_up');
    stepUpTicket = res['step_up_ticket'] as String?;
    notifyListeners();
  }

  String? consumeStepUpTicket() {
    final t = stepUpTicket;
    stepUpTicket = null;
    return t;
  }

  // ---- Données ----
  Future<void> refreshAll() => _guard(() async {
        final d = await api.devices();
        final i = await api.incidents();
        devices = (d['devices'] as List)
            .map((x) => Device.fromJson(x as Map<String, dynamic>))
            .toList();
        incidents = (i['incidents'] as List)
            .map((x) => Incident.fromJson(x as Map<String, dynamic>))
            .toList();
      });

  /// Enrôlement de CET appareil (l'app mobile s'associe au compte via l'ID opaque).
  Future<void> enrollCurrentDevice(String deviceId, {double? lat, double? lng}) =>
      _guard(() async {
        await api.enrollDevice(deviceId);
        await refreshAll();
      });

  // ---- Signalement (F-060) — exige le ticket step-up ----
  Future<String?> declareIncident({
    required String deviceId,
    required String type, // loss | theft
    required String locationText,
    required String occurredAtIso,
    String? description,
    String? simPhone,
  }) async {
    final ticket = consumeStepUpTicket();
    if (ticket == null) {
      error = 'Vérification renforcée requise avant tout signalement.';
      notifyListeners();
      return null;
    }
    String? ref;
    await _guard(() async {
      final res = await api.createIncident({
        'device_id': deviceId,
        'type': type,
        'location_text': locationText,
        'occurred_at': occurredAtIso,
        if (description != null) 'description': description,
        if (simPhone != null) 'sim_phone': simPhone,
        'step_up_ticket': ticket,
      });
      ref = ((res['incident'] as Map<String, dynamic>)['refNumber'] as String?) ?? '';
      await refreshAll();
    });
    return ref;
  }
}
