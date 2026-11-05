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
  const diaVenc = compra.diaVencimento || 10 // Dia do vencimento do cartão

  for (let i = 1; i <= compra.numParcelas; i++) {
    const parcelaRef = doc(collection(db, COL_PARCELAS))
    
    // Lógica de vencimento: Sempre joga para o mês seguinte (ou subsequente) e aplica o dia do cartão
    const mesVenc = dataBase.getMonth() + i 
    const anoVenc = dataBase.getFullYear() + Math.floor(mesVenc / 12)
    const mesFinal = mesVenc % 12
    
    // Evita erro em meses que não têm dia 30 ou 31 (ex: Fevereiro)
    const ultimoDiaMes = new Date(anoVenc, mesFinal + 1, 0).getDate()
    const diaFinal = Math.min(diaVenc, ultimoDiaMes)
    
    const dataFormatada = `${anoVenc}-${String(mesFinal + 1).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`

    let valorFinal = valorParcela
    if (i === compra.numParcelas) {
      const somaAnteriores = valorParcela * (compra.numParcelas - 1)
      valorFinal = Number((compra.valorTotal - somaAnteriores).toFixed(2))
    }

    batch.set(parcelaRef, {
      uid, 
      compraId: compraRef.id, 
      descricao: compra.descricao, 
      cartaoId: compra.cartaoId,
      numero: i, 
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
