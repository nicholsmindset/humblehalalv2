'use client'
import React from 'react'

interface Props {
  contactMethod: string
  contactValue: string
  itemTitle: string
}

export function ContactReveal({ contactMethod, contactValue, itemTitle }: Props) {
  const [revealed, setRevealed] = React.useState(false)

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">visibility</span>
        Reveal Contact Info
      </button>
    )
  }

  const msg = encodeURIComponent(`Hi, I saw your listing "${itemTitle}" on HumbleHalal. Is it still available?`)
  const method = contactMethod.toLowerCase()

  if (method === 'whatsapp') {
    const num = contactValue.replace(/\D/g, '')
    return (
      <a
        href={`https://wa.me/${num.startsWith('65') ? num : '65' + num}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-[#25D366] text-white font-bold py-3 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">chat</span>
        WhatsApp Seller
      </a>
    )
  }

  if (method === 'telegram') {
    const handle = contactValue.replace('@', '')
    return (
      <a
        href={`https://t.me/${handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-[#0088cc] text-white font-bold py-3 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">send</span>
        Message on Telegram
      </a>
    )
  }

  if (method === 'email') {
    return (
      <a
        href={`mailto:${contactValue}?subject=${encodeURIComponent(`Re: ${itemTitle} on HumbleHalal`)}`}
        className="w-full bg-charcoal text-white font-bold py-3 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">email</span>
        {contactValue}
      </a>
    )
  }

  // Phone or fallback — show number
  return (
    <div className="w-full bg-gray-100 text-charcoal font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-sm">call</span>
      {contactValue}
    </div>
  )
}
