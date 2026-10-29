import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'despesas'

export function observarDespesas(uid, callback) {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    arr.sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    callback(arr)
  })
}

export function criarDespesa(uid, dados) {
  return addDoc(collection(db, COL), { ...dados, uid, criadoEm: serverTimestamp() })
}
export function atualizarDespesa(id, dados) { return updateDoc(doc(db, COL, id), dados) }
export function excluirDespesa(id) { return deleteDoc(doc(db, COL, id)) }
