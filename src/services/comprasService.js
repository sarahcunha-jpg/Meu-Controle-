import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  writeBatch, 
  doc, 
  getDocs 
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL_COMPRAS = 'compras'
const COL_PARCELAS = 'parcelas'

export function observarCompras(uid, callback) {
  const q = query(collection(db, COL_COMPRAS), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    arr.sort((a, b) => (b.data || '').localeCompare(a.data || ''))
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
  batch.set(compraRef, { ...compra, uid, criadoEm: serverTimestamp() })

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
      uid,
      compraId: compraRef.id,
      descricao: compra.descricao,
      cartaoId: compra.cartaoId,
      numero: i,
      totalParcelas: compra.numParcelas,
      valor: valorFinal,
      dataVencimento: dataVenc.toISOString().slice(0, 10),
      status: 'pendente'
    })
  }

  await batch.commit()
}

// Exclusão em cascata corrigida
export async function excluirCompra(uid, id) {
  try {
    // Busca as parcelas que pertencem a esta compra E a este usuário
    const q = query(
      collection(db, COL_PARCELAS), 
      where('compraId', '==', id),
      where('uid', '==', uid) 
    )
    const snap = await getDocs(q)
    
    const batch = writeBatch(db)
    
    // Adiciona a compra principal para ser deletada
    batch.delete(doc(db, COL_COMPRAS, id))
    
    // Adiciona cada parcela encontrada para ser deletada
    snap.forEach((documento) => {
      batch.delete(doc(db, COL_PARCELAS, documento.id))
    })
    
    await batch.commit()
    console.log("Compra e parcelas excluídas com sucesso.")
  } catch (error) {
    console.error("ERRO DETALHADO NO FIREBASE:", error)
    alert(`Erro ao excluir: ${error.code || error.message}`)
  }
}