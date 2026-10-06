import 'dart:async';

import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/models/ride.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/location_service.dart';
import '../../../core/services/socket_service.dart';
import '../../auth/controllers/auth_controller.dart';

class DriverHomeController extends GetxController {
  ApiService get api => Get.find<ApiService>();
  LocationService get locationService => Get.find<LocationService>();
  SocketService get socket => Get.find<SocketService>();

  final online = false.obs;
  final activeRide = Rxn<Ride>();
  final incomingRide = Rxn<Ride>();
  final loading = false.obs;

  StreamSubscription? _locationSubscription;

  @override
  void onInit() {
    super.onInit();
    socket.on('ride:request', _request);
    socket.on('ride:state', _state);
    socket.on('driver:verification', _verification);
    ever<bool>(socket.connected, (connected) {
      if (connected) loadActive();
    });
    loadActive();
  }

  Future<void> loadActive() async {
    try {
      final response = await api.get('/rides/active');
      if (response['ride'] != null) {
        activeRide.value = Ride.fromJson(Map<String, dynamic>.from(response['ride'] as Map));
        socket.joinRide(activeRide.value!.id);
        _startLocation();
      }
    } catch (_) {}
  }

  Future<void> toggle(bool value) async {
    try {
      loading.value = true;
      final position = await locationService.current();
      await api.post('/drivers/online', data: {
        'isOnline': value,
        'lat': position.latitude,
        'lng': position.longitude,
      });
      online.value = value;

      if (value) {
        _startLocation();
      } else if (activeRide.value == null) {
        await _locationSubscription?.cancel();
      }
    } catch (error) {
      Get.snackbar('Availability', error.toString());
    } finally {
      loading.value = false;
    }
  }

  void _startLocation() {
    _locationSubscription?.cancel();
    _locationSubscription = locationService.live().listen((position) {
      socket.emitDriverLocation({
        'lat': position.latitude,
        'lng': position.longitude,
        'heading': position.heading,
        'speed': position.speed,
        'accuracy': position.accuracy,
        'rideId': activeRide.value?.id,
      });
    });
  }

  void _request(dynamic data) {
    final payload = Map<String, dynamic>.from(data as Map);
    final ridePayload = payload['ride'] is Map
        ? Map<String, dynamic>.from(payload['ride'] as Map)
        : payload;
    incomingRide.value = Ride.fromJson(ridePayload);
  }

  Future<void> acceptIncoming() async {
    final ride = incomingRide.value;
    if (ride == null) return;

    try {
      final response = await api.post('/rides/${ride.id}/accept');
      activeRide.value = Ride.fromJson(Map<String, dynamic>.from(response['ride'] as Map));
      incomingRide.value = null;
      socket.joinRide(activeRide.value!.id);
      _startLocation();
    } catch (error) {
      Get.snackbar('Ride', error.toString());
      incomingRide.value = null;
    }
  }

  Future<void> rejectIncoming() async {
    final ride = incomingRide.value;
    if (ride != null) await api.post('/rides/${ride.id}/reject');
    incomingRide.value = null;
  }

  Future<void> nextStatus(String status) async {
    final ride = activeRide.value;
    if (ride == null) return;

    final response = await api.patch('/rides/${ride.id}/status', data: {'status': status});
    activeRide.value = Ride.fromJson(Map<String, dynamic>.from(response['ride'] as Map));

    if (['completed', 'cancelled'].contains(activeRide.value!.status)) {
      activeRide.value = null;
      if (!online.value) await _locationSubscription?.cancel();
    }
  }

  Future<void> navigateToPickup() async {
    final ride = activeRide.value;
    if (ride == null) return;
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=${ride.pickup.lat},${ride.pickup.lng}&travelmode=driving',
    );
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      Get.snackbar('Navigation', 'Could not open maps');
    }
  }

  Future<void> cancelRide() async {
    final ride = activeRide.value;
    if (ride == null) return;
    await api.post('/rides/${ride.id}/cancel', data: {'reason': 'Cancelled by driver'});
    activeRide.value = null;
    if (!online.value) await _locationSubscription?.cancel();
  }

  void _verification(dynamic data) {
    final payload = Map<String, dynamic>.from(data as Map);
    final status = '${payload['status'] ?? 'pending'}';
    if (status != 'approved') {
      online.value = false;
      if (activeRide.value == null) _locationSubscription?.cancel();
    }
    Get.find<AuthController>().refreshMe();
    Get.snackbar('Driver verification', 'Status: $status');
  }

  void _state(dynamic data) {
    activeRide.value = Ride.fromJson(Map<String, dynamic>.from(data as Map));
    if (['completed', 'cancelled'].contains(activeRide.value!.status)) {
      activeRide.value = null;
      if (!online.value) _locationSubscription?.cancel();
    }
  }

  String? get actionLabel => switch (activeRide.value?.status) {
        'accepted' => 'On the way',
        'driver_arriving' => 'Arrived at pickup',
        'arrived' => 'Start ride',
        'in_progress' => 'Complete ride',
        _ => null,
      };

  String? get nextStatusValue => switch (activeRide.value?.status) {
        'accepted' => 'driver_arriving',
        'driver_arriving' => 'arrived',
        'arrived' => 'in_progress',
        'in_progress' => 'completed',
        _ => null,
      };

  @override
  void onClose() {
    _locationSubscription?.cancel();
    socket.off('ride:request');
    socket.off('ride:state');
    socket.off('driver:verification');
    super.onClose();
  }
}
