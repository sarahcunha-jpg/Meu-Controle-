import { collection, addDoc, query, where, onSnapshot, serverTimestamp, writeBatch, doc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const COL_COMPRAS = 'compras'
const COL_PARCELAS = 'parcelas'

export function observarCompras(uid, callback) {
  const q = query(collection(db, COL_COMPRAS), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    arr.sort((a, b) => (b.dataCompra || '').localeCompare(a.dataCompra || ''))
    callback(arr)
  })
}

export function observarParcelas(uid, callback) {
  const q = query(collection(db, COL_PARCELAS), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function criarCompraParcelada(uid, compra) {
  const batch = writeBatch(db)
  const compraRef = doc(collection(db, COL_COMPRAS))
  batch.set(compraRef, { ...compra, uid, pago: false, criadoEm: serverTimestamp() })

  const valorParcela = Number((compra.valorTotal / compra.numParcelas).toFixed(2))
  const dataBase = new Date(compra.dataCompra + 'T12:00:00')
  
  const diaVenc = Number(compra.diaVencimento) || 10 
  const diaFechamento = Number(compra.diaFechamento) || 5
  
  // LÓGICA CORRIGIDA: Se comprou depois do fechamento, cai no mês seguinte. Se antes, cai no mesmo mês.
  let mesPrimeiraParcela = dataBase.getMonth()
  if (dataBase.getDate() > diaFechamento) {
    mesPrimeiraParcela += 1
  }

  for (let i = 0; i < compra.numParcelas; i++) {
    const parcelaRef = doc(collection(db, COL_PARCELAS))
    
    // Calcula o mês correto somando as parcelas
    const mesVenc = mesPrimeiraParcela + i
    const anoVenc = dataBase.getFullYear() + Math.floor(mesVenc / 12)
    const mesFinal = mesVenc % 12
    
    const ultimoDiaMes = new Date(anoVenc, mesFinal + 1, 0).getDate()
    const diaFinal = Math.min(diaVenc, ultimoDiaMes)
    
    const dataFormatada = `${anoVenc}-${String(mesFinal + 1).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`

    let valorFinal = valorParcela
    if (i === compra.numParcelas - 1) {
      const somaAnteriores = valorParcela * (compra.numParcelas - 1)
      valorFinal = Number((compra.valorTotal - somaAnteriores).toFixed(2))
    }

    batch.set(parcelaRef, {
      uid, 
      compraId: compraRef.id, 
      descricao: compra.descricao, 
      cartaoId: compra.cartaoId,
      numero: i + 1, 
      totalParcelas: compra.numParcelas, 
      valor: valorFinal,
      dataVencimento: dataFormatada, 
      status: 'pendente'
    })
  }
  await batch.commit()
}

export async function excluirCompra(uid, id) {
  try {
    const q = query(collection(db, COL_PARCELAS), where('compraId', '==', id), where('uid', '==', uid))
    const snap = await getDocs(q)
    const batch = writeBatch(db)
    batch.delete(doc(db, COL_COMPRAS, id))
    snap.forEach((documento) => { batch.delete(doc(db, COL_PARCELAS, documento.id)) })
    await batch.commit()
  } catch (error) {
    alert(`Erro ao excluir: ${error.message}`)
  }
}

export function marcarParcelaPaga(id, status) {
  return updateDoc(doc(db, COL_PARCELAS, id), { status })
}
