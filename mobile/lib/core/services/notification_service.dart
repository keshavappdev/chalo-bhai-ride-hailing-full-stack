import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:get/get.dart';
import 'api_service.dart';
import 'socket_service.dart';

class NotificationService extends GetxService {
  StreamSubscription<String>? _refresh;
  StreamSubscription<RemoteMessage>? _foreground;
  bool _firebaseReady = false;

  Future<void> registerForPush() async {
    final socket = Get.find<SocketService>();
    socket.off('notification:new');
    socket.on('notification:new', (data) {
      final title = '${data['title'] ?? 'Notification'}';
      final body = '${data['body'] ?? ''}';
      Get.snackbar(title, body);
    });

    try {
      if (!_firebaseReady) {
        await Firebase.initializeApp();
        _firebaseReady = true;
      }
      await FirebaseMessaging.instance.requestPermission();
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await Get.find<ApiService>().post('/notifications/device-token', data: {'token': token});
      await _refresh?.cancel();
      _refresh = FirebaseMessaging.instance.onTokenRefresh.listen((t) {
        Get.find<ApiService>().post('/notifications/device-token', data: {'token': t});
      });
      await _foreground?.cancel();
      _foreground = FirebaseMessaging.onMessage.listen((m) {
        if (m.notification != null) Get.snackbar(m.notification!.title ?? 'Notification', m.notification!.body ?? '');
      });
    } catch (_) {
      // Firebase is optional until native FlutterFire config is added.
      // Socket.IO notifications remain functional without it.
    }
  }

  @override
  void onClose() {
    _refresh?.cancel();
    _foreground?.cancel();
    super.onClose();
  }
}
