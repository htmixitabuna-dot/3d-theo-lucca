import React, { useState } from 'react';
import { 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Lock, 
  Sparkles, 
  Briefcase, 
  ShoppingBag, 
  Car, 
  X,
  Volume2,
  Navigation
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
    unlockedAtMission: 1, // Já inicia desbloqueado
    bounds: { minX: -50, maxX: 45, minZ: -48, maxZ: 45 },
    description: 'Oficina Theo Lucca, Pizzaria, Padaria, Mercado e Praça da Fonte!',
  },
  {
    id: 2,
    name: 'Bairro Comercial & Shopping Center',
    shortName: 'Shopping & Lojas',
    color: '#a855f7', // purple-500
    unlockedAtMission: 2, // Desbloqueia ao cumprir Missão 1
    bounds: { minX: 40, maxX: 95, minZ: 0, maxZ: 70 },
    description: 'Shopping Center, Sorveteria, Praça das Palmeiras e Lojas de Brinquedos!',
  },
  {
    id: 3,
    name: 'Bairro Residencial & Complexo do Personal',
    shortName: 'Residencial & Academia',
    color: '#22c55e', // green-500
    unlockedAtMission: 3, // Desbloqueia ao cumprir Missão 2
    bounds: { minX: -100, maxX: -45, minZ: -30, maxZ: 60 },
    description: 'Academia ao ar livre do Personal Inho, Quadra Esportiva e Casas dos Vizinhos!',
  },
  {
    id: 4,
    name: 'Orla Marítima & Calçadão Tropical',
    shortName: 'Praia & Marina',
    color: '#06b6d4', // cyan-500
    unlockedAtMission: 4, // Desbloqueia ao cumprir Missão 3
    bounds: { minX: 65, maxX: 110, minZ: -95, maxZ: 10 },
    description: 'Píer de barcos, quiosques com coco gelado, areia dourada e lanchas no mar!',
  },
  {
    id: 5,
    name: 'Grande Metrópole & Torres dos Campeões',
    shortName: 'Metrópole & Torres',
    color: '#f59e0b', // amber-500
    unlockedAtMission: 5, // Desbloqueia ao cumprir Missão 4 e 5
    bounds: { minX: -70, maxX: 50, minZ: -105, maxZ: -50 },
    description: 'Arranha-Céus espelhados, Heliponto, Grande Arco Theo Lucca e Canhões de Luz!',
  },
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

  // Mapeamento de coordenadas do mundo (-110 a +110) para SVG (0 a 100%)
  const worldToMap = (x: number, z: number) => {
    const range = 230; // -115 até +115
    const px = ((x + 115) / range) * 100;
    const pz = ((z + 115) / range) * 100;
    return { x: Math.max(2, Math.min(98, px)), y: Math.max(2, Math.min(98, pz)) };
  };

  const pPos = worldToMap(playerX, playerZ);
  const tPos = targetPos ? worldToMap(targetPos.x, targetPos.z) : null;

  // Ângulo de rotação do ponteiro (Three.js playerRotationY)
  const arrowAngleDeg = (-playerRotation * 180) / Math.PI + 180;

  return (
    <>
      {/* =========================================================================
          1. RADAR / MINIMAPA COMPACTO NO HUD (CANTO SUPERIOR DIREITO)
         ========================================================================= */}
      <div className="relative group select-none pointer-events-auto">
        <div
          onClick={() => setIsExpanded(true)}
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950/95 border-2 border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.3)] overflow-hidden cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-md"
          title="Toque para abrir o Mapa de Navegação GPS Completo"
        >
          {/* Fundo de Grade Urbana / Bússola */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:10px_10px] opacity-40" />

          {/* SVG com Setores Desbloqueados e Ruas da Cidade */}
          <svg className="absolute inset-0 w-full h-full p-1" viewBox="0 0 100 100">
            {/* Setores da Cidade */}
            {CITY_DISTRICTS.map((dist) => {
              const b = dist.bounds;
              const p1 = worldToMap(b.minX, b.minZ);
              const p2 = worldToMap(b.maxX, b.maxZ);
              const w = Math.abs(p2.x - p1.x);
              const h = Math.abs(p2.y - p1.y);
              const isUnlocked = dist.unlockedAtMission <= expansionLevel;

              return (
                <g key={dist.id}>
                  <rect
                    x={Math.min(p1.x, p2.x)}
                    y={Math.min(p1.y, p2.y)}
                    width={w}
                    height={h}
                    rx="3"
                    fill={isUnlocked ? dist.color : '#0f172a'}
                    fillOpacity={isUnlocked ? 0.22 : 0.75}
                    stroke={isUnlocked ? dist.color : '#334155'}
                    strokeWidth={isUnlocked ? 1.2 : 0.8}
                    strokeDasharray={isUnlocked ? 'none' : '2,2'}
                  />
                  {!isUnlocked && (
                    <text
                      x={Math.min(p1.x, p2.x) + w / 2}
                      y={Math.min(p1.y, p2.y) + h / 2 + 2}
                      fontSize="5"
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

            {/* Avenidas Principais Desbloqueadas */}
            <path
              d="M 50 0 L 50 100 M 0 50 L 100 50"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeOpacity="0.5"
            />
            {/* Orla da Praia */}
            <path
              d="M 82 0 L 82 100"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="2,2"
              strokeOpacity={expansionLevel >= 4 ? 0.8 : 0.2}
            />

            {/* Ícones de Locais Importantes */}
            {locations.slice(0, 8).map((loc) => {
              const pos = worldToMap(loc.x, loc.z);
              return (
                <circle
                  key={loc.id}
                  cx={pos.x}
                  cy={pos.y}
                  r="2"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="0.6"
                />
              );
            })}

            {/* Veículos em movimento no radar */}
            {cars.slice(0, 4).map((car, idx) => {
              const cPos = worldToMap(car.x, car.z);
              return (
                <rect
                  key={`c-${idx}`}
                  x={cPos.x - 1.2}
                  y={cPos.y - 1.2}
                  width="2.4"
                  height="2.4"
                  rx="0.5"
                  fill="#f97316"
                />
              );
            })}

            {/* Objetivo Atual Pulsante (Estrela/Ponto Dourado) */}
            {tPos && (
              <g>
                <circle
                  cx={tPos.x}
                  cy={tPos.y}
                  r="4.5"
                  fill="#f59e0b"
                  fillOpacity="0.4"
                  className="animate-ping"
                />
                <circle
                  cx={tPos.x}
                  cy={tPos.y}
                  r="3"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
              </g>
            )}

            {/* Posição do Theo Lucca (Ponteiro Azul Claro com Direção) */}
            <g transform={`translate(${pPos.x}, ${pPos.y}) rotate(${arrowAngleDeg})`}>
              <polygon
                points="0,-4 3,3 0,1 -3,3"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="0.8"
              />
            </g>
          </svg>

          {/* Badge Bússola & Expansão */}
          <div className="absolute top-1 left-1.5 flex items-center gap-0.5 pointer-events-none">
            <span className="text-[8px] font-black font-mono text-amber-400">N</span>
          </div>

          <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-slate-900/90 border border-slate-700 text-[8px] font-mono text-emerald-400 font-bold flex items-center gap-0.5 pointer-events-none">
            <span>EXP {expansionLevel}/5</span>
          </div>

          {/* Botão de Abrir GPS Maior no canto superior */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="absolute top-1 right-1 w-5 h-5 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Expandir Mapa de Navegação"
          >
            <Maximize2 className="w-3 h-3 text-amber-400" />
          </button>
        </div>

        <div className="text-[8px] font-bold font-['Rajdhani'] uppercase tracking-wider text-center text-slate-300 mt-0.5 drop-shadow">
          GPS NAV • THEO LUCCA
        </div>
      </div>

      {/* =========================================================================
          2. MAPA DE NAVEGAÇÃO EXPANDIDO EM TELA CHEIA / MODAL GPS
         ========================================================================= */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md pointer-events-auto animate-fade-in font-sans">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400 rounded-3xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.4)] overflow-hidden">
            
            {/* CABEÇALHO DO GPS */}
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white font-['Rajdhani'] uppercase tracking-wider">
                      Mapa de Navegação GPS • Cidade Real 3D
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-[10px] font-black">
                      {expansionLevel} de 5 Bairros Abertos ({Math.round((expansionLevel / 5) * 100)}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    A cada missão cumprida, novos bairros e avenidas se expandem no mapa!
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

            {/* CONTEÚDO PRINCIPAL: MAPA INTERATIVO GRANDE + BARRA LATERAL */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* ÁREA DO MAPA 2D VETORIAL DA CIDADE */}
              <div className="md:col-span-2 relative aspect-square bg-slate-950 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                {/* Grade de fundo */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-35" />

                <svg className="w-full h-full p-2 select-none" viewBox="0 0 100 100">
                  {/* Mar / Oceano Leste */}
                  <rect
                    x="82"
                    y="0"
                    width="18"
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
                          fillOpacity={isUnlocked ? (isSelected ? 0.35 : 0.22) : 0.85}
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
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#94a3b8" strokeWidth="2.8" strokeOpacity="0.4" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#94a3b8" strokeWidth="2.8" strokeOpacity="0.4" />
                  <line x1="25" y1="0" x2="25" y2="100" stroke="#64748b" strokeWidth="1.4" strokeOpacity="0.3" />
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#64748b" strokeWidth="1.4" strokeOpacity="0.3" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#64748b" strokeWidth="1.4" strokeOpacity="0.3" />

                  {/* Pontos de Interesse (Lojas, Oficinas, Praças) */}
                  {locations.map((loc) => {
                    const pos = worldToMap(loc.x, loc.z);
                    return (
                      <g
                        key={loc.id}
                        className="cursor-pointer"
                        onClick={() => onSetGPSDestination?.(loc.x, loc.z, loc.name)}
                      >
                        <circle cx={pos.x} cy={pos.y} r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.7" />
                        <text x={pos.x} y={pos.y - 3} fontSize="2.8" fill="#e2e8f0" textAnchor="middle" fontWeight="600">
                          {loc.name.length > 14 ? loc.name.slice(0, 12) + '...' : loc.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* NPCs na Cidade (Homens 👨 e Mulheres 👩) */}
                  {npcs.map((npc, idx) => {
                    const nPos = worldToMap(npc.x, npc.z);
                    return (
                      <circle
                        key={`npc-${idx}`}
                        cx={nPos.x}
                        cy={nPos.y}
                        r="1.4"
                        fill={npc.gender === 'female' ? '#ec4899' : '#3b82f6'}
                        stroke="#ffffff"
                        strokeWidth="0.4"
                      />
                    );
                  })}

                  {/* Veículos em Trânsito (Carros 🚗 e Motos 🏍️) */}
                  {cars.map((car, idx) => {
                    const cPos = worldToMap(car.x, car.z);
                    return (
                      <rect
                        key={`car-${idx}`}
                        x={cPos.x - 1.2}
                        y={cPos.y - 1.2}
                        width="2.4"
                        height="2.4"
                        rx="0.6"
                        fill="#f97316"
                        stroke="#ffffff"
                        strokeWidth="0.4"
                      />
                    );
                  })}

                  {/* Objetivo Ativo Pulsante */}
                  {tPos && (
                    <g>
                      <circle cx={tPos.x} cy={tPos.y} r="6" fill="#f59e0b" fillOpacity="0.3" className="animate-ping" />
                      <circle cx={tPos.x} cy={tPos.y} r="3.2" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.9" />
                      <text x={tPos.x} y={tPos.y + 6} fontSize="3.2" fill="#facc15" textAnchor="middle" fontWeight="black">
                        ★ OBJETIVO
                      </text>
                    </g>
                  )}

                  {/* Theo Lucca (Jogador com Cone de Visão) */}
                  <g transform={`translate(${pPos.x}, ${pPos.y})`}>
                    {/* Raio de Visão */}
                    <path
                      d="M 0 0 L -6 -14 L 6 -14 Z"
                      fill="#38bdf8"
                      fillOpacity="0.25"
                      transform={`rotate(${arrowAngleDeg})`}
                    />
                    {/* Seta do Personagem */}
                    <g transform={`rotate(${arrowAngleDeg})`}>
                      <polygon points="0,-4.5 3.5,3.5 0,1 -3.5,3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                    </g>
                    {/* Ponto Central */}
                    <circle cx="0" cy="0" r="1.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.5" />
                  </g>
                </svg>

                {/* Bússola no Canto */}
                <div className="absolute top-2 left-2 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>NORTE</span>
                </div>
              </div>

              {/* PAINEL LATERAL: DETALHES DOS BAIRROS & STATUS DE EXPANSÃO */}
              <div className="flex flex-col gap-3">
                {/* CARD DE PROGRESSO DE EXPANSÃO DA CIDADE */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-['Rajdhani'] uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Status de Expansão
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-300">
                      Nível {expansionLevel}/5
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${(expansionLevel / 5) * 100}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    {expansionLevel === 1 && 'Complete o Primeiro Trabalho na cidade para desbloquear o Bairro Comercial e o Shopping!'}
                    {expansionLevel === 2 && 'Colete as Moedas pela cidade para desbloquear o Complexo Esportivo do Personal Inho!'}
                    {expansionLevel === 3 && 'Compre a Bola de Futebol na Loja para abrir a Grande Orla e a Praia com Barcos!'}
                    {expansionLevel === 4 && 'Entregue as Pizzas para abrir os Arranha-Céus e o Centro Metropolitano!'}
                    {expansionLevel >= 5 && '🏆 CIDADE 100% EXPANDIDA! Você desbloqueou todos os bairros e a grande metrópole!'}
                  </p>
                </div>

                {/* LISTA DOS 5 BAIRROS */}
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-56 pr-1">
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
                    <span>Objetivo da Missão</span>
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
