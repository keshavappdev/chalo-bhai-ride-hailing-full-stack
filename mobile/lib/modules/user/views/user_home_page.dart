import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/models/ride.dart';
import '../../../core/routes/app_routes.dart';
import '../controllers/user_home_controller.dart';

class UserHomePage extends StatefulWidget {
  const UserHomePage({super.key});

  @override
  State<UserHomePage> createState() => _UserHomePageState();
}

class _UserHomePageState extends State<UserHomePage> {
  final destinationController = TextEditingController();
  late final UserHomeController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.put(UserHomeController());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: _drawer(),
      body: Obx(
        () => Stack(
          children: [
            GoogleMap(
              initialCameraPosition: CameraPosition(
                target: controller.current.value ?? const LatLng(23.2599, 77.4126),
                zoom: 14,
              ),
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
              markers: controller.markers.toSet(),
              onMapCreated: (mapController) => controller.map = mapController,
              onTap: (position) {
                controller.destination.value = RidePlace(
                  address: 'Dropped pin',
                  lat: position.latitude,
                  lng: position.longitude,
                );
                controller.estimate();
              },
            ),
            SafeArea(
              child: Align(
                alignment: Alignment.topCenter,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Material(
                    elevation: 2,
                    borderRadius: BorderRadius.circular(16),
                    child: TextField(
                      controller: destinationController,
                      onSubmitted: controller.searchDestination,
                      decoration: InputDecoration(
                        prefixIcon: Builder(
                          builder: (menuContext) => IconButton(
                            icon: const Icon(Icons.menu),
                            onPressed: () => Scaffold.of(menuContext).openDrawer(),
                          ),
                        ),
                        hintText: 'Where to?',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.search),
                          onPressed: () => controller.searchDestination(destinationController.text),
                        ),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: _bottomCard(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bottomCard() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Obx(() {
            final ride = controller.activeRide.value;
            if (ride != null) {
              final driver = ride.driver;
              final vehicle = ride.vehicle;
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ride ${ride.status.replaceAll('_', ' ')}',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text('To: ${ride.destination.address}'),
                  if (driver != null) ...[
                    Text('Driver: ${driver['name'] ?? ''}'),
                    Text('Rating: ${driver['ratingAverage'] ?? 0}'),
                    if (vehicle != null) Text('Vehicle: ${vehicle['make'] ?? ''} ${vehicle['model'] ?? ''} • ${vehicle['plateNumber'] ?? ''}'),
                  ],
                  Text('Estimated fare: ₹${ride.estimatedFare.toStringAsFixed(0)}'),
                  if (ride.finalFare != null) Text('Final fare: ₹${ride.finalFare!.toStringAsFixed(0)}'),
                  const SizedBox(height: 10),
                  if (!['in_progress', 'completed', 'cancelled'].contains(ride.status))
                    OutlinedButton(
                      onPressed: controller.cancel,
                      child: const Text('Cancel ride'),
                    ),
                ],
              );
            }

            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  controller.destination.value == null ? 'Choose a destination' : controller.destination.value!.address,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (controller.estimatedFare.value > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text('Estimated fare ₹${controller.estimatedFare.value.toStringAsFixed(0)}'),
                  ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: controller.destination.value == null || controller.loading.value ? null : controller.book,
                    child: Text(controller.loading.value ? 'Please wait...' : 'Book ride'),
                  ),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }

  Drawer _drawer() {
    return Drawer(
      child: SafeArea(
        child: ListView(
          children: [
            const ListTile(
              title: Text('Chalo Bhai', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('User Menu'),
            ),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Ride history'),
              onTap: () => Get.toNamed(AppRoutes.history),
            ),
            ListTile(
              leading: const Icon(Icons.notifications),
              title: const Text('Notifications'),
              onTap: () => Get.toNamed(AppRoutes.notifications),
            ),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Profile & settings'),
              onTap: () => Get.toNamed(AppRoutes.profile),
            ),
          ],
        ),
      ),
    );
  }
}
