import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/models/ride.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/location_service.dart';
import '../../../core/services/socket_service.dart';

class UserHomeController extends GetxController {
  ApiService get api => Get.find<ApiService>();
  LocationService get locationService => Get.find<LocationService>();
  SocketService get socket => Get.find<SocketService>();

  final current = Rxn<LatLng>();
  final destination = Rxn<RidePlace>();
  final activeRide = Rxn<Ride>();
  final loading = false.obs;
  final estimatedFare = 0.0.obs;
  final markers = <Marker>{}.obs;

  GoogleMapController? map;

  @override
  void onInit() {
    super.onInit();
    socket.on('ride:accepted', _rideEvent);
    socket.on('ride:state', _rideEvent);
    socket.on('ride:driver_location', _driverLocation);
    ever<bool>(socket.connected, (connected) {
      if (connected) loadActive();
    });
    init();
  }

  Future<void> init() async {
    try {
      final position = await locationService.current();
      current.value = LatLng(position.latitude, position.longitude);
      _refreshMarkers();
      await api.put('/users/location', data: {
        'lat': position.latitude,
        'lng': position.longitude,
      });
      await loadActive();
    } catch (error) {
      Get.snackbar('Location', error.toString());
    }
  }

  Future<void> loadActive() async {
    try {
      final response = await api.get('/rides/active');
      if (response['ride'] != null) {
        activeRide.value = Ride.fromJson(Map<String, dynamic>.from(response['ride'] as Map));
        socket.joinRide(activeRide.value!.id);
        _refreshMarkers();
      }
    } catch (_) {}
  }

  Future<void> searchDestination(String address) async {
    if (address.trim().isEmpty) return;
    try {
      loading.value = true;
      final locations = await locationFromAddress(address);
      if (locations.isEmpty) return;
      final location = locations.first;
      destination.value = RidePlace(
        address: address,
        lat: location.latitude,
        lng: location.longitude,
      );
      _refreshMarkers();
      await estimate();
      await map?.animateCamera(
        CameraUpdate.newLatLngZoom(LatLng(location.latitude, location.longitude), 14),
      );
    } catch (_) {
      Get.snackbar('Destination', 'Could not locate address');
    } finally {
      loading.value = false;
    }
  }

  Future<void> estimate() async {
    final pickup = current.value;
    final drop = destination.value;
    if (pickup == null || drop == null) return;

    final response = await api.post('/rides/estimate', data: {
      'pickup': {'lat': pickup.latitude, 'lng': pickup.longitude},
      'destination': {'lat': drop.lat, 'lng': drop.lng},
    });
    estimatedFare.value = (response['estimatedFare'] as num).toDouble();
  }

  Future<void> book() async {
    final pickup = current.value;
    final drop = destination.value;
    if (pickup == null || drop == null) return;

    try {
      loading.value = true;
      final placemarks = await placemarkFromCoordinates(pickup.latitude, pickup.longitude);
      final placemark = placemarks.isNotEmpty ? placemarks.first : null;
      final pickupAddress = placemark == null
          ? 'Current location'
          : '${placemark.name ?? ''} ${placemark.street ?? ''}, ${placemark.locality ?? ''}'.trim();

      final response = await api.post('/rides', data: {
        'pickup': {
          'address': pickupAddress,
          'lat': pickup.latitude,
          'lng': pickup.longitude,
        },
        'destination': drop.requestJson(),
        'requestedVehicleType': 'car',
        'paymentMethod': 'cash',
      });

      activeRide.value = Ride.fromJson(Map<String, dynamic>.from(response['ride'] as Map));
      socket.joinRide(activeRide.value!.id);
      _refreshMarkers();
    } catch (error) {
      Get.snackbar('Booking failed', error.toString());
    } finally {
      loading.value = false;
    }
  }

  Future<void> cancel() async {
    final ride = activeRide.value;
    if (ride == null) return;
    await api.post('/rides/${ride.id}/cancel', data: {'reason': 'Cancelled by user'});
    activeRide.value = null;
    _refreshMarkers();
  }

  void _rideEvent(dynamic data) {
    final payload = Map<String, dynamic>.from(data as Map);
    activeRide.value = Ride.fromJson(payload);
    if (['completed', 'cancelled'].contains(activeRide.value!.status)) {
      Future.delayed(const Duration(seconds: 2), () {
        activeRide.value = null;
        _refreshMarkers();
      });
    } else {
      socket.joinRide(activeRide.value!.id);
      _refreshMarkers();
    }
  }

  void _driverLocation(dynamic data) {
    if (activeRide.value == null) return;
    final payload = Map<String, dynamic>.from(data as Map);
    markers.removeWhere((marker) => marker.markerId.value == 'driver');
    markers.add(
      Marker(
        markerId: const MarkerId('driver'),
        position: LatLng(
          (payload['lat'] as num).toDouble(),
          (payload['lng'] as num).toDouble(),
        ),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        infoWindow: const InfoWindow(title: 'Driver'),
      ),
    );
    markers.refresh();
  }

  void _refreshMarkers() {
    final next = <Marker>{};

    if (current.value != null) {
      next.add(
        Marker(
          markerId: const MarkerId('pickup'),
          position: current.value!,
          infoWindow: const InfoWindow(title: 'Pickup'),
        ),
      );
    }

    final drop = destination.value;
    if (drop != null) {
      next.add(
        Marker(
          markerId: const MarkerId('destination'),
          position: LatLng(drop.lat, drop.lng),
          infoWindow: const InfoWindow(title: 'Destination'),
        ),
      );
    }

    final driver = activeRide.value?.driver;
    if (driver != null && driver['currentLocation'] is Map) {
      final location = Map<String, dynamic>.from(driver['currentLocation'] as Map);
      final coordinates = location['coordinates'];
      if (coordinates is List && coordinates.length >= 2) {
        next.add(
          Marker(
            markerId: const MarkerId('driver'),
            position: LatLng(
              (coordinates[1] as num).toDouble(),
              (coordinates[0] as num).toDouble(),
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
            infoWindow: const InfoWindow(title: 'Driver'),
          ),
        );
      }
    }

    markers.assignAll(next);
  }

  @override
  void onClose() {
    socket.off('ride:accepted');
    socket.off('ride:state');
    socket.off('ride:driver_location');
    super.onClose();
  }
}
