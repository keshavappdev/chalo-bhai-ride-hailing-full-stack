class Account {
  final String id, name, email, role;
  final String? phone, verificationStatus;
  const Account({required this.id,required this.name,required this.email,required this.role,this.phone,this.verificationStatus});
  factory Account.fromJson(Map<String,dynamic> j)=>Account(id:'${j['id']??j['_id']}',name:j['name']??'',email:j['email']??'',role:j['role']??'',phone:j['phone'],verificationStatus:j['verificationStatus']);
}
