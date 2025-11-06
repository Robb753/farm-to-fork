"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour AppBarChart
 */
interface AppBarChartProps {
  /** Classe CSS personnalisée */
  className?: string;
  /** Hauteur personnalisée du graphique */
  height?: number;
  /** Données personnalisées (optionnel) */
  data?: ChartDataItem[];
  /** Afficher la grille */
  showGrid?: boolean;
  /** Couleurs personnalisées */
  colors?: ChartColors;
}

interface ChartDataItem {
  name: string;
  utilisateurs: number;
  producteurs: number;
}

interface ChartColors {
  utilisateurs: string;
  producteurs: string;
  grid?: string;
  text?: string;
}

/**
 * Configuration des couleurs par défaut du graphique
 */
const DEFAULT_COLORS: ChartColors = {
  utilisateurs: COLORS.INFO, // Bleu pour les utilisateurs
  producteurs: COLORS.SUCCESS, // Vert pour les producteurs
  grid: COLORS.BORDER,
  text: COLORS.TEXT_SECONDARY,
};

/**
 * Données par défaut du graphique (semaine type)
 */
const DEFAULT_DATA: ChartDataItem[] = [
  { name: "Lun", utilisateurs: 10, producteurs: 2 },
  { name: "Mar", utilisateurs: 15, producteurs: 3 },
  { name: "Mer", utilisateurs: 12, producteurs: 4 },
  { name: "Jeu", utilisateurs: 18, producteurs: 5 },
  { name: "Ven", utilisateurs: 20, producteurs: 6 },
  { name: "Sam", utilisateurs: 8, producteurs: 2 },
  { name: "Dim", utilisateurs: 5, producteurs: 1 },
];

/**
 * Tooltip personnalisé avec design system
 */
interface CustomTooltipProps extends TooltipProps<number, string> {
  colors?: ChartColors;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label,
  colors = DEFAULT_COLORS 
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div 
      className="rounded-lg border shadow-lg p-3 min-w-[140px]"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      <p 
        className="font-medium mb-2"
        style={{ color: COLORS.TEXT_PRIMARY }}
      >
        {label}
      </p>
      
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span 
                className="text-sm capitalize"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {entry.dataKey}
              </span>
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
      
      {/* Total */}
      <div 
        className="mt-2 pt-2 border-t flex items-center justify-between"
        style={{ borderColor: COLORS.BORDER }}
      >
        <span 
          className="text-sm font-medium"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Total
        </span>
        <span 
          className="text-sm font-bold"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {payload.reduce((sum, entry) => sum + (entry.value || 0), 0)}
        </span>
      </div>
    </div>
  );
};

/**
 * Hook pour calculer les statistiques des données
 */
const useChartStats = (data: ChartDataItem[]) => {
  return React.useMemo(() => {
    const totalUtilisateurs = data.reduce((sum, item) => sum + item.utilisateurs, 0);
    const totalProducteurs = data.reduce((sum, item) => sum + item.producteurs, 0);
    const maxDay = data.reduce((max, item) => 
      (item.utilisateurs + item.producteurs) > (max.utilisateurs + max.producteurs) ? item : max
    );
    
    return {
      totalUtilisateurs,
      totalProducteurs,
      total: totalUtilisateurs + totalProducteurs,
      maxDay,
      averagePerDay: Math.round((totalUtilisateurs + totalProducteurs) / data.length),
    };
  }, [data]);
};

/**
 * Composant AppBarChart principal
 * 
 * Features:
 * - Graphique en barres empilées avec Recharts
 * - Tooltip personnalisé avec design system
 * - Données typées et configurables
 * - Couleurs du design system intégrées
 * - Responsive design optimisé
 * - Statistiques calculées automatiquement
 * - Grille optionnelle
 * - Props configurables pour réutilisabilité
 * 
 * @param props - Configuration du graphique
 * @returns Composant graphique en barres
 */
const AppBarChart: React.FC<AppBarChartProps> = ({
  className = "",
  height = 280,
  data = DEFAULT_DATA,
  showGrid = true,
  colors = DEFAULT_COLORS,
}) => {
  const stats = useChartStats(data);

  // Validation des données
  if (!data || data.length === 0) {
    return (
      <div 
        className={cn("w-full h-full flex items-center justify-center", className)}
        style={{ height }}
      >
        <div 
          className="text-center"
          style={{ color: COLORS.TEXT_MUTED }}
        >
          <p className="text-sm">Aucune donnée à afficher</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full", className)}>
      {/* En-tête avec statistiques */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div 
            className="text-2xl font-bold"
            style={{ color: colors.utilisateurs }}
          >
            {stats.totalUtilisateurs}
          </div>
          <div 
            className="text-xs"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Utilisateurs
          </div>
        </div>
        
        <div className="text-center">
          <div 
            className="text-2xl font-bold"
            style={{ color: colors.producteurs }}
          >
            {stats.totalProducteurs}
          </div>
          <div 
            className="text-xs"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Producteurs
          </div>
        </div>
        
        <div className="text-center">
          <div 
            className="text-2xl font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {stats.total}
          </div>
          <div 
            className="text-xs"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Total
          </div>
        </div>
        
        <div className="text-center">
          <div 
            className="text-2xl font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {stats.averagePerDay}
          </div>
          <div 
            className="text-xs"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Moy./jour
          </div>
        </div>
      </div>

      {/* Graphique principal */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={colors.grid}
              opacity={0.3}
            />
          )}
          
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: colors.text }}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          
          <YAxis 
            tick={{ fontSize: 12, fill: colors.text }}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          
          <Tooltip 
            content={<CustomTooltip colors={colors} />}
            cursor={{ fill: COLORS.BG_GRAY, opacity: 0.1 }}
          />
          
          <Bar 
            dataKey="utilisateurs" 
            stackId="a" 
            fill={colors.utilisateurs}
            radius={[0, 0, 0, 0]}
            name="Utilisateurs"
          />
          
          <Bar 
            dataKey="producteurs" 
            stackId="a" 
            fill={colors.producteurs}
            radius={[4, 4, 0, 0]} // Coins arrondis sur le haut
            name="Producteurs"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Légende */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: colors.utilisateurs }}
          />
          <span 
            className="text-sm"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Utilisateurs
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: colors.producteurs }}
          />
          <span 
            className="text-sm"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Producteurs
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppBarChart;

/**
 * Export des types pour utilisation externe
 */
export type { AppBarChartProps, ChartDataItem, ChartColors };