import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, increment } from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'cofrinho_contas'

export function observarContasGuardadas(uid, callback) {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    arr.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    callback(arr)
  })
}

export function criarContaCofrinho(uid, dados) {
  return addDoc(collection(db, COL), { 
    ...dados, 
    valorGuardado: 0,
    criadoEm: serverTimestamp() 
  })
}

// Depositar ou Retirar. Aceita valores negativos para retirada.
export function alterarValorCofrinho(id, valor) {
  return updateDoc(doc(db, COL, id), {
    valorGuardado: increment(Number(valor))
  })
}

export function excluirContaCofrinho(id) {
  return deleteDoc(doc(db, COL, id))
}
