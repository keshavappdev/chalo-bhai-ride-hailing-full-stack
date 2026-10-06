import 'dart:io';import 'package:geolocator/geolocator.dart';import 'package:get/get.dart';
class LocationService extends GetxService {
  Future<bool> ensurePermission() async {if(!await Geolocator.isLocationServiceEnabled())return false;var p=await Geolocator.checkPermission();if(p==LocationPermission.denied)p=await Geolocator.requestPermission();return p==LocationPermission.always||p==LocationPermission.whileInUse;}
  Future<Position> current() async {if(!await ensurePermission())throw Exception('Location permission/service unavailable');return Geolocator.getCurrentPosition(locationSettings:const LocationSettings(accuracy:LocationAccuracy.high));}
  Stream<Position> live(){
    LocationSettings settings=const LocationSettings(accuracy:LocationAccuracy.high,distanceFilter:10);
    if(Platform.isAndroid){settings=AndroidSettings(accuracy:LocationAccuracy.high,distanceFilter:10,intervalDuration:const Duration(seconds:5),foregroundNotificationConfig:const ForegroundNotificationConfig(notificationTitle:'Chalo Bhai driver location',notificationText:'Live location is active while you are online or on a ride.',enableWakeLock:true));}
    if(Platform.isIOS){settings=AppleSettings(accuracy:LocationAccuracy.bestForNavigation,distanceFilter:10,activityType:ActivityType.automotiveNavigation,pauseLocationUpdatesAutomatically:false,showBackgroundLocationIndicator:true,allowBackgroundLocationUpdates:true);}
    return Geolocator.getPositionStream(locationSettings:settings);
  }
}
