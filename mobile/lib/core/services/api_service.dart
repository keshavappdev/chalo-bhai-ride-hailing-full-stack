import 'package:dio/dio.dart';import 'package:get/get.dart';import '../config/app_config.dart';import 'storage_service.dart';
class ApiService extends GetxService {
  late final Dio dio; StorageService get storage=>Get.find();
  Future<ApiService> init() async {dio=Dio(BaseOptions(baseUrl:AppConfig.apiBaseUrl,connectTimeout:const Duration(seconds:15),receiveTimeout:const Duration(seconds:20),headers:{'Content-Type':'application/json'}));dio.interceptors.add(InterceptorsWrapper(onRequest:(o,h){final t=storage.token;if(t!=null)o.headers['Authorization']='Bearer $t';h.next(o);},onError:(e,h){h.next(e);}));return this;}
  Future<Map<String,dynamic>> get(String p,{Map<String,dynamic>? query}) async=>Map<String,dynamic>.from((await dio.get(p,queryParameters:query)).data);
  Future<Map<String,dynamic>> post(String p,{dynamic data}) async=>Map<String,dynamic>.from((await dio.post(p,data:data)).data);
  Future<Map<String,dynamic>> patch(String p,{dynamic data}) async=>Map<String,dynamic>.from((await dio.patch(p,data:data)).data);
  Future<Map<String,dynamic>> put(String p,{dynamic data}) async=>Map<String,dynamic>.from((await dio.put(p,data:data)).data);
}
