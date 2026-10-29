import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, where, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'receitas'

export function observarReceitas(uid, callback) {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    arr.sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    callback(arr)
  })
}

export function criarReceita(uid, dados) {
  return addDoc(collection(db, COL), { ...dados, uid, criadoEm: serverTimestamp() })
}
export function atualizarReceita(id, dados) { return updateDoc(doc(db, COL, id), dados) }
export function excluirReceita(id) { return deleteDoc(doc(db, COL, id)) }
