"use client";

import React from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps 
} from "recharts";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour AppPieChart
 */
interface AppPieChartProps {
  /** Classe CSS personnalisée */
  className?: string;
  /** Taille du graphique */
  size?: number;
  /** Données personnalisées (optionnel) */
  data?: PieDataItem[];
  /** Afficher les labels sur les segments */
  showLabels?: boolean;
  /** Afficher la légende */
  showLegend?: boolean;
  /** Rayon extérieur du graphique */
  outerRadius?: number;
  /** Rayon intérieur pour créer un donut chart */
  innerRadius?: number;
  /** Couleurs personnalisées */
  customColors?: string[];
}

interface PieDataItem {
  name: string;
  value: number;
  description?: string;
}

/**
 * Données par défaut du graphique
 */
const DEFAULT_DATA: PieDataItem[] = [
  { 
    name: "Utilisateurs", 
    value: 60, 
    description: "Consommateurs utilisant la plateforme" 
  },
  { 
    name: "Producteurs", 
    value: 30, 
    description: "Agriculteurs et producteurs locaux" 
  },
  { 
    name: "Admins", 
    value: 10, 
    description: "Administrateurs de la plateforme" 
  },
];

/**
 * Couleurs par défaut du graphique alignées avec le design system
 */
const DEFAULT_CHART_COLORS: string[] = [
  COLORS.SUCCESS,   // Vert pour les utilisateurs
  COLORS.PRIMARY,   // Vert principal pour les producteurs  
  COLORS.INFO,      // Bleu pour les admins
];

/**
 * Tooltip personnalisé avec design system
 */
interface CustomTooltipProps extends TooltipProps<number, string> {
  data?: PieDataItem[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload,
  data = DEFAULT_DATA 
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const currentData = payload[0];
  const dataItem = data.find(item => item.name === currentData.name);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const percentage = ((currentData.value || 0) / total * 100).toFixed(1);

  return (
    <div 
      className="rounded-lg border shadow-lg p-3 min-w-[160px]"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: currentData.color }}
        />
        <span 
          className="font-medium"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {currentData.name}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span 
            className="text-sm"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Valeur:
          </span>
          <span 
            className="font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {currentData.value}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span 
            className="text-sm"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Pourcentage:
          </span>
          <span 
            className="font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {dataItem?.description && (
        <div 
          className="mt-2 pt-2 border-t"
          style={{ borderColor: COLORS.BORDER }}
        >
          <p 
            className="text-xs leading-relaxed"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            {dataItem.description}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Composant de légende personnalisée
 */
interface CustomLegendProps {
  data: PieDataItem[];
  colors: string[];
}

const CustomLegend: React.FC<CustomLegendProps> = ({ data, colors }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="mt-4 space-y-2">
      {data.map((item, index) => {
        const percentage = ((item.value / total) * 100).toFixed(1);
        
        return (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index] }}
              />
              <span 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {item.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span 
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {item.value}
              </span>
              <span 
                className="text-xs"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                ({percentage}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Hook pour calculer les statistiques du graphique
 */
const usePieStats = (data: PieDataItem[]) => {
  return React.useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const largest = data.reduce((max, item) => 
      item.value > max.value ? item : max
    );
    const smallest = data.reduce((min, item) => 
      item.value < min.value ? item : min
    );
    
    return {
      total,
      largest,
      smallest,
      average: Math.round(total / data.length),
      categories: data.length,
    };
  }, [data]);
};

/**
 * Composant AppPieChart principal
 * 
 * Features:
 * - Graphique en secteurs (pie chart) avec Recharts
 * - Tooltip personnalisé avec pourcentages et descriptions
 * - Légende personnalisée avec statistiques
 * - Support pour donut chart (innerRadius)
 * - Couleurs du design system intégrées
 * - Responsive design
 * - Données configurables
 * - Statistiques calculées automatiquement
 * - Labels optionnels sur les segments
 * 
 * @param props - Configuration du graphique
 * @returns Composant graphique en secteurs
 */
const AppPieChart: React.FC<AppPieChartProps> = ({
  className = "",
  size = 280,
  data = DEFAULT_DATA,
  showLabels = true,
  showLegend = true,
  outerRadius = 80,
  innerRadius = 0,
  customColors = DEFAULT_CHART_COLORS,
}) => {
  const stats = usePieStats(data);

  // Validation des données
  if (!data || data.length === 0) {
    return (
      <div 
        className={cn("w-full h-full flex items-center justify-center", className)}
        style={{ height: size }}
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

  // S'assurer qu'on a assez de couleurs
  const colors = data.map((_, index) => 
    customColors[index % customColors.length]
  );

  const renderCustomLabel = (entry: any) => {
    const percentage = ((entry.value / stats.total) * 100).toFixed(1);
    return `${percentage}%`;
  };

  return (
    <div className={cn("w-full h-full", className)}>
      {/* En-tête avec statistiques */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div 
            className="text-xl font-bold"
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
        
        <div>
          <div 
            className="text-xl font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {stats.categories}
          </div>
          <div 
            className="text-xs"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Catégories
          </div>
        </div>
        
        <div>
          <div 
            className="text-xl font-bold"
            style={{ color: colors[data.indexOf(stats.largest)] }}
          >
            {stats.largest.value}
          </div>
          <div 
            className="text-xs"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Maximum
          </div>
        </div>
        
        <div>
          <div 
            className="text-xl font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {stats.average}
          </div>
          <div 
            className="text-xs"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Moyenne
          </div>
        </div>
      </div>

      {/* Graphique principal */}
      <div className="flex items-center justify-center">
        <ResponsiveContainer width={size} height={size}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              label={showLabels ? renderCustomLabel : false}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index]}
                  stroke={COLORS.BG_WHITE}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            
            <Tooltip 
              content={<CustomTooltip data={data} />}
            />
            
            {!showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Légende personnalisée */}
      {showLegend && (
        <CustomLegend data={data} colors={colors} />
      )}

      {/* Informations supplémentaires */}
      <div 
        className="mt-4 p-3 rounded-lg"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: COLORS.TEXT_SECONDARY }}>
            Catégorie dominante:
          </span>
          <span 
            className="font-medium"
            style={{ color: colors[data.indexOf(stats.largest)] }}
          >
            {stats.largest.name} ({((stats.largest.value / stats.total) * 100).toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppPieChart;

/**
 * Export des types pour utilisation externe
 */
export type { AppPieChartProps, PieDataItem };