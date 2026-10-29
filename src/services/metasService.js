import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'metas'

export function observarMetas(uid, callback) {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}
export function criarMeta(uid, dados) { return addDoc(collection(db, COL), { ...dados, uid, criadoEm: serverTimestamp() }) }
export function atualizarMeta(id, dados) { return updateDoc(doc(db, COL, id), dados) }
export function excluirMeta(id) { return deleteDoc(doc(db, COL, id)) }
