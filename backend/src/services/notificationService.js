import Notification from '../models/Notification.js';import User from '../models/User.js';import Driver from '../models/Driver.js';import { getIo } from '../sockets/ioStore.js';import { getFirebaseMessaging } from '../config/firebase.js';
export async function createNotification({ role, id, title, body, type='general', data={} }) {
  const doc = await Notification.create({ recipientRole: role, recipientId: id, title, body, type, data });
  try { getIo().to(`${role}:${id}`).emit('notification:new', doc.toObject()); } catch (_) {}
  try {const Model=role==='user'?User:role==='driver'?Driver:null;if(Model){const account=await Model.findById(id).select('fcmTokens').lean();const tokens=[...new Set(account?.fcmTokens||[])].filter(Boolean);const messaging=getFirebaseMessaging();if(messaging&&tokens.length){await messaging.sendEachForMulticast({tokens,notification:{title,body},data:Object.fromEntries(Object.entries({...data,type}).map(([k,v])=>[k,String(v)]))});}}}catch(e){console.warn('FCM send failed:',e.message);}
  return doc;
}
