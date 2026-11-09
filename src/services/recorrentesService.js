import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'contas_recorrentes'
const COL_PULADAS = 'recorrentes_puladas'

export function observarRecorrentes(uid, callback) {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function observarPuladas(uid, callback) {
  const q = query(collection(db, COL_PULADAS), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function criarRecorrente(uid, dados) { return addDoc(collection(db, COL), { ...dados, uid, criadoEm: serverTimestamp() }) }
export function atualizarRecorrente(id, dados) { return updateDoc(doc(db, COL, id), dados) }
export function excluirRecorrente(id) { return deleteDoc(doc(db, COL, id)) }

// CORRIGIDO: Usando setDoc para garantir o ID fixo
export function alternarPuloMes(uid, recorrenteId, ano, mes, isPulada) {
  const docId = `${uid}_${recorrenteId}_${ano}_${mes}`
  const docRef = doc(db, COL_PULADAS, docId)
  
  if (isPulada) {
    return deleteDoc(docRef)
  } else {
    return setDoc(docRef, {
      uid, recorrenteId, ano, mes
    })
  }
}
