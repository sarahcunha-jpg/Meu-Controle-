import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'contas_recorrentes'

export function observarRecorrentes(uid, callback) {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}
export function criarRecorrente(uid, dados) { return addDoc(collection(db, COL), { ...dados, uid, criadoEm: serverTimestamp() }) }
export function atualizarRecorrente(id, dados) { return updateDoc(doc(db, COL, id), dados) }
export function excluirRecorrente(id) { return deleteDoc(doc(db, COL, id)) }
