"use client";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function IntakeDistributionChart() {
  // Example data
  const data = [
    { name: "2024A", value: 40, color: "#2563eb" },
    { name: "2024B", value: 35, color: "#22d3ee" },
    { name: "2025A", value: 25, color: "#a21caf" },
    { name: "2025B", value: 20, color: "#f59e42" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Intake Distribution</CardTitle>
        <CardDescription>Student count by intake</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] w-full flex items-center justify-center">
          <ChartContainer
            config={Object.fromEntries(
              data.map((d) => [d.name, { color: d.color }]),
            )}
          >
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
