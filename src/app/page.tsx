'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

export default function Home() {
  const [inputCode, setInputCode] = useState<string>('')
  const [outputCode, setOutputCode] = useState<string>('')
  const [message, setMessage] = useState<{ text: string; type: string }>({ text: '', type: '' })
  const outputRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const processActivationCode = (code: string): void => {
    if (!code.trim()) {
      setMessage({ text: 'Por favor, ingrese un código válido.', type: 'error' })
      return
    }

    let lcSerialNumber = code.replace(/-/g, '')

    // Paso 1: Desempaquetar caracteres
    let lcUnPacketSerialNumber = ''
    for (let i = 0; i < lcSerialNumber.length; i++) {
      const lcCar = lcSerialNumber.charAt(i)
      const charCode = lcCar.charCodeAt(0)
      if (charCode >= 65 && charCode <= 90) {
        lcUnPacketSerialNumber += (charCode - 20).toString().padStart(2, '0')
      } else {
        lcUnPacketSerialNumber += lcCar
      }
    }
    lcSerialNumber = lcUnPacketSerialNumber

    // Paso 2: Desempaquetar el Desplazamiento (rotar a la izquierda seis veces)
    const lnDX = 12
    for (let j = 0; j < 6; j++) {
      lcSerialNumber = lcSerialNumber.slice(-lnDX) + lcSerialNumber.slice(0, -lnDX)
    }

    // Paso 3: Quitar Número de Contrato
    let lcProductNumber = ''
    const lnLen = parseInt(lcSerialNumber.charAt(0), 10)
    lcSerialNumber = '*' + lcSerialNumber.slice(1)
    for (let i = 1; i <= lnLen; i++) {
      const index = (i + 1) * 3
      if (index < lcSerialNumber.length) {
        lcProductNumber += lcSerialNumber.charAt(index - 1)
        lcSerialNumber = lcSerialNumber.slice(0, index - 1) + '*' + lcSerialNumber.slice(index)
      }
    }
    lcSerialNumber = lcSerialNumber.replace(/\*/g, '')
    lcProductNumber = parseInt(lcProductNumber, 10).toString().padStart(10, '0')

    // Paso 4
    let lcActivationCode = lcSerialNumber
    const lnLen2 = lcProductNumber.slice(0, 10).replace(/^0+/, '').length

    lcActivationCode = lnLen2.toString() + lcActivationCode

    for (let i = 0; i < lnLen2; i++) {
      const lcCar = lcProductNumber.charAt((10 - lnLen2) + i)
      const index = (i * 3) + 5
      lcActivationCode = lcActivationCode.slice(0, index) + lcCar + lcActivationCode.slice(index)
    }

    // Paso 5: Poner al revés
    lcActivationCode = lcActivationCode.split('').reverse().join('')

    // Paso 6: Rotar por la izquierda cinco veces
    for (let j = 0; j < 6; j++) {
      lcActivationCode = lcActivationCode.slice(lnDX) + lcActivationCode.slice(0, lnDX)
    }

    // Paso 7: Empaquetar con caracteres
    let lcPacketActivationCode = ''
    for (let i = 0; i < lcActivationCode.length; i += 2) {
      const lcTwins = lcActivationCode.substring(i, i + 2)
      const numVal = parseInt(lcTwins, 10)
      if (numVal + 25 >= 65 && numVal + 25 <= 90) {
        lcPacketActivationCode += String.fromCharCode(numVal + 25)
      } else {
        lcPacketActivationCode += lcTwins
      }
    }
    lcActivationCode = lcPacketActivationCode

    // Paso 8: Colocar divisor cada seis caracteres
    let lcSeparatedActivationCode = lcActivationCode.slice(0, 6)
    for (let i = 6; i < lcActivationCode.length; i += 6) {
      lcSeparatedActivationCode += '-' + lcActivationCode.slice(i, i + 6)
    }
    lcActivationCode = lcSeparatedActivationCode

    setOutputCode(lcActivationCode)
    setMessage({ text: 'Código procesado con éxito.', type: 'success' })
  }

  const copyToClipboard = async (): Promise<void> => {
    if (!outputCode) return

    try {
      await navigator.clipboard.writeText(outputCode)
      setMessage({ text: 'Código copiado al portapapeles.', type: 'success' })
    } catch {
      setMessage({ text: 'Error al copiar el código.', type: 'error' })
    }
  }

  const sendWhatsApp = (): void => {
    if (!outputCode) return
    
    const message = encodeURIComponent(`Código de activación: ${outputCode}`)
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Código de Activación DOBRA</h1>
      <div className={styles.card}>
        <div className={styles.inputGroup}>
          <label htmlFor="input-code" className={styles.label}>Ingrese el código:</label>
          <input
            id="input-code"
            type="text"
            value={inputCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputCode(e.target.value)}
            placeholder="Ingrese el código"
            className={styles.input}
            aria-describedby="input-description"
          />
          <span id="input-description" className="sr-only">
            Ingrese el código de activación
          </span>
        </div>
        <button 
          onClick={() => processActivationCode(inputCode)}
          className={styles.button}
          aria-label="Generar código de activación"
        >
          Procesar Código
        </button>
        {outputCode && (
          <div className={styles.outputGroup}>
            <h2 className={styles.subtitle}>Código de salida:</h2>
            <p ref={outputRef} className={styles.output} aria-live="polite">{outputCode}</p>
            <div className={styles.buttonGroup}>
              <button onClick={copyToClipboard} className={styles.button} aria-label="Copiar Código">
                Copiar al portapapeles
              </button>
              <button onClick={sendWhatsApp} className={styles.button} aria-label="Enviar por WhatsApp">
                Enviar por WhatsApp
              </button>
            </div>
          </div>
        )}
        {message.text && (
          <p className={`${styles.message} ${styles[message.type]}`} role="alert">
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}