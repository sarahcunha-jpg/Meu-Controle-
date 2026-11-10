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
  
  const diaCompra = dataBase.getDate()
  const diaFechamento = Number(compra.diaFechamento) || 5
  const diaVenc = Number(compra.diaVencimento) || 10

  // 1. Descobre o mês de fechamento da fatura
  let mesBase = dataBase.getMonth()
  let anoBase = dataBase.getFullYear()

  if (diaCompra > diaFechamento) {
    mesBase += 1
    if (mesBase > 11) { mesBase = 0; anoBase += 1 }
  }

  // 2. Descobre o mês do primeiro vencimento
  let mesVenc = mesBase
  let anoVenc = anoBase

  // Se o vencimento for antes do fechamento, a fatura vence no mês seguinte
  if (diaVenc < diaFechamento) {
    mesVenc += 1
    if (mesVenc > 11) { mesVenc = 0; anoVenc += 1 }
  }

  // 3. Cria as parcelas com as datas corretas
  for (let i = 0; i < compra.numParcelas; i++) {
    const parcelaRef = doc(collection(db, COL_PARCELAS))
    
    // Avança os meses para as parcelas subsequentes
    let m = mesVenc + i
    let a = anoVenc + Math.floor(m / 12)
    let mesFinal = m % 12
    
    const ultimoDiaMes = new Date(a, mesFinal + 1, 0).getDate()
    const diaFinal = Math.min(diaVenc, ultimoDiaMes)
    
    const dataFormatada = `${a}-${String(mesFinal + 1).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`

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
