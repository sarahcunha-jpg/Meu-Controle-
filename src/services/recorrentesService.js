import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'contas_recorrentes'
const COL_STATUS = 'status_recorrentes'

export function observarRecorrentes(uid, callback) {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function observarStatus(uid, callback) {
  const q = query(collection(db, COL_STATUS), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function criarRecorrente(uid, dados) { 
  return addDoc(collection(db, COL), { ...dados, uid, criadoEm: serverTimestamp() }) 
}

export function excluirRecorrente(id) { 
  return deleteDoc(doc(db, COL, id)) 
}

// Função para mudar o status ('paga', 'pulada' ou 'pendente' para desfazer)
export async function mudarStatusRecorrente(uid, recorrenteId, ano, mes, novoStatus) {
  const docId = `${uid}_${recorrenteId}_${Number(ano)}_${Number(mes)}`
  const docRef = doc(db, COL_STATUS, docId)
  
  try {
    if (novoStatus === 'pendente') {
      await deleteDoc(docRef)
    } else {
      await setDoc(docRef, {
        uid, 
        recorrenteId, 
        ano: Number(ano), 
        mes: Number(mes),
        status: novoStatus
      })
    }
  } catch (error) {
    console.error("ERRO NO FIRESTORE:", error)
    alert(`Erro ao alterar status: ${error.message}`)
  }
}
