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

  for (let i = 1; i <= compra.numParcelas; i++) {
    const parcelaRef = doc(collection(db, COL_PARCELAS))
    const dataVenc = new Date(dataBase)
    dataVenc.setMonth(dataVenc.getMonth() + (i - 1))
    
    let valorFinal = valorParcela
    if (i === compra.numParcelas) {
      const somaAnteriores = valorParcela * (compra.numParcelas - 1)
      valorFinal = Number((compra.valorTotal - somaAnteriores).toFixed(2))
    }

    batch.set(parcelaRef, {
      uid, compraId: compraRef.id, descricao: compra.descricao, cartaoId: compra.cartaoId,
      numero: i, totalParcelas: compra.numParcelas, valor: valorFinal,
      dataVencimento: dataVenc.toISOString().slice(0, 10), status: 'pendente'
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

// NOVA FUNÇÃO: Marcar todas as parcelas de uma compra como pagas/pendentes
export async function marcarCompraPaga(compraId, pago) {
  const batch = writeBatch(db)
  batch.update(doc(db, COL_COMPRAS, compraId), { pago })
  
  const q = query(collection(db, COL_PARCELAS), where('compraId', '==', compraId))
  const snap = await getDocs(q)
  
  snap.forEach(d => {
    batch.update(doc(db, COL_PARCELAS, d.id), { status: pago ? 'paga' : 'pendente' })
  })
  await batch.commit()
}

// NOVA FUNÇÃO: Marcar uma parcela específica como paga
export function marcarParcelaPaga(id, status) {
  return updateDoc(doc(db, COL_PARCELAS, id), { status })
}
