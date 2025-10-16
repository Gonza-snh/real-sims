import { ToolbarButton } from "@/components/ui/icon-circle-button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";

interface ToolbarButtonConfig {
  id: string;
  icon?: any;
  tooltip?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  iconRotation?: number; // Rotación del icono en grados
}

interface ToolbarProps {
  buttons: ToolbarButtonConfig[];
  activeTool?: string
  onToolChange?: (tool: string, buttonElement?: HTMLElement) => void;
  position?: 'bottom' | 'top';
  offset?: number;
}

export default function Toolbar({ 
  buttons, 
  activeTool = "mover", 
  onToolChange, 
  position = 'bottom',
  offset = 20
}: ToolbarProps) {
  
  const [selectedButton, setSelectedButton] = useState<string>(activeTool);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasCenter, setCanvasCenter] = useState(0);

  // Calcular el centro de la pantalla
  useEffect(() => {
    const updateCanvasCenter = () => {
      // Centrar en la pantalla
      setCanvasCenter(window.innerWidth / 2);
    };

    updateCanvasCenter();
    window.addEventListener('resize', updateCanvasCenter);
    return () => window.removeEventListener('resize', updateCanvasCenter);
  }, []);

  const handleSelect = (tool: string, buttonElement?: HTMLElement) => {
    setSelectedButton(tool);
    if (onToolChange) onToolChange(tool, buttonElement);
  };

  // Agrupar botones por separadores
  const groupedButtons = buttons.reduce((groups, button, index) => {
    if (index > 0 && button.id === 'separator') {
      groups.push([button]);
    } else if (button.id === 'separator') {
      groups.push([button]);
    } else {
      if (groups.length === 0) groups.push([]);
      groups[groups.length - 1].push(button);
    }
    return groups;
  }, [] as ToolbarButtonConfig[][]);

  return (
    <TooltipProvider>
      <div
        data-toolbar-barra
        style={{
          position: 'fixed',
          left: `${canvasCenter}px`,
          [position]: offset,
          transform: 'translateX(-50%)',
          background: '#fff',
          borderRadius: 0,
          boxShadow: '0 2px 8px 0 rgba(23,34,59,0.08)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px',
          border: '1px solid #EFE9D3',
        }}>
        
        {groupedButtons.map((group, groupIndex) => (
          <div
            key={groupIndex}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {group.map((button, buttonIndex) => {
              if (button.id === 'separator') {
                return (
                  <div
                    key={`separator-${groupIndex}-${buttonIndex}`}
                    style={{
                      width: '1px',
                      height: '24px',
                      backgroundColor: '#EFE9D3',
                      margin: '0 5px',
                    }}
                  />
                );
              }

              return (
                <ToolbarButton
                  key={button.id}
                  svgIcon={button.icon}
                  tooltip={button.tooltip || ''}
                  selected={selectedButton === button.id}
                  disabled={button.disabled}
                  onClick={() => handleSelect(button.id)}
                  iconRotation={button.iconRotation}
                />
              );
            })}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
