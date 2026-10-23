// Agent Albatros — modèles de données (miroir des entités API /api/v1)
class SessionUser {
  final String id;
  final String fullName;
  final String role;
  final String? phone;
  final String? email;

  SessionUser({required this.id, required this.fullName, required this.role, this.phone, this.email});

  factory SessionUser.fromJson(Map<String, dynamic> j) => SessionUser(
        id: j['id'] as String,
        fullName: (j['fullName'] as String?) ?? '',
        role: (j['role'] as String?) ?? 'citizen',
        phone: j['phone'] as String?,
        email: j['email'] as String?,
      );
}

class Device {
  final String id;
  final String deviceId;
  final String category;
  final String brand;
  final String model;
  final String? osName;
  final String? osVersion;
  final bool enrolled;
  final bool locationEnabled;
  final bool bleEnabled;
  final String? lastTransmissionAt;
  final Observation? lastObservation;

  Device({
    required this.id,
    required this.deviceId,
    required this.category,
    required this.brand,
    required this.model,
    this.osName,
    this.osVersion,
    this.enrolled = false,
    this.locationEnabled = false,
    this.bleEnabled = false,
    this.lastTransmissionAt,
    this.lastObservation,
  });

  factory Device.fromJson(Map<String, dynamic> j) => Device(
        id: j['id'] as String,
        deviceId: (j['deviceId'] as String?) ?? '',
        category: (j['category'] as String?) ?? 'smartphone',
        brand: (j['brand'] as String?) ?? '',
        model: (j['model'] as String?) ?? '',
        osName: j['osName'] as String?,
        osVersion: j['osVersion'] as String?,
        enrolled: (j['enrolled'] as bool?) ?? false,
        locationEnabled: (j['locationEnabled'] as bool?) ?? false,
        bleEnabled: (j['bleEnabled'] as bool?) ?? false,
        lastTransmissionAt: j['lastTransmissionAt'] as String?,
        lastObservation: j['lastObservation'] is Map
            ? Observation.fromJson(j['lastObservation'] as Map<String, dynamic>)
            : null,
      );
}

class Observation {
  final String id;
  final String source;
  final double latitude;
  final double longitude;
  final double? accuracyRadiusM;
  final String capturedAt;
  final String mode;
  final String quality;
  final String? note;

  Observation({
    required this.id,
    required this.source,
    required this.latitude,
    required this.longitude,
    this.accuracyRadiusM,
    required this.capturedAt,
    this.mode = 'normal',
    this.quality = 'estimated',
    this.note,
  });

  factory Observation.fromJson(Map<String, dynamic> j) => Observation(
        id: j['id'] as String,
        source: (j['source'] as String?) ?? 'native_location',
        latitude: (j['latitude'] as num).toDouble(),
        longitude: (j['longitude'] as num).toDouble(),
        accuracyRadiusM: (j['accuracyRadiusM'] as num?)?.toDouble(),
        capturedAt: (j['capturedAt'] as String?) ?? '',
        mode: (j['mode'] as String?) ?? 'normal',
        quality: (j['quality'] as String?) ?? 'estimated',
        note: j['note'] as String?,
      );

  bool get isFresh =>
      DateTime.now().difference(DateTime.tryParse(capturedAt) ?? DateTime(2000)).inMinutes < 15;
}

class Incident {
  final String id;
  final String refNumber;
  final String type; // loss | theft
  final String status;
  final String occurredAt;
  final String locationText;
  final String? policeReportRef;
  final Observation? lastObservation;

  Incident({
    required this.id,
    required this.refNumber,
    required this.type,
    required this.status,
    required this.occurredAt,
    required this.locationText,
    this.policeReportRef,
    this.lastObservation,
  });

  factory Incident.fromJson(Map<String, dynamic> j) => Incident(
        id: j['id'] as String,
        refNumber: (j['refNumber'] as String?) ?? '',
        type: (j['type'] as String?) ?? 'loss',
        status: (j['status'] as String?) ?? 'submitted',
        occurredAt: (j['occurredAt'] as String?) ?? '',
        locationText: (j['locationText'] as String?) ?? '',
        policeReportRef: j['policeReportRef'] as String?,
        lastObservation: j['lastObservation'] is Map
            ? Observation.fromJson(j['lastObservation'] as Map<String, dynamic>)
            : null,
      );

  bool get isOpen => status != 'closed' && status != 'draft';
}
