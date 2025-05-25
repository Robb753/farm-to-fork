"use client";

import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const data = [
  { name: "Utilisateurs", value: 60 },
  { name: "Producteurs", value: 30 },
  { name: "Admins", value: 10 },
];

const COLORS = ["#34d399", "#60a5fa", "#c084fc"];

export default function AppPieChart() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <PieChart width={280} height={280}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}
