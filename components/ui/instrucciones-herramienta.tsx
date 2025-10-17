'use client'

interface InstruccionesHerramientaProps {
  visible: boolean
  texto: string
}

export default function InstruccionesHerramienta({
  visible,
  texto
}: InstruccionesHerramientaProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 70, // Debajo del header (50px altura + 20px gap)
        right: 20,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px 0 rgba(23,34,59,0.08)',
        zIndex: 9998,
        padding: '12px 16px',
        border: '1px solid rgba(239, 233, 211, 0.7)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        transform: visible ? 'translateY(0)' : 'translateY(-10px)',
        maxWidth: 350,
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-etiqueta)',
          fontSize: 'var(--font-etiqueta-size)',
          color: 'var(--color-oscuro)',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {texto}
      </p>
    </div>
  )
}

