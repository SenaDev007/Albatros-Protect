// Agent Albatros — configuration centrale
// Le baseUrl pointe vers l'API du pilote (le backend web Next.js en développement,
// ou le serveur de production derrière HTTPS).
import 'package:flutter/material.dart';

/// En émulateur Android, 10.0.2.2 = localhost de la machine hôte.
/// En production : https://api.agentalbatros.bj (à définir après hébergement).
const String kApiBaseUrl = String.fromEnvironment(
  'ALBATROS_API_URL',
  defaultValue: 'http://10.0.2.2:3000/api/v1',
);

/// Palette de marque — Noir / Rouge (identique au portail web)
const Color kAlbatrosRed = Color(0xFFE11D2E);
const Color kAlbatrosBlack = Color(0xFF0A0A0C);
const Color kAlbatrosCard = Color(0xFF121215);
const Color kAlbatrosBorder = Color(0xFF232329);
const Color kAlbatrosText = Color(0xFFF4F4F5);
const Color kAlbatrosMuted = Color(0xFFA1A1AA);

/// Sources d'observation (§4.1 CDC — transparence obligatoire)
const Map<String, ({String label, Color color, String description})> kSources = {
  'native_location': (
    label: "Position de l'appareil",
    color: Color(0xFFE11D2E),
    description: 'Position transmise par l’application via les API autorisées du système.',
  ),
  'google_geolocation': (
    label: 'Estimation Wi-Fi/cellulaire (Google)',
    color: Color(0xFFF59E0B),
    description: 'Estimation avec rayon d’incertitude fourni par Google Maps Platform Geolocation API.',
  ),
  'ble_witness': (
    label: 'Détection Bluetooth (téléphone participant)',
    color: Color(0xFF8B5CF6),
    description: 'Position du téléphone détecteur — pas un GPS de l’appareil recherché.',
  ),
  'operator_authorized': (
    label: 'Position communiquée par un partenaire',
    color: Color(0xFF14B8A6),
    description: 'Zone communiquée dans le cadre légal autorisé, sous convention active.',
  ),
};

/// Statuts d'incident (F-065)
const Map<String, String> kIncidentStatuses = {
  'draft': 'Brouillon',
  'submitted': 'Soumis',
  'verification_required': 'Vérification requise',
  'ready_to_transmit': 'Prêt à transmettre',
  'transmitted': 'Transmis au partenaire',
  'processing': 'En traitement',
  'response_received': 'Réponse reçue',
  'closed': 'Clôturé',
  'disputed': 'Contesté',
};
