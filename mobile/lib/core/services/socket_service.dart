import 'package:get/get.dart';import 'package:socket_io_client/socket_io_client.dart' as io;import '../config/app_config.dart';import 'storage_service.dart';
class SocketService extends GetxService {
  io.Socket? socket; final connected=false.obs; StorageService get storage=>Get.find();
  void connect(){final token=storage.token;if(token==null)return;disconnect();socket=io.io(AppConfig.socketUrl,io.OptionBuilder().setTransports(['websocket']).disableAutoConnect().setAuth({'token':token}).enableReconnection().setReconnectionAttempts(20).setReconnectionDelay(1000).build());socket!.onConnect((_){connected.value=true;});socket!.onDisconnect((_){connected.value=false;});socket!.connect();}
  void joinRide(String rideId)=>socket?.emit('ride:join',{'rideId':rideId});
  void emitDriverLocation(Map<String,dynamic> data)=>socket?.emit('driver:location',data);
  void on(String event,void Function(dynamic) handler)=>socket?.on(event,handler);
  void off(String event)=>socket?.off(event);
  void disconnect(){socket?.dispose();socket=null;connected.value=false;}
}
