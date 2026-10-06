import 'package:get/get.dart';import 'package:get_storage/get_storage.dart';
class StorageService extends GetxService { final box=GetStorage(); String? get token=>box.read('token'); String? get role=>box.read('role'); Future<void> saveSession(String token,String role)=>box.write('token',token).then((_)=>box.write('role',role)); Future<void> clear()=>box.erase(); }
