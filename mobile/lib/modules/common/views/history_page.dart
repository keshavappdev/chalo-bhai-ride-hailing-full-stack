import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/models/ride.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  List<Ride> rides = [];
  Map<String, dynamic>? earnings;
  bool loading = true;

  String get role => Get.find<StorageService>().role ?? 'user';

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final api = Get.find<ApiService>();
    final response = await api.get(role == 'driver' ? '/drivers/rides' : '/users/rides');
    rides = ((response['rides'] as List?) ?? [])
        .map((e) => Ride.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();

    if (role == 'driver') {
      earnings = await api.get('/drivers/earnings');
    }

    if (mounted) setState(() => loading = false);
  }

  Future<void> rate(Ride ride) async {
    double stars = 5;
    final reviewController = TextEditingController();

    final shouldSubmit = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(role == 'driver' ? 'Rate rider' : 'Rate driver'),
        content: StatefulBuilder(
          builder: (_, setLocalState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Slider(
                value: stars,
                min: 1,
                max: 5,
                divisions: 4,
                label: stars.round().toString(),
                onChanged: (value) => setLocalState(() => stars = value),
              ),
              TextField(
                controller: reviewController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Review (optional)'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );

    if (shouldSubmit == true) {
      try {
        await Get.find<ApiService>().post(
          '/ratings/ride/${ride.id}',
          data: {'rating': stars.round(), 'review': reviewController.text},
        );
        Get.snackbar('Thanks', 'Rating submitted');
      } catch (error) {
        Get.snackbar('Rating', error.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('History')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final summary = earnings?['summary'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(title: const Text('History')),
      body: RefreshIndicator(
        onRefresh: load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (summary != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Net earnings: ₹${summary['total'] ?? 0} • Gross: ₹${summary['gross'] ?? 0} • ${summary['rides'] ?? 0} rides',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
            ...rides.map(
              (ride) => Card(
                child: ListTile(
                  title: Text(
                    '${ride.pickup.address} → ${ride.destination.address}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(ride.status.replaceAll('_', ' ')),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('₹${(ride.finalFare ?? ride.estimatedFare).toStringAsFixed(0)}'),
                      if (ride.status == 'completed')
                        TextButton(
                          onPressed: () => rate(ride),
                          child: const Text('Rate'),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
