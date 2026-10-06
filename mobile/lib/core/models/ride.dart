class RidePlace {
  final String address;
  final double lat;
  final double lng;

  const RidePlace({
    required this.address,
    required this.lat,
    required this.lng,
  });

  factory RidePlace.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>?;
    final coordinates = (location?['coordinates'] as List?) ?? const [0, 0];
    return RidePlace(
      address: '${json['address'] ?? ''}',
      lat: (coordinates[1] as num).toDouble(),
      lng: (coordinates[0] as num).toDouble(),
    );
  }

  Map<String, dynamic> requestJson() => {
        'address': address,
        'lat': lat,
        'lng': lng,
      };
}

class Ride {
  final String id;
  final String status;
  final RidePlace pickup;
  final RidePlace destination;
  final double estimatedFare;
  final double? finalFare;
  final Map<String, dynamic>? driver;
  final Map<String, dynamic>? vehicle;
  final DateTime? createdAt;

  const Ride({
    required this.id,
    required this.status,
    required this.pickup,
    required this.destination,
    required this.estimatedFare,
    this.finalFare,
    this.driver,
    this.vehicle,
    this.createdAt,
  });

  factory Ride.fromJson(Map<String, dynamic> json) {
    final estimated = json['estimatedFare'] as num? ?? 0;
    final finalFareValue = json['finalFare'] as num?;
    final createdAtValue = json['createdAt'];

    return Ride(
      id: '${json['_id'] ?? json['id'] ?? ''}',
      status: '${json['status'] ?? 'searching'}',
      pickup: RidePlace.fromJson(Map<String, dynamic>.from(json['pickup'] as Map)),
      destination: RidePlace.fromJson(Map<String, dynamic>.from(json['destination'] as Map)),
      estimatedFare: estimated.toDouble(),
      finalFare: finalFareValue?.toDouble(),
      driver: json['driver'] is Map ? Map<String, dynamic>.from(json['driver'] as Map) : null,
      vehicle: json['vehicle'] is Map ? Map<String, dynamic>.from(json['vehicle'] as Map) : null,
      createdAt: createdAtValue is String ? DateTime.tryParse(createdAtValue) : null,
    );
  }
}
