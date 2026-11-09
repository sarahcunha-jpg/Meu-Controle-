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

export function criarRecorrente(uid, dados) { 
  return addDoc(collection(db, COL), { ...dados, uid, criadoEm: serverTimestamp() }) 
}

export function atualizarRecorrente(id, dados) { 
  return updateDoc(doc(db, COL, id), dados) 
}

export function excluirRecorrente(id) { 
  return deleteDoc(doc(db, COL, id)) 
}

// Função corrigida para pular/desfazer o pulo
export async function alternarPuloMes(uid, recorrenteId, ano, mes, isPulada) {
  const docId = `${uid}_${recorrenteId}_${Number(ano)}_${Number(mes)}`
  const docRef = doc(db, COL_PULADAS, docId)
  
  try {
    if (isPulada) {
      // Para deletar, o Firestore exige que a regra verifique resource.data.uid
      await deleteDoc(docRef)
    } else {
      // Para criar, o documento precisa conter o campo 'uid'
      await setDoc(docRef, {
        uid: uid, 
        recorrenteId: recorrenteId, 
        ano: Number(ano), 
        mes: Number(mes)
      })
    }
  } catch (error) {
    console.error("ERRO NO FIRESTORE:", error)
    alert(`Erro ao alterar status: ${error.code || error.message}`)
  }
}
