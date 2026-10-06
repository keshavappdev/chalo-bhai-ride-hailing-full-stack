import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/services/api_service.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  List<dynamic> items = [];

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final response = await Get.find<ApiService>().get('/notifications');
    if (mounted) {
      setState(() => items = (response['notifications'] as List?) ?? []);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: RefreshIndicator(
        onRefresh: load,
        child: ListView.builder(
          itemCount: items.length,
          itemBuilder: (_, index) {
            final notification = items[index] as Map<String, dynamic>;
            return ListTile(
              leading: const CircleAvatar(child: Icon(Icons.notifications)),
              title: Text('${notification['title'] ?? ''}'),
              subtitle: Text('${notification['body'] ?? ''}'),
              trailing: notification['readAt'] == null ? const Icon(Icons.circle, size: 9) : null,
              onTap: () async {
                await Get.find<ApiService>().patch('/notifications/${notification['_id']}/read');
                await load();
              },
            );
          },
        ),
      ),
    );
  }
}
