'use client'

import { useState } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
import { IconCircleButtonLight } from './icon-circle-button'
import IconoGuardado from '@/components/icons/Icono-Guardado.svg'
import IconoIzquierda from '@/components/icons/Icono-Izquierda.svg'
import IconoDerecha from '@/components/icons/Icono-Derecha.svg'
import IconoCamara from '@/components/icons/Icono-Camara.svg'
import IconoBasura from '@/components/icons/Icono-Basura.svg'
import IconoCerrar from '@/components/icons/Icono-Cerrar.svg'
import IconoOjoVisible from '@/components/icons/Icono-OjoVisible.svg'
import IconoCompartir from '@/components/icons/Icono-Compartir.svg'
import IconoMensajes from '@/components/icons/Icono-Mensajes.svg'

interface HeaderProps {
  sceneName?: string
  credits?: string
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onRender?: () => void
  onDelete?: () => void
  onClose?: () => void
  onLayers?: () => void
  onShare?: () => void
  onHelp?: () => void
}

export default function Header({
  sceneName = 'Escena de prueba',
  credits = '200/200',
  onSave,
  onUndo,
  onRedo,
  onRender,
  onDelete,
  onClose,
  onLayers,
  onShare,
  onHelp
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitleValue, setEditingTitleValue] = useState(sceneName)
  return (
    <TooltipProvider>
      <header
        data-header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 50,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(239, 233, 211, 0.7)',
          boxShadow: '0 2px 8px 0 rgba(23,34,59,0.08)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 16,
          paddingRight: 10,
          boxSizing: 'border-box',
        }}
      >
        {/* Sección izquierda: Nombre, créditos y guardar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Nombre de la escena */}
          {isEditingTitle ? (
            <input
              className="font-bold focus:outline-none bg-transparent border-none"
              style={{
                fontFamily: 'var(--font-titulo)',
                fontSize: 'var(--font-titulo-size)',
                color: '#242423',
                minWidth: 120,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                boxShadow: 'none',
                borderRadius: 0,
              }}
              value={editingTitleValue}
              autoFocus
              onChange={(e) => setEditingTitleValue(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false)
                console.log('Título guardado (sin persistencia):', editingTitleValue)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setIsEditingTitle(false)
                  console.log('Título guardado (sin persistencia):', editingTitleValue)
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setEditingTitleValue(sceneName)
                  setIsEditingTitle(false)
                }
              }}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <h1
                  className="font-bold cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-titulo)',
                    fontSize: 'var(--font-titulo-size)',
                    color: '#242423',
                  }}
                  onClick={() => setIsEditingTitle(true)}
                >
                  {editingTitleValue.toUpperCase()}
                </h1>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>Click para editar</TooltipContent>
            </Tooltip>
          )}

          {/* Separador */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--color-oscuro)',
              margin: '0 8px',
            }}
          />

          {/* Créditos */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="font-semibold cursor-default"
                style={{
                  fontFamily: 'var(--font-etiqueta)',
                  fontSize: 'var(--font-etiqueta-size)',
                  fontWeight: 600,
                  color: 'var(--color-oscuro)',
                }}
              >
                {credits}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Créditos disponibles</TooltipContent>
          </Tooltip>

          {/* Separador */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--color-oscuro)',
              margin: '0 8px',
            }}
          />

          {/* Botón Guardar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onSave}>
                <IconCircleButtonLight svgIcon={IconoGuardado} aria-label="Guardar" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Guardar</TooltipContent>
          </Tooltip>
        </div>

        {/* Sección derecha: Resto de botones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Botón Deshacer */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onUndo}>
                <IconCircleButtonLight svgIcon={IconoIzquierda} aria-label="Deshacer" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Deshacer</TooltipContent>
          </Tooltip>

          {/* Botón Rehacer */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onRedo}>
                <IconCircleButtonLight svgIcon={IconoDerecha} aria-label="Rehacer" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Rehacer</TooltipContent>
          </Tooltip>

          {/* Separador */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--color-oscuro)',
              margin: '0 8px',
            }}
          />

          {/* Botón Renderizar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onRender}>
                <IconCircleButtonLight svgIcon={IconoCamara} aria-label="Renderizar" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Renderizar</TooltipContent>
          </Tooltip>

          {/* Botón Capas */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onLayers}>
                <IconCircleButtonLight svgIcon={IconoOjoVisible} aria-label="Capas" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Capas</TooltipContent>
          </Tooltip>

          {/* Botón Compartir */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onShare}>
                <IconCircleButtonLight svgIcon={IconoCompartir} aria-label="Compartir" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Compartir</TooltipContent>
          </Tooltip>

          {/* Separador */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--color-oscuro)',
              margin: '0 8px',
            }}
          />

          {/* Botón Borrar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onDelete}>
                <IconCircleButtonLight svgIcon={IconoBasura} aria-label="Borrar" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Borrar</TooltipContent>
          </Tooltip>

          {/* Separador */}
          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'var(--color-oscuro)',
              margin: '0 8px',
            }}
          />

          {/* Botón Ayuda */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onHelp}>
                <IconCircleButtonLight svgIcon={IconoMensajes} aria-label="¿Necesitas ayuda?" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>¿Necesitas ayuda?</TooltipContent>
          </Tooltip>

          {/* Botón Cerrar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span onClick={onClose}>
                <IconCircleButtonLight svgIcon={IconoCerrar} aria-label="Cerrar" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>Cerrar</TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}

