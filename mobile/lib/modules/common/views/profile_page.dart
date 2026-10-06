import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});
  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late final TextEditingController name;
  final make = TextEditingController();
  final model = TextEditingController();
  final color = TextEditingController();
  final plate = TextEditingController();
  String vehicleType = 'car';
  String? vehicleId;
  bool vehicleActive = true;
  bool loadingVehicle = false;

  String get role => Get.find<StorageService>().role ?? 'user';
  AuthController get auth => Get.find<AuthController>();
  ApiService get api => Get.find<ApiService>();

  @override
  void initState() {
    super.initState();
    name = TextEditingController(text: auth.account.value?.name ?? '');
    if (role == 'driver') _loadVehicle();
  }

  Future<void> _loadVehicle() async {
    setState(() => loadingVehicle = true);
    try {
      final r = await api.get('/vehicles/mine');
      final list = (r['vehicles'] as List?) ?? [];
      if (list.isNotEmpty) {
        final v = Map<String, dynamic>.from(list.first);
        vehicleId = '${v['_id']}';
        make.text = v['make'] ?? '';
        model.text = v['model'] ?? '';
        color.text = v['color'] ?? '';
        plate.text = v['plateNumber'] ?? '';
        vehicleType = v['type'] ?? 'car';
        vehicleActive = v['isActive'] != false;
      }
    } finally {
      if (mounted) setState(() => loadingVehicle = false);
    }
  }

  Future<void> _save() async {
    await api.patch(role == 'driver' ? '/drivers/me' : '/users/me', data: {'name': name.text.trim()});
    if (role == 'driver' && vehicleId != null) {
      await api.patch('/vehicles/$vehicleId', data: {
        'make': make.text.trim(),
        'model': model.text.trim(),
        'color': color.text.trim(),
        'type': vehicleType,
        'isActive': vehicleActive,
      });
    }
    Get.snackbar('Saved', 'Profile updated');
  }

  @override
  Widget build(BuildContext context) {
    final account = auth.account.value;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile & Settings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
          const SizedBox(height: 12),
          TextField(enabled: false, controller: TextEditingController(text: account?.email ?? ''), decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 12),
          TextField(enabled: false, controller: TextEditingController(text: account?.phone ?? ''), decoration: const InputDecoration(labelText: 'Phone')),
          if (role == 'driver') ...[
            const SizedBox(height: 20),
            Text('Driver verification: ${account?.verificationStatus ?? 'pending'}', style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),
            const Text('Vehicle details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            if (loadingVehicle)
              const Center(child: CircularProgressIndicator())
            else ...[
              TextField(controller: make, decoration: const InputDecoration(labelText: 'Make')),
              const SizedBox(height: 12),
              TextField(controller: model, decoration: const InputDecoration(labelText: 'Model')),
              const SizedBox(height: 12),
              TextField(controller: color, decoration: const InputDecoration(labelText: 'Color')),
              const SizedBox(height: 12),
              TextField(enabled: false, controller: plate, decoration: const InputDecoration(labelText: 'Plate number')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: vehicleType,
                items: ['bike', 'auto', 'car', 'suv'].map((v) => DropdownMenuItem(value: v, child: Text(v.toUpperCase()))).toList(),
                onChanged: (v) => setState(() => vehicleType = v ?? vehicleType),
                decoration: const InputDecoration(labelText: 'Vehicle type'),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Vehicle active'),
                value: vehicleActive,
                onChanged: (v) => setState(() => vehicleActive = v),
              ),
            ],
          ],
          const SizedBox(height: 18),
          FilledButton(onPressed: _save, child: const Text('Save profile')),
          const SizedBox(height: 20),
          OutlinedButton.icon(onPressed: auth.logout, icon: const Icon(Icons.logout), label: const Text('Logout')),
        ],
      ),
    );
  }
}
