import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/routes/app_routes.dart';
import '../controllers/auth_controller.dart';

class RolePage extends StatelessWidget {
  const RolePage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<AuthController>();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              const Icon(Icons.local_taxi, size: 72),
              const SizedBox(height: 20),
              Text(
                'Chalo Bhai',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 10),
              const Text('One app. Two experiences. Choose how you want to ride.'),
              const SizedBox(height: 32),
              Obx(
                () => SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'user', label: Text('User'), icon: Icon(Icons.person)),
                    ButtonSegment(value: 'driver', label: Text('Driver'), icon: Icon(Icons.drive_eta)),
                  ],
                  selected: {controller.selectedRole.value},
                  onSelectionChanged: (selection) => controller.selectedRole.value = selection.first,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Get.toNamed(AppRoutes.login),
                  child: const Text('Continue to Login'),
                ),
              ),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Get.toNamed(AppRoutes.register),
                  child: const Text('Create account'),
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
