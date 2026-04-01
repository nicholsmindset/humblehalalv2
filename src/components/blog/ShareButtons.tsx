'use client'
import React from 'react'

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const encoded = encodeURIComponent(url)
  const titleEnc = encodeURIComponent(title)
  const [copied, setCopied] = React.useState(false)

  function copyLink() {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
      <span className="text-charcoal/50 text-sm font-medium">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${titleEnc}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-charcoal/50 hover:text-charcoal transition-colors"
        aria-label="Share on X / Twitter"
      >
        <span className="material-symbols-outlined text-xl">share</span>
      </a>
      <a
        href={`https://wa.me/?text=${titleEnc}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-charcoal/50 hover:text-charcoal transition-colors"
        aria-label="Share on WhatsApp"
      >
        <span className="material-symbols-outlined text-xl">chat</span>
      </a>
      <button
        onClick={copyLink}
        className="text-charcoal/50 hover:text-charcoal transition-colors text-sm flex items-center gap-1"
        aria-label="Copy link"
      >
        <span className="material-symbols-outlined text-xl">
          {copied ? 'check_circle' : 'link'}
        </span>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
