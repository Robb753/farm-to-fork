"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { name: "Lun", utilisateurs: 10, producteurs: 2 },
  { name: "Mar", utilisateurs: 15, producteurs: 3 },
  { name: "Mer", utilisateurs: 12, producteurs: 4 },
  { name: "Jeu", utilisateurs: 18, producteurs: 5 },
  { name: "Ven", utilisateurs: 20, producteurs: 6 },
  { name: "Sam", utilisateurs: 8, producteurs: 2 },
  { name: "Dim", utilisateurs: 5, producteurs: 1 },
];

export default function AppBarChart() {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="utilisateurs" stackId="a" fill="#60a5fa" />
          <Bar dataKey="producteurs" stackId="a" fill="#34d399" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
