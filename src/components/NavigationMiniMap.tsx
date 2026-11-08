import React, { useState } from 'react';
import { 
  MapPin, 
  Maximize2, 
  Compass, 
  Sparkles, 
  Briefcase, 
  ShoppingBag, 
  Car, 
  X,
  Navigation,
  ZoomIn,
  ZoomOut,
  Target
} from 'lucide-react';

export interface MapDistrict {
  id: number;
  name: string;
  shortName: string;
  color: string;
  unlockedAtMission: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  description: string;
}

export const CITY_DISTRICTS: MapDistrict[] = [
  {
    id: 1,
    name: 'Bairro da Oficina & Praça Central',
    shortName: 'Centro & Oficina',
    color: '#38bdf8', // sky-400
    unlockedAtMission: 1,
    bounds: { minX: -50, maxX: 45, minZ: -48, maxZ: 45 },
    description: 'Oficina Theo Lucca, Pizzaria, Padaria, Mercado e Praça da Fonte!',
  },
  {
    id: 2,
    name: 'Bairro Comercial & Shopping Center',
    shortName: 'Shopping & Lojas',
    color: '#a855f7', // purple-500
    unlockedAtMission: 2,
    bounds: { minX: 40, maxX: 95, minZ: 0, maxZ: 70 },
    description: 'Shopping Center, Sorveteria, Praça das Palmeiras e Lojas de Brinquedos!',
  },
  {
    id: 3,
    name: 'Bairro Residencial & Complexo do Personal',
    shortName: 'Residencial & Academia',
    color: '#22c55e', // green-500
    unlockedAtMission: 3,
    bounds: { minX: -100, maxX: -45, minZ: -30, maxZ: 60 },
    description: 'Academia ao ar livre do Personal Inho, Quadra Esportiva e Casas dos Vizinhos!',
  },
  {
    id: 4,
    name: 'Orla Marítima & Calçadão Tropical',
    shortName: 'Praia & Marina',
    color: '#06b6d4', // cyan-500
    unlockedAtMission: 4,
    bounds: { minX: 65, maxX: 110, minZ: -95, maxZ: 10 },
    description: 'Píer de barcos, quiosques com coco gelado, areia dourada e lanchas no mar!',
  },
  {
    id: 5,
    name: 'Grande Metrópole & Torres dos Campeões',
    shortName: 'Metrópole & Torres',
    color: '#f59e0b', // amber-500
    unlockedAtMission: 5,
    bounds: { minX: -70, maxX: 50, minZ: -105, maxZ: -50 },
    description: 'Arranha-Céus espelhados, Heliponto, Grande Arco Theo Lucca e Canhões de Luz!',
  },
];

// Principais Ruas e Avenidas de Cidade Real 3D
const CITY_ROADS = [
  // Avenidas Centrais Duplas (X=0 e Z=0)
  { x1: 0, z1: -105, x2: 0, z2: 65, width: 8, isMain: true, label: 'Av. Central Theo Lucca' },
  { x1: -95, z1: 0, x2: 80, z2: 0, width: 8, isMain: true, label: 'Av. das Palmeiras' },
  // Ruas Secundárias de Cruzamento
  { x1: -45, z1: -85, x2: -45, z2: 55, width: 6, isMain: false, label: 'Rua do Comércio' },
  { x1: 45, z1: -85, x2: 45, z2: 55, width: 6, isMain: false, label: 'Rua da Oficina' },
  { x1: -85, z1: -45, x2: 80, z2: -45, width: 6, isMain: false, label: 'Rua Norte' },
  { x1: -85, z1: 45, x2: 80, z2: 45, width: 6, isMain: false, label: 'Rua Sul' },
  // Calçadão da Praia
  { x1: 78, z1: -95, x2: 78, z2: 12, width: 7, isMain: false, label: 'Calçadão da Orla' },
];

export interface NavigationMiniMapProps {
  playerX: number;
  playerZ: number;
  playerRotation: number;
  targetPos: { x: number; z: number; name?: string } | null;
  expansionLevel: number; // 1 a 5
  locations: { id: string; name: string; category: string; x: number; z: number }[];
  npcs: { name: string; role: string; gender: 'male' | 'female'; x: number; z: number }[];
  cars: { x: number; z: number; colorName: string }[];
  motos: { x: number; z: number; colorName: string }[];
  onOpenFullMap?: () => void;
  onSetGPSDestination?: (x: number, z: number, name: string) => void;
}

export const NavigationMiniMap: React.FC<NavigationMiniMapProps> = ({
  playerX,
  playerZ,
  playerRotation,
  targetPos,
  expansionLevel,
  locations,
  npcs,
  cars,
  motos,
  onOpenFullMap,
  onSetGPSDestination,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<MapDistrict | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'city' | 'local'>('city');

  // Limites da Cidade no Mapa (Área Jogável Ativa)
  const minX = -105;
  const maxX = 105;
  const minZ = -105;
  const maxZ = 65;

  // Projeção das Coordenadas do Mundo para o Mini-mapa SVG (0 a 100%)
  const worldToMap = (wx: number, wz: number, isZoomLocal = false) => {
    if (!isZoomLocal) {
      // Visão da Cidade Inteira: Theo Lucca se desloca livremente em tempo real
      const px = ((wx - minX) / (maxX - minX)) * 90 + 5;
      const pz = ((wz - minZ) / (maxZ - minZ)) * 90 + 5;
      return { 
        x: Math.max(3, Math.min(97, px)), 
        y: Math.max(3, Math.min(97, pz)) 
      };
    } else {
      // Zoom Local de Bairro (65m ao redor de Theo Lucca)
      const range = 65;
      const px = 50 + ((wx - playerX) / range) * 44;
      const pz = 50 + ((wz - playerZ) / range) * 44;
      return { 
        x: Math.max(3, Math.min(97, px)), 
        y: Math.max(3, Math.min(97, pz)) 
      };
    }
  };

  const isLocal = zoomLevel === 'local';
  const pPos = worldToMap(playerX, playerZ, isLocal);
  const tPos = targetPos ? worldToMap(targetPos.x, targetPos.z, isLocal) : null;

  // Distância exata até o Ponto da Missão
  const distanceToTarget = targetPos
    ? Math.hypot(targetPos.x - playerX, targetPos.z - playerZ)
    : 0;

  // Ângulo de rotação de Theo Lucca
  const arrowAngleDeg = (-playerRotation * 180) / Math.PI + 180;

  // Identifica bairro atual
  const currentDistrict = CITY_DISTRICTS.find((d) => {
    const b = d.bounds;
    return playerX >= b.minX && playerX <= b.maxX && playerZ >= b.minZ && playerZ <= b.maxZ;
  }) || CITY_DISTRICTS[0];

  return (
    <>
      {/* =========================================================================
          1. RADAR / MINIMAPA GTA NO HUD (ALTA VISIBILIDADE EM TEMPO REAL)
         ========================================================================= */}
      <div className="relative group select-none pointer-events-auto flex flex-col items-center">
        
        {/* CONTAINER DO RADAR GTA COM MOLDURA METÁLICA E BORDA DOURADA */}
        <div
          onClick={() => setIsExpanded(true)}
          className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-slate-950/95 border-[3px] border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.5)] overflow-hidden cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-md"
          title="Toque para abrir o Mapa de Navegação GPS Completo"
        >
          {/* Fundo com Grade Tática / Radar */}
          <div className="absolute inset-0 bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
            <div className="absolute inset-[18%] rounded-full border border-slate-700/50 pointer-events-none" />
            <div className="absolute inset-[38%] rounded-full border border-slate-700/30 pointer-events-none" />
          </div>

          {/* SVG DO MAPA: RUAS, BAIRROS, PEDESTRES E THEO LUCCA SE MOVENDO EM TEMPO REAL */}
          <svg className="absolute inset-0 w-full h-full p-1.5" viewBox="0 0 100 100">
            <defs>
              <filter id="gps-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Mar / Oceano Leste */}
            <rect
              x={worldToMap(78, -105, isLocal).x}
              y="0"
              width="25"
              height="100"
              fill="#0284c7"
              fillOpacity={expansionLevel >= 4 ? 0.35 : 0.15}
            />

            {/* 1. Bairros e Setores Desbloqueados da Cidade */}
            {CITY_DISTRICTS.map((dist) => {
              const b = dist.bounds;
              const p1 = worldToMap(b.minX, b.minZ, isLocal);
              const p2 = worldToMap(b.maxX, b.maxZ, isLocal);
              const rx = Math.min(p1.x, p2.x);
              const ry = Math.min(p1.y, p2.y);
              const rw = Math.abs(p2.x - p1.x);
              const rh = Math.abs(p2.y - p1.y);
              const isUnlocked = dist.unlockedAtMission <= expansionLevel;

              return (
                <g key={dist.id}>
                  <rect
                    x={rx}
                    y={ry}
                    width={rw}
                    height={rh}
                    rx="3"
                    fill={isUnlocked ? dist.color : '#0f172a'}
                    fillOpacity={isUnlocked ? 0.22 : 0.75}
                    stroke={isUnlocked ? dist.color : '#334155'}
                    strokeWidth={isUnlocked ? 1.2 : 0.8}
                    strokeDasharray={isUnlocked ? 'none' : '2,2'}
                  />
                  {!isUnlocked && rw > 12 && rh > 8 && (
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 + 1.5}
                      fontSize="4.2"
                      fill="#64748b"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      🔒 M{dist.unlockedAtMission}
                    </text>
                  )}
                </g>
              );
            })}

            {/* 2. Malha de Avenidas e Ruas Asfaltadas */}
            {CITY_ROADS.map((road, idx) => {
              const start = worldToMap(road.x1, road.z1, isLocal);
              const end = worldToMap(road.x2, road.z2, isLocal);

              return (
                <g key={`road-${idx}`}>
                  {/* Asfalto Escuro */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#475569"
                    strokeWidth={road.isMain ? 3.6 : 2.6}
                    strokeLinecap="round"
                  />
                  {/* Faixa Amarela Central das Avenidas */}
                  {road.isMain && (
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#facc15"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}

            {/* 3. Lojas e Locais Importantes (Blips com Letras Estilo GTA) */}
            {locations.slice(0, 10).map((loc) => {
              const pos = worldToMap(loc.x, loc.z, isLocal);
              return (
                <g key={loc.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="2.4"
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="0.7"
                  />
                </g>
              );
            })}

            {/* 4. Moradores da Cidade Andando em Tempo Real */}
            {npcs.map((npc, idx) => {
              const nPos = worldToMap(npc.x, npc.z, isLocal);
              return (
                <circle
                  key={`npc-${idx}`}
                  cx={nPos.x}
                  cy={nPos.y}
                  r="1.4"
                  fill={npc.gender === 'female' ? '#f43f5e' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="0.4"
                />
              );
            })}

            {/* 5. Carros e Motos em Trânsito em Tempo Real */}
            {cars.slice(0, 6).map((car, idx) => {
              const cPos = worldToMap(car.x, car.z, isLocal);
              return (
                <rect
                  key={`car-${idx}`}
                  x={cPos.x - 1.4}
                  y={cPos.y - 1.4}
                  width="2.8"
                  height="2.8"
                  rx="0.6"
                  fill="#f97316"
                  stroke="#ffffff"
                  strokeWidth="0.4"
                />
              );
            })}

            {/* ===================================================================
                6. TRILHA GPS E O PONTO DA MISSÃO SINALIZADO (★)
               =================================================================== */}
            {tPos && (
              <g>
                {/* Linha Guiada GPS em Amarelo Ouro de Theo Lucca até o Ponto */}
                <line
                  x1={pPos.x}
                  y1={pPos.y}
                  x2={tPos.x}
                  y2={tPos.y}
                  stroke="#facc15"
                  strokeWidth="2.2"
                  strokeDasharray="2.5,2"
                  strokeLinecap="round"
                  filter="url(#gps-glow)"
                />

                {/* Halo / Radar Ping do Ponto da Missão */}
                <circle
                  cx={tPos.x}
                  cy={tPos.y}
                  r="8"
                  fill="#f59e0b"
                  fillOpacity="0.45"
                  className="animate-ping"
                />

                {/* Círculo do Ponto da Missão */}
                <circle
                  cx={tPos.x}
                  cy={tPos.y}
                  r="4.6"
                  fill="#eab308"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  filter="url(#gps-glow)"
                />

                {/* Estrela Dourada do Ponto da Missão */}
                <text
                  x={tPos.x}
                  y={tPos.y + 1.6}
                  fontSize="5.2"
                  fill="#0f172a"
                  textAnchor="middle"
                  fontWeight="900"
                >
                  ★
                </text>
              </g>
            )}

            {/* ===================================================================
                7. THEO LUCCA SE MOVIMENTANDO EM TEMPO REAL NO MAPA
               =================================================================== */}
            <g transform={`translate(${pPos.x}, ${pPos.y})`}>
              {/* Cone de visão que gira com o personagem */}
              <path
                d="M 0 0 L -6 -15 L 6 -15 Z"
                fill="#38bdf8"
                fillOpacity="0.32"
                transform={`rotate(${arrowAngleDeg})`}
              />

              {/* Seta do Personagem (Aponta para onde Theo Lucca está olhando) */}
              <g transform={`rotate(${arrowAngleDeg})`}>
                <polygon
                  points="0,-5.5 4,4 0,1.5 -4,4"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
              </g>

              {/* Ponto Central do Jogador com Halo Neon */}
              <circle cx="0" cy="0" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
            </g>
          </svg>

          {/* BÚSSOLA GTA: NORTE NO TOPO */}
          <div className="absolute top-1.5 left-2 flex items-center gap-0.5 pointer-events-none">
            <span className="text-[10px] font-black font-mono text-amber-400 drop-shadow">N</span>
          </div>

          {/* BADGE DE NÍVEL DE EXPANSÃO */}
          <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-[8px] font-mono text-emerald-400 font-bold flex items-center gap-0.5 pointer-events-none shadow">
            <span>EXP {expansionLevel}/5</span>
          </div>

          {/* BOTÃO DE ZOOM (CIDADE / BAIRRO) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomLevel((prev) => (prev === 'city' ? 'local' : 'city'));
            }}
            className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-white text-[8px] font-mono font-bold shadow transition"
            title="Alternar Zoom da Cidade / Bairro"
          >
            {zoomLevel === 'city' ? 'ZOOM 2X' : 'CIDADE'}
          </button>

          {/* BOTÃO EXPANDIR EM TELA CHEIA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="absolute top-1.5 right-2 w-6 h-6 rounded-md bg-slate-900/90 border border-slate-700 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow transition"
            title="Expandir Mapa de Navegação Completo"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* =========================================================================
            CARD DO PONTO DA MISSÃO: NOME E DISTÂNCIA EM TEMPO REAL
           ========================================================================= */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="mt-1 w-full max-w-[176px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-xl px-2.5 py-1.5 shadow-2xl flex flex-col gap-0.5 cursor-pointer backdrop-blur-md transition hover:scale-105 active:scale-95"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-black font-['Rajdhani'] uppercase tracking-wider text-amber-400 flex items-center gap-1 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block flex-shrink-0" />
              PONTO DA MISSÃO
            </span>
            <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded flex-shrink-0 ${
              distanceToTarget <= 4.0 
                ? 'bg-emerald-500 text-slate-950 animate-bounce' 
                : 'bg-amber-400 text-slate-950'
            }`}>
              {distanceToTarget <= 4.0 ? 'CHEGOU!' : `${distanceToTarget.toFixed(0)}m`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white font-bold truncate">
            <span className="truncate">
              {targetPos?.name || currentDistrict.name}
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          2. MAPA DE NAVEGAÇÃO EXPANDIDO EM TELA CHEIA (MODAL GPS GTA)
         ========================================================================= */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md pointer-events-auto animate-fade-in font-sans">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400 rounded-3xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.5)] overflow-hidden">
            
            {/* CABEÇALHO DO GPS */}
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white font-['Rajdhani'] uppercase tracking-wider">
                      Mapa de Navegação GPS • Cidade Real 3D
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-[10px] font-black">
                      {expansionLevel} de 5 Bairros Abertos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    O ponto amarelo pulsante indica exatamente o seu objetivo na cidade!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition shadow"
                  title="Fechar Mapa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CONTEÚDO PRINCIPAL: MAPA 2D GRANDE COM TRILHA GPS E PONTO DE MISSÃO */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* ÁREA DO MAPA 2D VETORIAL DA CIDADE */}
              <div className="md:col-span-2 relative aspect-square bg-slate-950 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-35" />

                <svg className="w-full h-full p-2 select-none" viewBox="0 0 100 100">
                  {/* Mar / Oceano Leste */}
                  <rect
                    x={worldToMap(78, -105).x}
                    y="0"
                    width="25"
                    height="100"
                    fill="#0284c7"
                    fillOpacity={expansionLevel >= 4 ? 0.35 : 0.15}
                  />
                  <text x="91" y="50" fontSize="3" fill="#38bdf8" textAnchor="middle" transform="rotate(90, 91, 50)" fontWeight="bold">
                    OCEANO & PRAIA
                  </text>

                  {/* 5 Distritos Urbanos */}
                  {CITY_DISTRICTS.map((dist) => {
                    const b = dist.bounds;
                    const p1 = worldToMap(b.minX, b.minZ);
                    const p2 = worldToMap(b.maxX, b.maxZ);
                    const w = Math.abs(p2.x - p1.x);
                    const h = Math.abs(p2.y - p1.y);
                    const isUnlocked = dist.unlockedAtMission <= expansionLevel;
                    const isSelected = selectedDistrict?.id === dist.id;

                    return (
                      <g
                        key={dist.id}
                        className="cursor-pointer transition-opacity hover:opacity-90"
                        onClick={() => setSelectedDistrict(dist)}
                      >
                        <rect
                          x={Math.min(p1.x, p2.x)}
                          y={Math.min(p1.y, p2.y)}
                          width={w}
                          height={h}
                          rx="4"
                          fill={isUnlocked ? dist.color : '#0f172a'}
                          fillOpacity={isUnlocked ? (isSelected ? 0.38 : 0.22) : 0.85}
                          stroke={isUnlocked ? dist.color : '#475569'}
                          strokeWidth={isSelected ? 2.0 : (isUnlocked ? 1.2 : 0.8)}
                          strokeDasharray={isUnlocked ? 'none' : '3,2'}
                        />
                        
                        <text
                          x={Math.min(p1.x, p2.x) + 3}
                          y={Math.min(p1.y, p2.y) + 7}
                          fontSize="3.4"
                          fill={isUnlocked ? '#ffffff' : '#64748b'}
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {dist.shortName}
                        </text>

                        {!isUnlocked && (
                          <g transform={`translate(${Math.min(p1.x, p2.x) + w / 2}, ${Math.min(p1.y, p2.y) + h / 2})`}>
                            <rect x="-14" y="-5" width="28" height="10" rx="3" fill="#0f172a" stroke="#64748b" strokeWidth="0.6" />
                            <text x="0" y="2" fontSize="3.2" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">
                              🔒 Bloqueado (M{dist.unlockedAtMission})
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Malha Viária Principal (Avenidas) */}
                  {CITY_ROADS.map((road, idx) => {
                    const start = worldToMap(road.x1, road.z1);
                    const end = worldToMap(road.x2, road.z2);
                    return (
                      <line
                        key={`modal-road-${idx}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="#94a3b8"
                        strokeWidth={road.isMain ? 3.0 : 2.0}
                        strokeOpacity="0.45"
                      />
                    );
                  })}

                  {/* Pontos de Interesse (Lojas, Oficinas, Praças) */}
                  {locations.map((loc) => {
                    const pos = worldToMap(loc.x, loc.z);
                    return (
                      <g
                        key={loc.id}
                        className="cursor-pointer"
                        onClick={() => onSetGPSDestination?.(loc.x, loc.z, loc.name)}
                      >
                        <circle cx={pos.x} cy={pos.y} r="2.4" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                        <text x={pos.x} y={pos.y - 3} fontSize="2.8" fill="#e2e8f0" textAnchor="middle" fontWeight="600">
                          {loc.name.length > 14 ? loc.name.slice(0, 12) + '...' : loc.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* NPCs na Cidade */}
                  {npcs.map((npc, idx) => {
                    const nPos = worldToMap(npc.x, npc.z);
                    return (
                      <circle
                        key={`npc-m-${idx}`}
                        cx={nPos.x}
                        cy={nPos.y}
                        r="1.4"
                        fill={npc.gender === 'female' ? '#ec4899' : '#3b82f6'}
                        stroke="#ffffff"
                        strokeWidth="0.4"
                      />
                    );
                  })}

                  {/* Veículos em Trânsito */}
                  {cars.map((car, idx) => {
                    const cPos = worldToMap(car.x, car.z);
                    return (
                      <rect
                        key={`car-m-${idx}`}
                        x={cPos.x - 1.3}
                        y={cPos.y - 1.3}
                        width="2.6"
                        height="2.6"
                        rx="0.6"
                        fill="#f97316"
                        stroke="#ffffff"
                        strokeWidth="0.4"
                      />
                    );
                  })}

                  {/* LINHA DE ROTA GPS ATÉ O OBJETIVO */}
                  {tPos && (
                    <line
                      x1={worldToMap(playerX, playerZ).x}
                      y1={worldToMap(playerX, playerZ).y}
                      x2={worldToMap(targetPos!.x, targetPos!.z).x}
                      y2={worldToMap(targetPos!.x, targetPos!.z).y}
                      stroke="#facc15"
                      strokeWidth="2.0"
                      strokeDasharray="2.5,2"
                      strokeOpacity="0.95"
                    />
                  )}

                  {/* PONTO DA MISSÃO EM DESTAQUE NO MAPA GERAL */}
                  {targetPos && (() => {
                    const mPos = worldToMap(targetPos.x, targetPos.z);
                    return (
                      <g>
                        <circle cx={mPos.x} cy={mPos.y} r="8" fill="#f59e0b" fillOpacity="0.35" className="animate-ping" />
                        <circle cx={mPos.x} cy={mPos.y} r="4.2" fill="#eab308" stroke="#ffffff" strokeWidth="1.2" />
                        <text x={mPos.x} y={mPos.y + 1.4} fontSize="4.6" fill="#0f172a" textAnchor="middle" fontWeight="900">
                          ★
                        </text>
                        <text x={mPos.x} y={mPos.y + 8} fontSize="3.6" fill="#facc15" textAnchor="middle" fontWeight="black">
                          {targetPos.name ? (targetPos.name.length > 18 ? targetPos.name.slice(0, 16) + '...' : targetPos.name) : 'OBJETIVO'}
                        </text>
                      </g>
                    );
                  })()}

                  {/* THEO LUCCA (JOGADOR COM CONE DE VISÃO) */}
                  {(() => {
                    const pMap = worldToMap(playerX, playerZ);
                    return (
                      <g transform={`translate(${pMap.x}, ${pMap.y})`}>
                        <path
                          d="M 0 0 L -6 -14 L 6 -14 Z"
                          fill="#38bdf8"
                          fillOpacity="0.3"
                          transform={`rotate(${arrowAngleDeg})`}
                        />
                        <g transform={`rotate(${arrowAngleDeg})`}>
                          <polygon points="0,-4.5 3.5,3.5 0,1 -3.5,3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" />
                        </g>
                        <circle cx="0" cy="0" r="1.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
                      </g>
                    );
                  })()}
                </svg>

                {/* Bússola no Canto */}
                <div className="absolute top-2 left-2 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>NORTE</span>
                </div>
              </div>

              {/* PAINEL LATERAL: PONTO DA MISSÃO ATUAL & DETALHES DOS BAIRROS */}
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-2 border-amber-400 rounded-2xl p-3 space-y-1.5 shadow-lg">
                  <span className="text-xs font-black font-['Rajdhani'] uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-400 animate-spin" />
                    Ponto da Missão Atual
                  </span>

                  <p className="text-sm font-black text-white font-['Rajdhani'] uppercase">
                    {targetPos?.name || 'Oficina Theo Lucca (Trabalhar)'}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Distância até o ponto:</span>
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                      {distanceToTarget <= 4.0 ? 'CHEGOU AO PONTO!' : `${distanceToTarget.toFixed(1)} metros`}
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-200/90 leading-tight">
                    Siga a linha amarela no minimapa ou o feixe dourado de luz no céu da cidade!
                  </p>
                </div>

                {/* LISTA DOS BAIRROS */}
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-52 pr-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                    Bairros da Cidade:
                  </span>
                  {CITY_DISTRICTS.map((dist) => {
                    const isUnlocked = dist.unlockedAtMission <= expansionLevel;
                    return (
                      <div
                        key={dist.id}
                        onClick={() => setSelectedDistrict(dist)}
                        className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 text-xs ${
                          isUnlocked
                            ? 'bg-slate-900/90 border-slate-700 hover:border-amber-400 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: isUnlocked ? dist.color : '#475569' }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold truncate text-[11px] leading-tight">
                              {dist.name}
                            </p>
                            <p className="text-[9px] text-slate-400 truncate">
                              {dist.description}
                            </p>
                          </div>
                        </div>

                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap ${
                          isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isUnlocked ? 'ABERTO' : `MISSÃO ${dist.unlockedAtMission}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* LEGENDA DE ÍCONES */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-[10px] text-slate-400 grid grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span>Theo Lucca (Você)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span>Ponto da Missão (★)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                    <span>Carros & Motos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
                    <span>Moradores (NPCs)</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
};
