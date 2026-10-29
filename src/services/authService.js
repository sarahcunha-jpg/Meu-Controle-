import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

export async function cadastrarUsuario(nome, email, senha) {
  const cred = await createUserWithEmailAndPassword(auth, email, senha)
  await updateProfile(cred.user, { displayName: nome })
  await setDoc(doc(db, 'users', cred.user.uid), {
    nome, email, criadoEm: serverTimestamp()
  })
  return cred.user
}

export function login(email, senha) { return signInWithEmailAndPassword(auth, email, senha) }
export function logout() { return signOut(auth) }
export function recuperarSenha(email) { return sendPasswordResetEmail(auth, email) }
