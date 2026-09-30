import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from './translations'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const { user } = useAuth()
  const [lang, setLangState] = useState(() => localStorage.getItem('olly_lang') || 'en')

  useEffect(() => {
    if (!user) return
    supabase.from('user_profiles').select('language').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.language) {
          setLangState(data.language)
          localStorage.setItem('olly_lang', data.language)
        }
      })
  }, [user])

  async function setLang(next) {
    setLangState(next)
    localStorage.setItem('olly_lang', next)
    if (user) {
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        language: next,
        updated_at: new Date().toISOString(),
      })
    }
  }

  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) return { lang: 'en', setLang: () => {}, t: (k) => translations.en[k] || k }
  return ctx
}
